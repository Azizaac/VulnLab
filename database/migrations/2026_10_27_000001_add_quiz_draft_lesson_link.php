<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('content_entries', function (Blueprint $table) {
            $table->foreignId('parent_lesson_entry_id')->nullable()->unique()->constrained('content_entries')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('content_entries', function (Blueprint $table) {
            $table->dropForeign(['parent_lesson_entry_id']);
        });
        Schema::table('content_entries', function (Blueprint $table) {
            $table->dropUnique(['parent_lesson_entry_id']);
        });
        Schema::table('content_entries', function (Blueprint $table) {
            $table->dropColumn('parent_lesson_entry_id');
        });
    }
};
