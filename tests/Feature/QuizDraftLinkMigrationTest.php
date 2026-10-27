<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class QuizDraftLinkMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_editorial_source_column_can_be_rolled_back_and_reapplied(): void
    {
        $migration = require database_path('migrations/2026_10_27_000002_add_quiz_editorial_source_key.php');
        $migration->down();
        $this->assertFalse(Schema::hasColumn('quiz_questions', 'editorial_source_key'));
        $migration->up();
        $this->assertTrue(Schema::hasColumn('quiz_questions', 'editorial_source_key'));
    }

    public function test_source_key_reservations_can_be_rolled_back_and_reapplied(): void
    {
        $migration = require database_path('migrations/2026_10_27_000003_create_quiz_source_keys.php');
        $migration->down();
        $this->assertFalse(Schema::hasTable('quiz_source_keys'));
        $migration->up();
        $this->assertTrue(Schema::hasTable('quiz_source_keys'));
        $parent = DB::table('content_entries')->insertGetId(['kind' => 'quiz', 'slug' => 'source-reservation-1']);
        $other = DB::table('content_entries')->insertGetId(['kind' => 'quiz', 'slug' => 'source-reservation-2']);
        DB::table('quiz_source_keys')->insert(['source_key' => 'Q051', 'content_entry_id' => $parent]);
        $this->expectException(QueryException::class);
        DB::table('quiz_source_keys')->insert(['source_key' => 'Q051', 'content_entry_id' => $other]);
    }

    public function test_sqlite_rollback_and_reapply_restore_unique_parent_constraint(): void
    {
        $this->assertSame('sqlite', DB::getDriverName());
        $migration = require database_path('migrations/2026_10_27_000001_add_quiz_draft_lesson_link.php');
        $migration->down();
        $this->assertFalse(Schema::hasColumn('content_entries', 'parent_lesson_entry_id'));
        $this->assertFalse(collect(DB::select("PRAGMA foreign_key_list('content_entries')"))->contains('from', 'parent_lesson_entry_id'));
        $indexes = collect(DB::select("PRAGMA index_list('content_entries')"))->pluck('name');
        $this->assertFalse($indexes->contains('content_entries_parent_lesson_entry_id_unique'));
        $migration->up();
        $this->assertTrue(Schema::hasColumn('content_entries', 'parent_lesson_entry_id'));
        $this->assertTrue(collect(DB::select("PRAGMA foreign_key_list('content_entries')"))->contains('from', 'parent_lesson_entry_id'));
        $indexes = collect(DB::select("PRAGMA index_list('content_entries')"))->keyBy('name');
        $this->assertSame(1, $indexes['content_entries_parent_lesson_entry_id_unique']->unique);

        $parent = DB::table('content_entries')->insertGetId(['kind' => 'lesson', 'slug' => 'migration-parent']);
        DB::table('content_entries')->insert([
            ['kind' => 'quiz', 'slug' => 'migration-unlinked-1', 'parent_lesson_entry_id' => null],
            ['kind' => 'quiz', 'slug' => 'migration-unlinked-2', 'parent_lesson_entry_id' => null],
            ['kind' => 'quiz', 'slug' => 'migration-linked-1', 'parent_lesson_entry_id' => $parent],
        ]);
        $this->expectException(QueryException::class);
        DB::table('content_entries')->insert(['kind' => 'quiz', 'slug' => 'migration-linked-2', 'parent_lesson_entry_id' => $parent]);
    }
}
