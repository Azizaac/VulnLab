<?php

namespace Tests\Feature;

use App\Models\ContentRevision;
use App\Models\User;
use App\Services\ExpansionV71Importer;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class ExpansionV71ImportTest extends TestCase
{
    use RefreshDatabase;

    private User $editor;

    private array $modules;

    private array $sources;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->editor = User::factory()->create(['role' => 'editor']);
        $moduleId = (int) DB::table('modules')->first()->id;
        $lessons = json_decode(file_get_contents(base_path('docs/expansion-v7.1/content/LESSON_MANIFEST.json')), true, 512, JSON_THROW_ON_ERROR);
        $questions = json_decode(file_get_contents(base_path('docs/expansion-v7.1/content/quizzes/NEW_QUESTION_BANK.json')), true, 512, JSON_THROW_ON_ERROR);
        $this->modules = array_fill_keys(array_column($lessons, 'id'), $moduleId);
        $byId = collect($lessons)->keyBy('id');
        $this->sources = collect($questions)->mapWithKeys(fn ($q) => [$q['id'] => $byId[$q['lesson_id']]['sources'][0]['url']])->all();
    }

    public function test_import_is_draft_only_audited_and_idempotent(): void
    {
        $importer = app(ExpansionV71Importer::class);
        $before = DB::table('lessons')->count();
        $this->assertSame(['created' => 20, 'unchanged' => 0], $importer->import($this->editor, $this->modules, $this->sources));
        $this->assertSame(['created' => 0, 'unchanged' => 20], $importer->import($this->editor, $this->modules, $this->sources));
        $this->assertSame($before, DB::table('lessons')->count());
        $this->assertSame(20, DB::table('content_import_records')->count());
        $this->assertSame(20, DB::table('content_revisions')->where('status', 'draft')->count());
        $quizzes = ContentRevision::whereHas('entry', fn ($q) => $q->where('kind', 'quiz'))->get();
        $this->assertSame(30, $quizzes->sum(fn ($r) => count($r->data_json['questions'])));
        $keys = $quizzes->flatMap(fn ($r) => array_column($r->data_json['questions'], 'source_key'))->sort()->values()->all();
        $this->assertSame(array_map(fn ($n) => sprintf('Q%03d', $n), range(51, 80)), $keys);
        $this->assertSame(20, DB::table('studio_audit_events')->where('action', 'content.created')->count());
        $this->actingAs(User::factory()->create())->get('/learning/reset-token-lifecycle')->assertNotFound();
    }

    public function test_edited_draft_conflicts_and_does_not_overwrite(): void
    {
        $importer = app(ExpansionV71Importer::class);
        $importer->import($this->editor, $this->modules, $this->sources);
        $record = DB::table('content_import_records')->where('source_key', 'N026')->first();
        $revision = ContentRevision::findOrFail($record->content_revision_id);
        $data = $revision->data_json;
        $data['title'] = 'Editor change';
        $revision->update(['data_json' => $data]);
        try {
            $importer->import($this->editor, $this->modules, $this->sources);
            $this->fail('Expected conflict');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('conflict', $e->getMessage());
        }
        $this->assertSame('Editor change', $revision->fresh()->data_json['title']);
        $this->assertSame(20, DB::table('content_import_records')->count());
    }

    public function test_missing_mapping_and_late_invalid_source_roll_back_all_changes(): void
    {
        $importer = app(ExpansionV71Importer::class);
        try {
            $importer->import($this->editor, array_slice($this->modules, 1, null, true), $this->sources);
            $this->fail('Expected missing mapping failure');
        } catch (\InvalidArgumentException $e) {
            $this->assertStringContainsString('mapping', $e->getMessage());
        }
        $bad = $this->sources;
        $bad['Q080'] = 'https://example.org/unrelated';
        try {
            $importer->import($this->editor, $this->modules, $bad);
            $this->fail('Expected source failure');
        } catch (\InvalidArgumentException $e) {
            $this->assertStringContainsString('Q080', $e->getMessage());
        }
        $this->assertSame(0, DB::table('content_import_records')->count());
        $this->assertSame(0, DB::table('content_revisions')->count());
        $this->assertSame(0, DB::table('studio_audit_events')->count());
    }

    public function test_source_collision_rolls_back_without_changing_existing_progress(): void
    {
        $learner = User::factory()->create();
        $lesson = DB::table('lessons')->first();
        DB::table('lesson_progress')->insert(['user_id' => $learner->id, 'lesson_id' => $lesson->id, 'read_at' => now(), 'quiz_passed_at' => now(), 'completed_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
        $progress = DB::table('lesson_progress')->where('user_id', $learner->id)->first();
        DB::table('lessons')->where('id', $lesson->id)->update(['source_id' => 'N035']);
        try {
            app(ExpansionV71Importer::class)->import($this->editor, $this->modules, $this->sources);
            $this->fail('Expected source collision');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('N035', $e->getMessage());
        }
        $this->assertEquals($progress, DB::table('lesson_progress')->where('user_id', $learner->id)->first());
        $this->assertSame(0, DB::table('content_import_records')->count());
    }

    public function test_question_source_key_collision_rolls_back_all_drafts(): void
    {
        $question = DB::table('quiz_questions')->first();
        DB::table('quiz_questions')->where('id', $question->id)->update(['editorial_source_key' => 'Q080']);
        try {
            app(ExpansionV71Importer::class)->import($this->editor, $this->modules, $this->sources);
            $this->fail('Expected question collision');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('Q080', $e->getMessage());
        }
        $this->assertSame(0, DB::table('content_import_records')->count());
        $this->assertSame(0, DB::table('content_revisions')->count());
    }

    public function test_learner_cannot_import(): void
    {
        $this->expectException(AuthorizationException::class);
        app(ExpansionV71Importer::class)->import(User::factory()->create(), $this->modules, $this->sources);
    }
}
