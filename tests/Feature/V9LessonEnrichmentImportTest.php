<?php

namespace Tests\Feature;

use App\Models\ContentEntry;
use App\Models\ContentRevision;
use App\Models\Lesson;
use App\Models\User;
use App\Services\ContentCatalog;
use App\Services\ContentWorkflow;
use App\Services\SafeMarkdown;
use App\Services\V9LessonEnrichmentImporter;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use InvalidArgumentException;
use RuntimeException;
use Tests\TestCase;

class V9LessonEnrichmentImportTest extends TestCase
{
    use RefreshDatabase;

    private User $editor;

    private array $source;

    private string $databaseDirectory;

    private ?string $fixtureDirectory = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->editor = User::factory()->create(['role' => 'editor']);
        $this->databaseDirectory = database_path();
        $this->source = json_decode(file_get_contents(database_path('data/v9-lesson-enrichment.json')), true, 512, JSON_THROW_ON_ERROR);
    }

    protected function tearDown(): void
    {
        if ($this->fixtureDirectory !== null) {
            $this->app->useDatabasePath($this->databaseDirectory);
            File::deleteDirectory($this->fixtureDirectory);
        }
        parent::tearDown();
    }

    public function test_all_enrichments_are_staff_drafts_while_learner_content_quizzes_and_rewards_are_preserved(): void
    {
        $learner = User::factory()->create();
        $lesson = Lesson::where('source_id', 'L001')->firstOrFail();
        $originalHtml = app(SafeMarkdown::class)->render($lesson->body_md);
        $this->actingAs($learner)->post('/learning/'.$lesson->slug.'/read')->assertRedirect();
        $answers = $lesson->questions()->with('choices')->get()->map(fn ($question) => ['question_id' => $question->id, 'choice_id' => $question->choices->firstWhere('is_correct', true)->id])->all();
        $this->postJson('/learning/'.$lesson->slug.'/quiz', ['submission_id' => (string) Str::uuid(), 'answers' => $answers])->assertOk()->assertJsonPath('passed', true);
        $xp = (int) DB::table('xp_transactions')->where('user_id', $learner->id)->sum('amount');
        $this->assertGreaterThan(0, $xp);
        $tables = ['lessons', 'lesson_sources', 'quiz_questions', 'quiz_choices', 'lesson_progress', 'quiz_attempts', 'xp_events', 'xp_transactions', 'learning_activity_events', 'user_achievements'];
        $before = $this->snapshot($tables);

        $this->assertSame(['created' => 25, 'unchanged' => 0], app(V9LessonEnrichmentImporter::class)->import($this->editor));
        $this->assertSame($before, $this->snapshot($tables));
        $this->assertDatabaseCount('content_import_records', 25);
        $this->assertSame(25, ContentRevision::where('status', 'draft')->count());

        foreach ($this->source as $row) {
            $subject = Lesson::where('source_id', $row['source_id'])->firstOrFail();
            $entry = ContentEntry::with('published')->where('kind', 'lesson')->where('subject_id', $subject->id)->firstOrFail();
            $record = DB::table('content_import_records')->where('bundle', 'v9-baseline-enrichment')->where('source_key', $row['source_id'])->first();
            $draft = ContentRevision::findOrFail($record->content_revision_id);
            $provenance = json_decode($record->provenance_json, true, 512, JSON_THROW_ON_ERROR);
            $this->assertSame($entry->id, (int) $record->content_entry_id);
            $this->assertSame('published', $entry->published->status);
            $this->assertSame($subject->body_md, $entry->published->data_json['body_md']);
            $this->assertSame($entry->published->data_json['body_md']."\n\n".$row['body_md'], $draft->data_json['body_md']);
            $this->assertSame('draft', $draft->status);
            $this->assertSame($this->editor->id, (int) $draft->author_id);
            $this->assertNull($draft->published_at);
            $this->assertNull($draft->approved_by);
            $this->assertSame($entry->published->id, $provenance['original_published_revision_id']);
            $this->assertSame('ai', $provenance['authorship']);
            $this->assertSame('pending_human_review', $provenance['review_status']);
            $this->assertSame($this->canonical($row['sources']), $this->canonical($provenance['sources']));
            $this->assertSame($this->canonical($row['source_checks']), $this->canonical($provenance['source_checks']));
            $this->assertSame($this->hash($row), $record->source_hash);
            $this->assertSame($this->hash($draft->data_json), $record->data_hash);
            $this->assertSame(array_values(array_unique([...$entry->published->data_json['objectives'], ...$row['objectives']])), $draft->data_json['objectives']);
            $urls = array_column($draft->data_json['sources'], 'url');
            $this->assertSame(count(array_unique($urls)), count($urls));
            foreach ([...$entry->published->data_json['sources'], ...$row['sources']] as $source) {
                $this->assertContains($source['url'], $urls);
            }
            foreach ($draft->data_json['sources'] as $source) {
                $this->assertLessThanOrEqual(180, mb_strlen($source['license']));
            }
        }

        $record = DB::table('content_import_records')->where('source_key', 'L001')->first();
        $preview = $this->actingAs($this->editor)->getJson('/studio/revisions/'.$record->content_revision_id.'/preview')->assertOk()->json('html');
        $this->assertStringContainsString('Pendalaman V9-D', $preview);
        $this->assertStringContainsString('belum ditinjau manusia independen', $preview);
        $this->actingAs($learner)->get('/learning/'.$lesson->slug)->assertInertia(fn (Assert $page) => $page->component('LessonReader')->where('lesson.html', $originalHtml)->has('attempts', 1)->has('questions', 2));
        $this->get('/progress')->assertInertia(fn (Assert $page) => $page->where('progress.summary.total_xp', $xp));
        $this->getJson('/studio/revisions/'.$record->content_revision_id.'/preview')->assertForbidden();
    }

    public function test_exact_reimport_is_unchanged_without_duplicate_drafts_saves_or_audit_events(): void
    {
        $importer = app(V9LessonEnrichmentImporter::class);
        $importer->import($this->editor);
        $tables = ['content_entries', 'content_revisions', 'content_import_records', 'revision_saves', 'studio_audit_events'];
        $before = $this->snapshot($tables);

        $this->assertSame(['created' => 0, 'unchanged' => 25], $importer->import(User::factory()->create(['role' => 'editor'])));
        $this->assertSame($before, $this->snapshot($tables));
    }

    public function test_staff_edits_to_an_imported_draft_are_never_overwritten(): void
    {
        $importer = app(V9LessonEnrichmentImporter::class);
        $importer->import($this->editor);
        $record = DB::table('content_import_records')->where('source_key', 'L025')->first();
        $draft = ContentRevision::findOrFail($record->content_revision_id);
        $data = $draft->data_json;
        $data['title'] = 'Judul yang disunting manusia';
        $this->actingAs($this->editor)->patchJson('/studio/revisions/'.$draft->id, ['data' => $data, 'version' => $draft->lock_version])->assertOk();
        $before = $this->snapshot(['content_revisions', 'content_import_records', 'revision_saves', 'studio_audit_events']);

        $this->assertConflict(fn () => $importer->import($this->editor), 'L025');
        $this->assertSame($before, $this->snapshot(['content_revisions', 'content_import_records', 'revision_saves', 'studio_audit_events']));
        $this->assertSame($data['title'], $draft->fresh()->data_json['title']);
    }

    public function test_saving_the_same_draft_data_still_protects_operator_ownership(): void
    {
        $importer = app(V9LessonEnrichmentImporter::class);
        $importer->import($this->editor);
        $record = DB::table('content_import_records')->where('source_key', 'L025')->first();
        $draft = ContentRevision::findOrFail($record->content_revision_id);
        app(ContentWorkflow::class)->save($this->editor, $draft, $draft->data_json, $draft->lock_version);

        $this->assertConflict(fn () => $importer->import($this->editor), 'L025');
        $this->assertSame(25, ContentRevision::where('status', 'draft')->count());
    }

    public function test_an_existing_active_draft_conflicts_and_rolls_back_earlier_enrichments(): void
    {
        app(ContentCatalog::class)->importLegacy();
        $lesson = Lesson::where('source_id', 'L025')->firstOrFail();
        $entry = ContentEntry::where('kind', 'lesson')->where('subject_id', $lesson->id)->firstOrFail();
        $draft = app(ContentWorkflow::class)->draft($this->editor, $entry);
        $tables = ['content_entries', 'content_revisions', 'revision_saves', 'studio_audit_events'];
        $before = $this->snapshot($tables);

        $this->assertConflict(fn () => app(V9LessonEnrichmentImporter::class)->import($this->editor), 'L025');
        $this->assertSame($before, $this->snapshot($tables));
        $this->assertDatabaseCount('content_import_records', 0);
        $this->assertSame($this->canonical($draft->data_json), $this->canonical($draft->fresh()->data_json));
    }

    public function test_wrong_source_slug_rolls_back_the_entire_import(): void
    {
        $rows = $this->source;
        $rows[24]['slug'] = 'wrong-baseline-slug';
        $this->useSource($rows);

        $this->assertConflict(fn () => app(V9LessonEnrichmentImporter::class)->import($this->editor), 'L025');
        $this->assertNoImportWrites();
    }

    public function test_a_missing_actual_baseline_id_is_rejected_without_creating_content(): void
    {
        DB::table('lessons')->where('source_id', 'L025')->update(['source_id' => 'L999']);

        $this->assertConflict(fn () => app(V9LessonEnrichmentImporter::class)->import($this->editor), 'L025');
        $this->assertNoImportWrites();
    }

    public function test_duplicate_source_ids_are_rejected(): void
    {
        $rows = $this->source;
        $rows[24]['source_id'] = 'L001';
        $this->useSource($rows);
        try {
            app(V9LessonEnrichmentImporter::class)->import($this->editor);
            $this->fail('Expected duplicate source ID failure');
        } catch (InvalidArgumentException $exception) {
            $this->assertStringContainsString('source_id', $exception->getMessage());
        }
        $this->assertNoImportWrites();
    }

    public function test_an_incomplete_source_id_set_is_rejected(): void
    {
        $this->useSource(array_slice($this->source, 0, 24));
        try {
            app(V9LessonEnrichmentImporter::class)->import($this->editor);
            $this->fail('Expected missing source ID failure');
        } catch (InvalidArgumentException $exception) {
            $this->assertStringContainsString('source_id', $exception->getMessage());
        }
        $this->assertNoImportWrites();
    }

    public function test_changed_source_evidence_conflicts_even_when_draft_content_is_identical(): void
    {
        $importer = app(V9LessonEnrichmentImporter::class);
        $importer->import($this->editor);
        $before = $this->snapshot(['content_revisions', 'content_import_records', 'revision_saves', 'studio_audit_events']);
        $rows = $this->source;
        $rows[24]['source_checks'][0]['claim'] .= ' Perubahan bukti sumber.';
        $this->useSource($rows);

        $this->assertConflict(fn () => $importer->import($this->editor), 'L025');
        $this->assertSame($before, $this->snapshot(['content_revisions', 'content_import_records', 'revision_saves', 'studio_audit_events']));
    }

    public function test_changed_published_source_conflicts_without_rebasing_the_draft(): void
    {
        $importer = app(V9LessonEnrichmentImporter::class);
        $importer->import($this->editor);
        $record = DB::table('content_import_records')->where('source_key', 'L025')->first();
        $entry = ContentEntry::with('published')->findOrFail($record->content_entry_id);
        $data = $entry->published->data_json;
        $data['body_md'] .= "\nPerubahan terbit.";
        $entry->published->update(['data_json' => $data]);
        $before = $this->snapshot(['content_revisions', 'content_import_records']);

        $this->assertConflict(fn () => $importer->import($this->editor), 'L025');
        $this->assertSame($before, $this->snapshot(['content_revisions', 'content_import_records']));
    }

    public function test_late_schema_failure_rolls_back_drafts_and_new_legacy_snapshots(): void
    {
        $rows = $this->source;
        $rows[24]['sources'][0]['publisher'] = str_repeat('x', 181);
        $this->useSource($rows);
        try {
            app(V9LessonEnrichmentImporter::class)->import($this->editor);
            $this->fail('Expected source validation failure');
        } catch (ValidationException $exception) {
            $this->assertStringContainsString('publisher', implode(',', array_keys($exception->errors())));
        }
        $this->assertNoImportWrites();
    }

    public function test_the_caller_can_roll_back_the_import_in_an_outer_transaction(): void
    {
        try {
            DB::transaction(function () {
                app(V9LessonEnrichmentImporter::class)->import($this->editor);
                throw new RuntimeException('Caller rollback');
            });
            $this->fail('Expected caller rollback');
        } catch (RuntimeException $exception) {
            $this->assertSame('Caller rollback', $exception->getMessage());
        }
        $this->assertNoImportWrites();
    }

    public function test_learners_are_forbidden_before_any_snapshots_or_drafts_are_created(): void
    {
        try {
            app(V9LessonEnrichmentImporter::class)->import(User::factory()->create());
            $this->fail('Expected authorization failure');
        } catch (AuthorizationException $exception) {
            $this->assertSame(403, $exception->status() ?? 403);
        }
        foreach (['content_entries', 'content_revisions', 'content_import_records', 'revision_saves'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        $this->assertDatabaseCount('studio_audit_events', 1);
        $this->assertDatabaseHas('studio_audit_events', ['action' => 'authorization.denied']);
    }

    private function useSource(array $rows): void
    {
        if ($this->fixtureDirectory === null) {
            $this->fixtureDirectory = sys_get_temp_dir().'/vulnlab-v9-'.Str::uuid();
            File::makeDirectory($this->fixtureDirectory.'/data', 0755, true);
            $this->app->useDatabasePath($this->fixtureDirectory);
        }
        File::put(database_path('data/v9-lesson-enrichment.json'), json_encode($rows, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function assertConflict(callable $import, string $sourceId): void
    {
        try {
            $import();
            $this->fail('Expected import conflict');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('conflict', $exception->getMessage());
            $this->assertStringContainsString($sourceId, $exception->getMessage());
        }
    }

    private function assertNoImportWrites(): void
    {
        foreach (['content_entries', 'content_revisions', 'content_import_records', 'revision_saves', 'studio_audit_events'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
    }

    private function snapshot(array $tables): array
    {
        return collect($tables)->mapWithKeys(fn ($table) => [$table => DB::table($table)->orderBy('id')->get()->toJson()])->all();
    }

    private function canonical(mixed $item): mixed
    {
        if (! is_array($item)) {
            return $item;
        }
        if (! array_is_list($item)) {
            ksort($item);
        }

        return array_map($this->canonical(...), $item);
    }

    private function hash(mixed $value): string
    {
        return hash('sha256', json_encode($this->canonical($value), JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
}
