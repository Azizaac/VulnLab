<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ContentImportSchemaRepairTest extends TestCase
{
    use RefreshDatabase;

    public function test_missing_table_is_repaired_without_changing_snapshot_references(): void
    {
        $record = $this->snapshotRecord();
        $entry = DB::table('content_entries')->where('id', $record['content_entry_id'])->first();
        $revision = DB::table('content_revisions')->where('id', $record['content_revision_id'])->first();
        Schema::drop('content_import_records');
        $migration = require database_path('migrations/2026_11_16_000001_repair_content_import_records.php');

        $migration->up();

        $this->assertTrue(Schema::hasTable('content_import_records'));
        $this->assertSame(0, DB::table('content_import_records')->count());
        DB::table('content_import_records')->insert($record);
        $this->assertDatabaseHas('content_import_records', [
            'bundle' => $record['bundle'],
            'content_entry_id' => $entry->id,
            'content_revision_id' => $revision->id,
        ]);
        $this->assertEquals($entry, DB::table('content_entries')->where('id', $entry->id)->first());
        $this->assertEquals($revision, DB::table('content_revisions')->where('id', $revision->id)->first());
        $migration->down();
        $this->assertSame(1, DB::table('content_import_records')->count());
    }

    public function test_existing_table_definition_and_provenance_survive_up_and_down(): void
    {
        DB::table('content_import_records')->insert($this->snapshotRecord());
        $rows = DB::table('content_import_records')->orderBy('id')->get()->all();
        $columns = Schema::getColumns('content_import_records');
        $indexes = Schema::getIndexes('content_import_records');
        $foreignKeys = Schema::getForeignKeys('content_import_records');
        $migration = require database_path('migrations/2026_11_16_000001_repair_content_import_records.php');

        $migration->up();
        $migration->down();

        $this->assertEquals($rows, DB::table('content_import_records')->orderBy('id')->get()->all());
        $this->assertSame($columns, Schema::getColumns('content_import_records'));
        $this->assertSame($indexes, Schema::getIndexes('content_import_records'));
        $this->assertSame($foreignKeys, Schema::getForeignKeys('content_import_records'));
    }

    public function test_repaired_table_rejects_duplicate_bundle_source_pairs(): void
    {
        $record = $this->snapshotRecord();
        $this->repairMissingTable();
        DB::table('content_import_records')->insert($record);
        DB::table('content_import_records')->insert(array_replace($record, ['bundle' => 'other-bundle']));
        DB::table('content_import_records')->insert(array_replace($record, ['source_key' => 'L002']));

        $this->expectException(QueryException::class);
        DB::table('content_import_records')->insert($record);
    }

    public function test_repaired_table_restricts_deleting_referenced_entries(): void
    {
        $record = $this->snapshotRecord();
        $this->repairMissingTable();
        DB::table('content_import_records')->insert($record);

        $this->expectException(QueryException::class);
        DB::table('content_entries')->where('id', $record['content_entry_id'])->delete();
    }

    public function test_repaired_table_restricts_deleting_referenced_revisions(): void
    {
        $record = $this->snapshotRecord();
        $this->repairMissingTable();
        DB::table('content_import_records')->insert($record);

        $this->expectException(QueryException::class);
        DB::table('content_revisions')->where('id', $record['content_revision_id'])->delete();
    }

    private function repairMissingTable(): void
    {
        Schema::drop('content_import_records');
        $migration = require database_path('migrations/2026_11_16_000001_repair_content_import_records.php');
        $migration->up();
    }

    private function snapshotRecord(): array
    {
        $data = json_encode(['title' => 'Baseline snapshot'], JSON_THROW_ON_ERROR);
        $entryId = DB::table('content_entries')->insertGetId(['kind' => 'lesson', 'slug' => 'schema-repair-baseline']);
        $revisionId = DB::table('content_revisions')->insertGetId([
            'content_entry_id' => $entryId,
            'number' => 1,
            'status' => 'published',
            'data_json' => $data,
        ]);
        DB::table('content_entries')->where('id', $entryId)->update(['published_revision_id' => $revisionId]);

        return [
            'bundle' => 'baseline-snapshot',
            'source_key' => 'L001',
            'content_entry_id' => $entryId,
            'content_revision_id' => $revisionId,
            'source_hash' => hash('sha256', 'baseline source'),
            'data_hash' => hash('sha256', $data),
            'provenance_json' => json_encode(['authored_by' => 'AI', 'human_review' => 'pending'], JSON_THROW_ON_ERROR),
            'created_at' => '2026-11-16 00:00:00',
            'updated_at' => '2026-11-16 00:00:00',
        ];
    }
}
