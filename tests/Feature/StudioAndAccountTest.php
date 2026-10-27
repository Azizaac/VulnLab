<?php

namespace Tests\Feature;

use App\Models\ContentEntry;
use App\Models\ContentRevision;
use App\Models\Lab;
use App\Models\LabSession;
use App\Models\Lesson;
use App\Models\Note;
use App\Models\User;
use App\Models\VulnerabilityReport;
use App\Services\ContentCatalog;
use App\Services\ContentSchema;
use App\Services\ContentWorkflow;
use App\Services\QuizPresentationService;
use App\Services\RoadmapService;
use App\Services\StudioAccess;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudioAndAccountTest extends TestCase
{
    use RefreshDatabase;

    private User $editor;

    private User $reviewer;

    private User $admin;

    private User $learner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        app(ContentCatalog::class)->importLegacy();
        foreach (['editor', 'reviewer', 'admin', 'learner'] as $role) {
            $this->$role = User::factory()->create(['password' => 'secure-password-123']);
            $this->$role->forceFill(['role' => $role])->save();
        }
    }

    private function entry(string $kind = 'lesson'): ContentEntry
    {
        return ContentEntry::where('kind', $kind)->orderBy('id')->firstOrFail();
    }

    private function draft(string $kind = 'lesson'): ContentRevision
    {
        return app(ContentWorkflow::class)->draft($this->editor, $this->entry($kind));
    }

    private function ready(ContentRevision $r): ContentRevision
    {
        $data = $r->data_json;
        foreach ($data['sources'] as &$source) {
            $source['license'] = 'Checked attribution';
        }
        unset($source);
        if ($r->entry->kind === 'lesson') {
            $data['summary'] = 'Ringkasan yang sudah diperiksa.';
        }

        return app(ContentWorkflow::class)->save($this->editor, $r, $data, $r->lock_version);
    }

    private function publish(ContentRevision $r): ContentRevision
    {
        $w = app(ContentWorkflow::class);
        $r = $this->ready($r);
        $r = $w->transition($this->editor, $r, 'submit', $r->lock_version);
        $r = $w->transition($this->reviewer, $r, 'approve', $r->lock_version, ['notes' => 'Diperiksa manual pada fixture tes.', 'checks' => array_fill_keys(ContentSchema::CHECKS, true)]);

        return $w->transition($this->admin, $r, 'publish', $r->lock_version);
    }

    public function test_learner_cannot_access_any_studio_operation(): void
    {
        $r = $this->draft();
        $this->actingAs($this->learner);
        foreach (['/studio', '/studio/content', '/studio/users', '/studio/audit', '/studio/content/'.$r->content_entry_id.'/edit', '/studio/revisions/'.$r->id.'/preview'] as $url) {
            $this->get($url)->assertForbidden();
        }
        foreach (['submit', 'review', 'publish'] as $action) {
            $this->postJson('/studio/revisions/'.$r->id.'/'.$action, ['version' => 1])->assertForbidden();
        }
        $this->patchJson('/studio/revisions/'.$r->id, ['version' => 1, 'data' => $r->data_json])->assertForbidden();
        $this->assertSame('draft', $r->fresh()->status);
    }

    public function test_roles_have_separate_editor_review_and_publish_permissions(): void
    {
        $r = $this->draft();
        $this->actingAs($this->editor);
        $this->get('/studio')->assertOk();
        $this->postJson('/studio/revisions/'.$r->id.'/publish', ['version' => 1])->assertForbidden();
        $this->postJson('/studio/revisions/'.$r->id.'/review')->assertForbidden();
        $this->get('/studio/users')->assertForbidden();
        $this->actingAs($this->reviewer)->patchJson('/studio/revisions/'.$r->id, ['version' => 1, 'data' => $r->data_json])->assertForbidden();
        $this->postJson('/studio/revisions/'.$r->id.'/publish', ['version' => 1])->assertForbidden();
    }

    public function test_lifecycle_preserves_published_reader_during_draft_and_prior_progress(): void
    {
        $r = $this->draft();
        $lesson = Lesson::findOrFail($r->entry->subject_id);
        $old = $lesson->body_md;
        DB::table('lesson_progress')->insert(['user_id' => $this->learner->id, 'lesson_id' => $lesson->id, 'read_at' => now(), 'quiz_passed_at' => now(), 'completed_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
        $data = $r->data_json;
        $data['body_md'] = '# Materi baru tersimpan';
        $data['summary'] = 'Ringkasan baru';
        $this->actingAs($this->editor)->patchJson('/studio/revisions/'.$r->id, ['version' => 1, 'data' => $data])->assertOk();
        $this->assertSame($old, $lesson->fresh()->body_md);
        $published = $this->publish($r->fresh());
        $this->assertSame('published', $published->status);
        $this->assertSame('# Materi baru tersimpan', $lesson->fresh()->body_md);
        $this->seed(DatabaseSeeder::class);
        $this->assertSame('# Materi baru tersimpan', $lesson->fresh()->body_md);
        $this->assertDatabaseHas('lesson_progress', ['user_id' => $this->learner->id, 'lesson_id' => $lesson->id]);
        $this->actingAs($this->learner)->get('/learning/'.$lesson->slug)->assertInertia(fn (Assert $page) => $page->where('lesson.html', "<h1>Materi baru tersimpan</h1>\n"));
        $this->actingAs($this->editor)->patchJson('/studio/revisions/'.$published->id, ['version' => $published->lock_version, 'data' => $data])->assertConflict();
    }

    public function test_new_draft_is_hidden_and_preview_requires_staff_and_sanitizes_html(): void
    {
        $data = $this->entry()->published->data_json;
        $data['slug'] = 'private-draft';
        $data['title'] = 'Private Draft';
        $data['body_md'] = '<script>alert(1)</script><img src=x onerror=alert(2)>[bad](javascript:alert(1))';
        $data['summary'] = 'Ringkasan';
        $r = app(ContentWorkflow::class)->create($this->editor, 'lesson', $data);
        $this->actingAs($this->learner)->get('/learning/private-draft')->assertNotFound();
        $this->getJson('/studio/revisions/'.$r->id.'/preview')->assertForbidden();
        $preview = $this->actingAs($this->editor)->getJson('/studio/revisions/'.$r->id.'/preview')->assertOk()->json('html');
        $this->assertStringNotContainsString('<script', $preview);
        $this->assertStringNotContainsString('onerror', $preview);
        $this->assertStringNotContainsString('javascript:', $preview);
        $this->publish($r);
        $this->assertSame(26, Lesson::count());
        $this->actingAs($this->learner)->get('/learning/private-draft')->assertOk();
    }

    public function test_optimistic_lock_and_sources_and_prerequisite_cycle_are_validated(): void
    {
        $r = $this->ready($this->draft());
        $this->actingAs($this->editor);
        $this->patchJson('/studio/revisions/'.$r->id, ['version' => 1, 'data' => $r->data_json])->assertConflict();
        $data = $r->data_json;
        $data['sources'][0]['url'] = 'http://127.0.0.1/secret';
        $this->patchJson('/studio/revisions/'.$r->id, ['version' => $r->lock_version, 'data' => $data])->assertUnprocessable()->assertJsonValidationErrors('sources.0.url');
        $data = $r->data_json;
        $data['prerequisite_ids'] = [$r->entry->subject_id];
        $this->patchJson('/studio/revisions/'.$r->id, ['version' => $r->lock_version, 'data' => $data])->assertUnprocessable()->assertJsonValidationErrors('prerequisite_ids');
        $data = $r->data_json;
        $data['sources'] = [];
        $saved = app(ContentWorkflow::class)->save($this->editor, $r, $data, $r->lock_version);
        $this->postJson('/studio/revisions/'.$saved->id.'/submit', ['version' => $saved->lock_version])->assertUnprocessable()->assertJsonValidationErrors('sources');
    }

    public function test_self_review_is_denied_even_for_admin_and_request_changes_can_be_resubmitted(): void
    {
        $r = $this->ready($this->draft());
        $w = app(ContentWorkflow::class);
        $r = $w->save($this->admin, $r, $r->data_json, $r->lock_version);
        $r = $w->transition($this->admin, $r, 'submit', $r->lock_version);
        $body = ['version' => $r->lock_version, 'decision' => 'approve', 'notes' => 'Test review', 'checks' => array_fill_keys(ContentSchema::CHECKS, true)];
        $this->actingAs($this->admin)->postJson('/studio/revisions/'.$r->id.'/review', $body)->assertForbidden();
        $body['decision'] = 'request_changes';
        $this->actingAs($this->reviewer)->postJson('/studio/revisions/'.$r->id.'/review', $body)->assertOk()->assertJsonPath('revision.status', 'changes_requested');
        $this->assertDatabaseHas('editorial_reviews', ['content_revision_id' => $r->id, 'decision' => 'request_changes']);
    }

    public function test_quiz_presentation_pins_old_questions_after_new_publication_without_keys(): void
    {
        $lesson = Lesson::first();
        $this->actingAs($this->learner);
        $page = $this->get('/learning/'.$lesson->slug)->assertInertia(fn (Assert $page) => $page->has('quiz_context')->missing('questions.0.explanation')->missing('questions.0.choices.0.is_correct'));
        $context = app(QuizPresentationService::class)->present($this->learner, $lesson);
        $answers = $lesson->questions()->with('choices')->get()->map(fn ($q) => ['question_id' => $q->id, 'choice_id' => $q->choices->firstWhere('is_correct', true)->id])->all();
        $this->post('/learning/'.$lesson->slug.'/read')->assertRedirect();
        $published = $this->publish($this->draft('quiz'));
        $this->assertDatabaseCount('quiz_questions', 52);
        $this->actingAs($this->learner)->postJson('/learning/'.$lesson->slug.'/quiz', ['submission_id' => (string) Str::uuid(), 'quiz_context' => $context['quiz_context'], 'answers' => $answers])->assertOk()->assertJsonPath('score', 100);
        $this->assertDatabaseCount('quiz_attempts', 1);
        $this->postJson('/learning/'.$lesson->slug.'/quiz', ['submission_id' => (string) Str::uuid(), 'answers' => $answers])->assertUnprocessable();
        $this->actingAs($this->reviewer)->getJson('/studio/revisions/'.$published->id.'/preview')->assertOk()->assertJsonMissing(['is_correct' => true]);
    }

    public function test_quiz_rejects_ambiguous_or_duplicate_choices(): void
    {
        $r = $this->draft('quiz');
        $data = $r->data_json;
        $data['questions'][0]['choices'] = [['text' => 'Sama', 'is_correct' => true], ['text' => 'Sama', 'is_correct' => true]];
        $this->actingAs($this->editor)->patchJson('/studio/revisions/'.$r->id, ['version' => 1, 'data' => $data])->assertUnprocessable()->assertJsonValidationErrors('questions.0.choices');
    }

    public function test_quiz_draft_can_reference_unpublished_lesson_without_publishing_it(): void
    {
        $workflow = app(ContentWorkflow::class);
        $lessonData = $this->entry()->published->data_json;
        $lessonData['slug'] = 'draft-lesson-parent';
        $lessonData['title'] = 'Draft lesson parent';
        $lessonData['summary'] = 'Ringkasan untuk pengujian.';
        $lesson = $workflow->create($this->editor, 'lesson', $lessonData);
        $quizData = $this->entry('quiz')->published->data_json;
        unset($quizData['lesson_id']);
        $quizData['lesson_entry_id'] = $lesson->content_entry_id;
        $quizData['slug'] = 'draft-lesson-quiz';
        $quizData['title'] = 'Kuis draft lesson';
        $quiz = $workflow->create($this->editor, 'quiz', $quizData);
        $this->assertNull($quiz->entry->subject_id);
        $this->assertDatabaseCount('lessons', 25);
        $this->assertDatabaseCount('quiz_questions', 50);
        $this->actingAs($this->learner)->get('/learning/draft-lesson-parent')->assertNotFound();
        $this->actingAs($this->editor)->get('/studio/content/'.$quiz->content_entry_id.'/edit')->assertOk()->assertInertia(fn (Assert $page) => $page->where('revisions.0.data_json.lesson_entry_id', $lesson->content_entry_id));
        $pathId = DB::table('modules')->where('id', $lessonData['module_id'])->value('learning_path_id');
        $this->get('/studio/quizzes?path_id='.$pathId.'&q=draft-lesson-quiz')->assertOk();
        $this->get('/studio/quizzes?path_id='.$pathId.'&q=Kuis%20draft%20lesson')->assertInertia(fn (Assert $page) => $page->has('entries.data', 1)->where('entries.data.0.id', $quiz->content_entry_id));
        $this->postJson('/studio/content', ['kind' => 'quiz', 'data' => [...$quizData, 'slug' => 'duplicate-parent']])->assertUnprocessable();
        $this->patchJson('/studio/revisions/'.$quiz->id, ['version' => 1, 'data' => [...$quizData, 'lesson_id' => Lesson::first()->id]])->assertUnprocessable();
        $otherLesson = $workflow->create($this->editor, 'lesson', [...$lessonData, 'slug' => 'other-draft-parent']);
        $this->patchJson('/studio/revisions/'.$quiz->id, ['version' => 1, 'data' => [...$quizData, 'lesson_entry_id' => $otherLesson->content_entry_id]])->assertUnprocessable();
        $this->postJson('/studio/content', ['kind' => 'quiz', 'data' => [...$quizData, 'slug' => 'invalid-parent', 'lesson_entry_id' => $this->entry('quiz')->id]])->assertUnprocessable();
        $this->actingAs($this->learner)->postJson('/studio/content', ['kind' => 'quiz', 'data' => [...$quizData, 'slug' => 'unauthorized-quiz']])->assertForbidden();
        $this->actingAs($this->editor);
        $this->postJson('/studio/content/'.$lesson->content_entry_id.'/archive')->assertForbidden();

        $quiz = $workflow->transition($this->editor, $quiz, 'submit', $quiz->lock_version);
        $this->postJson('/studio/revisions/'.$quiz->id.'/review', ['version' => $quiz->lock_version, 'decision' => 'approve', 'notes' => 'Self review', 'checks' => array_fill_keys(ContentSchema::CHECKS, true)])->assertForbidden();
        $quiz = $workflow->transition($this->reviewer, $quiz, 'approve', $quiz->lock_version, ['notes' => 'Fixture review', 'checks' => array_fill_keys(ContentSchema::CHECKS, true)]);
        $this->actingAs($this->admin)->postJson('/studio/revisions/'.$quiz->id.'/publish', ['version' => $quiz->lock_version])->assertUnprocessable()->assertJsonValidationErrors('lesson_id');
        $this->postJson('/studio/content/'.$lesson->content_entry_id.'/archive')->assertUnprocessable();
        $this->assertSame('approved', $quiz->fresh()->status);

        $this->publish($lesson);
        $parentId = $lesson->entry->fresh()->subject_id;
        $this->assertNotNull($parentId);
        $this->actingAs($this->editor)->postJson('/studio/content', ['kind' => 'quiz', 'data' => [...$quizData, 'slug' => 'duplicate-direct', 'lesson_id' => $parentId, 'lesson_entry_id' => null]])->assertUnprocessable();
        $published = $workflow->transition($this->admin, $quiz->fresh(), 'publish', $quiz->fresh()->lock_version);
        $this->assertSame($parentId, $published->entry->fresh()->subject_id);
        $this->assertArrayHasKey('lesson_entry_id', $published->data_json);
        $this->assertArrayNotHasKey('lesson_id', $published->data_json);
        $this->assertDatabaseCount('quiz_questions', 52);
        $this->actingAs($this->editor)->get('/studio/quizzes?path_id='.$pathId.'&q=Kuis%20draft%20lesson')->assertInertia(fn (Assert $page) => $page->has('entries.data', 1)->where('entries.data.0.id', $quiz->content_entry_id));

        $publishedLesson = Lesson::findOrFail($parentId);
        $this->actingAs($this->learner)->get('/learning/'.$publishedLesson->slug)->assertInertia(fn (Assert $page) => $page->has('quiz_context')->missing('questions.0.explanation')->missing('questions.0.choices.0.is_correct'));
        $this->post('/learning/'.$publishedLesson->slug.'/read')->assertRedirect();
        $context = app(QuizPresentationService::class)->present($this->learner, $publishedLesson);
        $answers = $publishedLesson->questions()->with('choices')->get()->map(fn ($q) => ['question_id' => $q->id, 'choice_id' => $q->choices->firstWhere('is_correct', true)->id])->all();
        $next = $workflow->draft($this->editor, $published->entry->fresh());
        $this->publish($next);
        $this->actingAs($this->learner)->postJson('/learning/'.$publishedLesson->slug.'/quiz', ['submission_id' => (string) Str::uuid(), 'quiz_context' => $context['quiz_context'], 'answers' => $answers])->assertOk()->assertJsonPath('score', 100);
    }

    public function test_quiz_source_keys_survive_reordering_edits_and_publication(): void
    {
        $workflow = app(ContentWorkflow::class);
        $lessonData = $this->entry()->published->data_json;
        $lessonData['slug'] = 'source-lesson';
        $lessonData['title'] = 'Source lesson';
        $lessonData['summary'] = 'Ringkasan untuk pengujian.';
        $lesson = $workflow->create($this->editor, 'lesson', $lessonData);
        $data = $this->entry('quiz')->published->data_json;
        unset($data['lesson_id']);
        $data['lesson_entry_id'] = $lesson->content_entry_id;
        $data['slug'] = 'source-quiz';
        $data['questions'][0]['source_key'] = 'Q051';
        $data['questions'][1]['source_key'] = 'Q052';
        $invalid = $data;
        $invalid['questions'][1]['source_key'] = 'Q051';
        $this->actingAs($this->editor)->postJson('/studio/content', ['kind' => 'quiz', 'data' => $invalid])->assertUnprocessable()->assertJsonValidationErrors('questions.0.source_key');
        $quiz = $workflow->create($this->editor, 'quiz', $data);
        $otherLesson = $workflow->create($this->editor, 'lesson', [...$lessonData, 'slug' => 'other-source-lesson']);
        $collision = [...$data, 'slug' => 'other-source-quiz', 'lesson_entry_id' => $otherLesson->content_entry_id];
        $this->postJson('/studio/content', ['kind' => 'quiz', 'data' => $collision])->assertUnprocessable();
        $this->assertDatabaseMissing('content_entries', ['slug' => 'other-source-quiz']);
        $swapped = $data;
        $swapped['questions'][0]['source_key'] = 'Q052';
        $swapped['questions'][1]['source_key'] = 'Q051';
        $this->patchJson('/studio/revisions/'.$quiz->id, ['version' => 1, 'data' => $swapped])->assertUnprocessable()->assertJsonValidationErrors('questions');
        $stripped = $data;
        unset($stripped['questions'][0]['source_key']);
        $this->patchJson('/studio/revisions/'.$quiz->id, ['version' => 1, 'data' => $stripped])->assertUnprocessable()->assertJsonValidationErrors('questions');
        $removed = $data;
        array_shift($removed['questions']);
        $this->patchJson('/studio/revisions/'.$quiz->id, ['version' => 1, 'data' => $removed])->assertUnprocessable()->assertJsonValidationErrors('questions');
        $data['questions'] = array_reverse($data['questions']);
        $data['questions'][0]['explanation'] = 'Penjelasan baru.';
        $quiz = $workflow->save($this->editor, $quiz, $data, 1);
        $this->assertSame(['Q052', 'Q051'], array_column($quiz->data_json['questions'], 'source_key'));
        $this->publish($lesson);
        $this->publish($quiz);
        $lessonId = $lesson->entry->fresh()->subject_id;
        $this->assertSame(['Q052', 'Q051'], DB::table('quiz_questions')->where('lesson_id', $lessonId)->orderBy('id')->pluck('editorial_source_key')->all());
        $this->actingAs($this->learner)->get('/learning/source-lesson')->assertInertia(fn (Assert $page) => $page->missing('questions.0.editorial_source_key')->missing('questions.0.choices.0.is_correct'));
    }

    public function test_zero_source_key_is_reserved_and_cannot_be_removed(): void
    {
        $workflow = app(ContentWorkflow::class);
        $lessonData = $this->entry()->published->data_json;
        $lessonData['slug'] = 'zero-source-lesson';
        $lessonData['title'] = 'Zero source lesson';
        $lesson = $workflow->create($this->editor, 'lesson', $lessonData);
        $other = $workflow->create($this->editor, 'lesson', [...$lessonData, 'slug' => 'zero-source-other']);
        $data = $this->entry('quiz')->published->data_json;
        unset($data['lesson_id']);
        $data['lesson_entry_id'] = $lesson->content_entry_id;
        $data['slug'] = 'zero-source-quiz';
        $data['questions'][0]['source_key'] = '0';
        $quiz = $workflow->create($this->editor, 'quiz', $data);
        $this->assertDatabaseHas('quiz_source_keys', ['source_key' => '0', 'content_entry_id' => $quiz->content_entry_id]);
        $stripped = $data;
        unset($stripped['questions'][0]['source_key']);
        $this->actingAs($this->editor)->patchJson('/studio/revisions/'.$quiz->id, ['version' => 1, 'data' => $stripped])->assertUnprocessable()->assertJsonValidationErrors('questions');
        $this->postJson('/studio/content', ['kind' => 'quiz', 'data' => [...$data, 'slug' => 'zero-source-duplicate', 'lesson_entry_id' => $other->content_entry_id]])->assertUnprocessable();
        $this->assertDatabaseMissing('content_entries', ['slug' => 'zero-source-duplicate']);
    }

    public function test_lab_metadata_cannot_modify_runner_or_points_and_preserves_runtime_fields(): void
    {
        $r = $this->draft('lab');
        $before = DB::table('labs')->find($r->entry->subject_id);
        $data = $r->data_json;
        $data['command'] = 'arbitrary';
        $this->actingAs($this->editor)->patchJson('/studio/revisions/'.$r->id, ['version' => 1, 'data' => $data])->assertUnprocessable();
        $this->publish($r);
        $after = DB::table('labs')->find($r->entry->subject_id);
        foreach (['slug', 'points', 'enabled', 'solution_md', 'secure_code', 'default_body', 'default_headers'] as $key) {
            $this->assertSame($before->$key, $after->$key);
        }
    }

    public function test_roadmap_publishing_only_changes_future_enrollment_and_rejects_cycles(): void
    {
        $service = app(RoadmapService::class);
        $old = $service->create($this->learner, '2026-10-24', 'Asia/Jakarta');
        $before = DB::table('roadmap_days')->where('plan_id', $old->id)->get()->toJson();
        $r = $this->draft('roadmap');
        $data = $r->data_json;
        $data['days'][0]['title'] = 'Hari baru V5';
        $data['stages'] = array_reverse($data['stages']);
        $r = app(ContentWorkflow::class)->save($this->editor, $r, $data, 1);
        $published = $this->publish($r);
        $newUser = User::factory()->create();
        $new = $service->create($newUser, '2026-10-24', 'Asia/Jakarta');
        $this->assertSame($before, DB::table('roadmap_days')->where('plan_id', $old->id)->get()->toJson());
        $this->assertSame($published->id, $new->template_revision_id);
        $this->assertDatabaseHas('roadmap_days', ['plan_id' => $new->id, 'day_number' => 1, 'title' => 'Hari baru V5']);
        $this->assertTrue($service->overview($this->learner)['template_update_available']);
        $r = app(ContentWorkflow::class)->draft($this->editor, $this->entry('roadmap'));
        $data = $r->data_json;
        $data['days'][0]['tasks'][0]['prerequisite_key'] = $data['days'][0]['tasks'][1]['key'];
        $this->actingAs($this->editor)->patchJson('/studio/revisions/'.$r->id, ['version' => 1, 'data' => $data])->assertUnprocessable();
    }

    public function test_profile_preferences_are_persistent_and_reject_privilege_injection(): void
    {
        $this->actingAs($this->learner)->patchJson('/account/settings/general', ['name' => 'Nama Baru', 'username' => 'pelajar_baru', 'bio' => 'Belajar teratur', 'timezone' => 'UTC', 'locale' => 'id'])->assertOk();
        $this->assertDatabaseHas('users', ['id' => $this->learner->id, 'name' => 'Nama Baru', 'username' => 'pelajar_baru', 'timezone' => 'UTC']);
        $this->patchJson('/account/settings/general', ['name' => 'Changed', 'role' => 'admin', 'xp' => 9999])->assertUnprocessable();
        $this->assertSame('learner', $this->learner->fresh()->role);
        $this->patchJson('/account/settings/general', ['name' => 'Nama Baru', 'username' => 'admin', 'timezone' => 'UTC', 'locale' => 'id'])->assertUnprocessable()->assertJsonValidationErrors('username');
        $this->patchJson('/account/settings/privacy', ['show_activity' => false])->assertOk();
        $this->get('/profile')->assertInertia(fn (Assert $page) => $page->where('recentActivity', null));
        $this->get('/profile/'.$this->editor->id)->assertNotFound();
    }

    public function test_avatar_is_normalized_and_polyglot_or_svg_rejected(): void
    {
        Storage::fake('local');
        $this->actingAs($this->learner)->postJson('/profile/avatar', ['avatar' => UploadedFile::fake()->image('picture.jpg', 150, 150)])->assertOk();
        $path = $this->learner->fresh()->avatar_path;
        $this->assertSame('image/png', getimagesizefromstring(Storage::disk('local')->get($path))['mime']);
        $this->postJson('/profile/avatar', ['avatar' => UploadedFile::fake()->createWithContent('bad.svg', '<svg onload="alert(1)"></svg>')])->assertUnprocessable();
        $this->postJson('/profile/avatar', ['avatar' => UploadedFile::fake()->createWithContent('bad.png', Storage::disk('local')->get($path).'<?php echo 1;')])->assertUnprocessable();
        $this->assertSame($path, $this->learner->fresh()->avatar_path);
        $this->get('/profile/avatar')->assertOk()->assertHeader('Content-Type', 'image/png');
    }

    public function test_password_reauthentication_session_revocation_and_suspension(): void
    {
        $this->actingAs($this->learner)->postJson('/account/password', ['current_password' => 'wrong', 'password' => 'new-password-1234', 'password_confirmation' => 'new-password-1234'])->assertUnprocessable();
        $this->postJson('/account/password', ['current_password' => 'secure-password-123', 'password' => 'new-password-1234', 'password_confirmation' => 'new-password-1234'])->assertOk();
        $this->assertTrue(Hash::check('new-password-1234', $this->learner->fresh()->password));
        $this->assertFalse(Hash::check('secure-password-123', $this->learner->fresh()->password));
        $this->assertSame(1, $this->learner->fresh()->auth_epoch);
        $this->postJson('/account/sessions/revoke')->assertUnprocessable();
        $this->postJson('/account/sessions/revoke', ['current_password' => 'new-password-1234'])->assertOk();
        $this->learner->forceFill(['suspended_at' => now()])->save();
        $this->get('/dashboard')->assertRedirect('/login');
        $this->post('/login', ['email' => $this->learner->email, 'password' => 'new-password-1234'])->assertSessionHasErrors('email');
    }

    public function test_role_management_requires_reauth_protects_last_admin_and_logs_without_password(): void
    {
        $body = ['role' => 'reviewer', 'suspended' => false, 'can_publish' => true];
        $this->actingAs($this->admin)->patchJson('/studio/users/'.$this->learner->id, $body)->assertUnprocessable();
        $this->patchJson('/studio/users/'.$this->learner->id, [...$body, 'current_password' => 'secure-password-123'])->assertOk();
        $this->assertDatabaseHas('users', ['id' => $this->learner->id, 'role' => 'reviewer', 'auth_epoch' => 1]);
        $this->patchJson('/studio/users/'.$this->admin->id, [...$body, 'role' => 'learner', 'current_password' => 'secure-password-123'])->assertUnprocessable()->assertJsonValidationErrors('role');
        $audit = DB::table('studio_audit_events')->get()->toJson();
        $this->assertStringNotContainsString('secure-password', $audit);
        $this->assertDatabaseHas('studio_audit_events', ['action' => 'user.access_changed', 'subject_id' => $this->learner->id]);
    }

    public function test_private_export_excludes_other_accounts_secrets_and_expires(): void
    {
        Storage::fake('local');
        Note::unguarded(fn () => Note::create(['user_id' => $this->learner->id, 'title' => 'Own note', 'body_md' => 'flag=VULNLAB{secret} token=abc']));
        Note::unguarded(fn () => Note::create(['user_id' => $this->editor->id, 'title' => 'Other private note', 'body_md' => 'never export this']));
        $url = $this->actingAs($this->learner)->postJson('/account/exports', ['current_password' => 'secure-password-123'])->assertOk()->json('download_url');
        $this->get($url)->assertOk();
        $row = DB::table('account_data_requests')->first();
        $json = Storage::disk('local')->get($row->path);
        foreach (['Other private note', 'VULNLAB{secret}', 'token=abc', 'remember_token', 'auth_epoch', $this->learner->password] as $secret) {
            $this->assertStringNotContainsString($secret, $json);
        }
        $this->assertStringContainsString('Own note', $json);
        $this->actingAs($this->editor)->get($url)->assertNotFound();
        DB::table('account_data_requests')->where('id', $row->id)->update(['expires_at' => now()->subMinute()]);
        $this->actingAs($this->learner)->get($url)->assertNotFound();
        $this->artisan('account:purge-exports')->assertSuccessful();
        Storage::disk('local')->assertMissing($row->path);
    }

    public function test_deletion_has_password_typed_confirmation_and_cancellable_grace_period(): void
    {
        $this->actingAs($this->learner)->postJson('/account/deletion', ['current_password' => 'wrong', 'confirmation' => 'DELETE'])->assertUnprocessable();
        $this->postJson('/account/deletion', ['current_password' => 'secure-password-123', 'confirmation' => 'DELETE'])->assertOk();
        $this->assertDatabaseHas('account_data_requests', ['user_id' => $this->learner->id, 'kind' => 'deletion', 'status' => 'pending']);
        $this->assertNotNull($this->learner->fresh());
        $this->deleteJson('/account/deletion')->assertOk();
        $this->assertDatabaseHas('account_data_requests', ['user_id' => $this->learner->id, 'kind' => 'deletion', 'status' => 'cancelled']);
    }

    public function test_operator_bootstrap_is_explicit_and_import_is_idempotent(): void
    {
        $this->artisan('studio:grant-role', ['user' => $this->learner->id, 'role' => 'admin'])->assertFailed();
        $this->artisan('studio:grant-role', ['user' => $this->learner->id, 'role' => 'admin', '--confirm' => true])->assertSuccessful();
        $this->assertSame('admin', $this->learner->fresh()->role);
        $count = ContentEntry::count();
        $this->assertSame(0, app(ContentCatalog::class)->importLegacy());
        $this->assertSame($count, ContentEntry::count());
        $this->assertDatabaseHas('studio_audit_events', ['action' => 'operator.role_granted']);
    }

    public function test_operator_processes_only_a_matured_requested_deletion(): void
    {
        $this->actingAs($this->learner)->postJson('/account/deletion', ['current_password' => 'secure-password-123', 'confirmation' => 'DELETE'])->assertOk();
        $request = DB::table('account_data_requests')->where('kind', 'deletion')->first();
        $this->artisan('account:process-deletion', ['request' => $request->id])->assertFailed();
        $this->travel(8)->days();
        $this->artisan('account:process-deletion', ['request' => $request->id, '--confirm' => true])->assertSuccessful();
        $this->assertDatabaseMissing('users', ['id' => $this->learner->id]);
        $this->assertDatabaseHas('users', ['id' => $this->editor->id]);
        $this->assertDatabaseHas('studio_audit_events', ['action' => 'operator.deletion_processed']);
    }

    public function test_owner_boundaries_apply_to_reviewers_and_admins_and_denials_are_audited(): void
    {
        $note = Note::unguarded(fn () => Note::create(['user_id' => $this->learner->id, 'title' => 'Private learner', 'body_md' => 'Never shared']));
        foreach ([$this->reviewer, $this->admin] as $operator) {
            $this->actingAs($operator)->get('/notes/'.$note->id)->assertForbidden();
            $this->patchJson('/notes/'.$note->id, ['title' => 'Bad'])->assertForbidden();
        }
        $this->actingAs($this->learner)->get('/studio')->assertForbidden();
        $this->assertDatabaseHas('studio_audit_events', ['action' => 'authorization.denied', 'actor_id' => $this->learner->id]);
    }

    public function test_studio_filters_sort_and_stable_parent_management(): void
    {
        $this->actingAs($this->admin)->get('/studio/content?sort=title&kind=lesson&difficulty=Pemula')->assertOk();
        $this->get('/studio/content?path_id=2&reviewer_id='.$this->reviewer->id)->assertOk();
        $w = app(ContentWorkflow::class);
        $path = $w->create($this->editor, 'path', ['title' => 'Jalur Original', 'slug' => 'jalur-original', 'description' => 'Pembelajaran original.', 'difficulty' => 'Pemula', 'objectives' => ['Belajar bertahap.'], 'sources' => []]);
        $path = $this->publish($path);
        $pathId = $path->entry->fresh()->subject_id;
        $module = $w->create($this->editor, 'module', ['title' => 'Modul Original', 'slug' => 'modul-original', 'path_id' => $pathId, 'sources' => []]);
        $module = $this->publish($module);
        $this->assertDatabaseHas('modules', ['id' => $module->entry->fresh()->subject_id, 'learning_path_id' => $pathId]);
    }

    public function test_new_lab_metadata_is_readable_but_never_starts_unverified_runtime(): void
    {
        $data = $this->entry('lab')->published->data_json;
        $data['title'] = 'Metadata Original';
        $data['slug'] = 'metadata-original';
        $r = app(ContentWorkflow::class)->create($this->editor, 'lab', $data);
        $this->publish($r);
        $lab = Lab::where('slug', 'metadata-original')->firstOrFail();
        $this->assertFalse($lab->enabled);
        $this->assertSame(0, $lab->points);
        $this->actingAs($this->learner)->get('/labs/metadata-original')->assertInertia(fn (Assert $page) => $page->where('lab.available', false)->where('lab.routes', []));
        $this->postJson('/labs/metadata-original/sessions')->assertStatus(503);
        $this->assertDatabaseMissing('lab_sessions', ['lab_id' => $lab->id]);
    }

    public function test_new_roadmap_assessments_cannot_be_completed_as_checklists(): void
    {
        $r = $this->draft('roadmap');
        $d = $r->data_json;
        $lesson = Lesson::first();
        $d['days'][0]['tasks'][0]['kind'] = 'quiz';
        $d['days'][0]['tasks'][0]['subject_id'] = $lesson->id;
        $r = app(ContentWorkflow::class)->save($this->editor, $r, $d, 1);
        $this->publish($r);
        $plan = app(RoadmapService::class)->create($this->learner, today()->toDateString(), 'Asia/Jakarta');
        $item = $plan->days()->where('day_number', 1)->first()->items()->first();
        $this->actingAs($this->learner)->patch('/roadmap/items/'.$item->id, ['status' => 'completed'])->assertSessionHasErrors('status');
        $this->assertSame('available', $item->fresh()->status);
        DB::table('lesson_progress')->insert(['user_id' => $this->learner->id, 'lesson_id' => $lesson->id, 'read_at' => now(), 'quiz_passed_at' => now(), 'completed_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
        app(RoadmapService::class)->overview($this->learner);
        $this->assertSame('completed', $item->fresh()->status);
    }

    public function test_notification_delivery_and_utc_payloads_follow_real_preferences(): void
    {
        $this->learner->forceFill(['account_preferences' => ['content_updates' => true]])->save();
        $this->publish($this->draft());
        $this->assertDatabaseHas('account_notifications', ['user_id' => $this->learner->id, 'type' => 'content_update']);
        $this->assertDatabaseMissing('account_notifications', ['user_id' => $this->editor->id, 'type' => 'content_update']);
        StudioAccess::audit($this->learner, 'account.sessions_revoked', 'user', $this->learner->id);
        $this->actingAs($this->learner)->get('/settings/security')->assertInertia(fn (Assert $page) => $page->where('securityEvents.0.created_at', fn ($value) => str_ends_with($value, '+00:00')));
        $notification = DB::table('account_notifications')->where('user_id', $this->learner->id)->first();
        $this->post('/notifications/'.$notification->id.'/read')->assertRedirect();
        $this->actingAs($this->editor)->post('/notifications/'.$notification->id.'/read')->assertNotFound();
    }

    public function test_archiving_keeps_historical_lab_relations_and_immutable_revision(): void
    {
        $entry = $this->entry('lab');
        $lab = Lab::findOrFail($entry->subject_id);
        $revision = $entry->published->data_json;
        $session = new LabSession(['lab_id' => $lab->id]);
        $report = new VulnerabilityReport(['lab_id' => $lab->id]);
        $publishedBefore = ContentRevision::where('status', 'published')->count();
        app(ContentWorkflow::class)->archive($this->admin, $entry);
        $this->actingAs($this->learner)->get('/labs/'.$lab->slug)->assertNotFound();
        $this->assertSame($lab->id, $session->lab->id);
        $this->assertSame($lab->id, $report->lab->id);
        $this->assertSame($revision, $entry->published->fresh()->data_json);
        $this->assertDatabaseHas('labs', ['id' => $lab->id, 'catalog_visible' => false]);
        $this->actingAs($this->admin)->get('/studio')->assertInertia(fn (Assert $page) => $page->where('counts.published', $publishedBefore - 1));
    }
}
