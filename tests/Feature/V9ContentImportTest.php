<?php

namespace Tests\Feature;

use App\Models\ContentRevision;
use App\Models\User;
use App\Services\ContentCatalog;
use App\Services\V9ContentImporter;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class V9ContentImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_reviewed_metadata_import_stays_draft_and_preserves_current_curriculum(): void
    {
        $this->seed(DatabaseSeeder::class);
        app(ContentCatalog::class)->importLegacy();
        $editor = User::factory()->create(['role' => 'editor']);
        $before = $this->curriculum();
        $result = app(V9ContentImporter::class)->import($editor);
        $this->assertSame(['created' => 25, 'unchanged' => 0], $result['baseline']);
        $this->assertSame(['created' => 20, 'unchanged' => 0], $result['expansion']);
        $this->assertSame($before, $this->curriculum());
        $this->assertSame(0, DB::table('editorial_reviews')->count());
        $this->assertSame(45, ContentRevision::where('status', 'draft')->count());
        $this->assertSame([
            'baseline' => ['created' => 0, 'unchanged' => 25],
            'expansion' => ['created' => 0, 'unchanged' => 20],
        ], app(V9ContentImporter::class)->import($editor));

        $record = DB::table('content_import_records')->where('source_key', 'N026')->first();
        $lesson = ContentRevision::findOrFail($record->content_revision_id);
        $this->assertNotEmpty($lesson->data_json['objectives']);
        $this->assertStringContainsString('Password::sendResetLink', $lesson->data_json['example_md']);
        $this->assertSame(null, $lesson->entry->published_revision_id);
        $provenance = json_decode($record->provenance_json, true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('ai_content_checked_pending_human', $provenance['ai_review']['source_checks'][0]['status']);

        $quizRecord = DB::table('content_import_records')->where('source_key', 'quiz-N033')->first();
        $questions = ContentRevision::findOrFail($quizRecord->content_revision_id)->data_json['questions'];
        $state = collect($questions)->firstWhere('source_key', 'Q072');
        $this->assertStringContainsString('State saja tidak cukup', $state['explanation']);
        $this->assertTrue($state['choices'][1]['is_correct']);
        $this->actingAs(User::factory()->create())->get('/learning/reset-token-lifecycle')->assertNotFound();
    }

    private function curriculum(): array
    {
        $tables = ['lessons', 'lesson_sources', 'quiz_questions', 'quiz_choices', 'lesson_prerequisites', 'lesson_progress', 'quiz_attempts', 'xp_transactions', 'roadmap_lesson_links'];
        $result = [];
        foreach ($tables as $table) {
            $result[$table] = DB::table($table)->get()->toJson();
        }

        return $result;
    }
}
