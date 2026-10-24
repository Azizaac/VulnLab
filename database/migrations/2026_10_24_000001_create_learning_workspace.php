<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('learning_paths', function (Blueprint $t) {
            $t->boolean('is_course')->default(false)->index();
            $t->json('outcomes')->nullable();
            $t->string('difficulty')->default('Pemula');
            $t->unsignedSmallInteger('sort_order')->default(0);
        });
        Schema::create('modules', function (Blueprint $t) {
            $t->id();
            $t->foreignId('learning_path_id')->constrained()->cascadeOnDelete();
            $t->string('title');
            $t->unsignedSmallInteger('sort_order');
            $t->timestamps();
            $t->unique(['learning_path_id', 'sort_order']);
        });
        Schema::create('lessons', function (Blueprint $t) {
            $t->id();
            $t->foreignId('module_id')->constrained()->cascadeOnDelete();
            $t->string('source_id')->unique();
            $t->string('slug')->unique();
            $t->string('title');
            $t->string('difficulty');
            $t->unsignedSmallInteger('estimated_minutes');
            $t->unsignedSmallInteger('sort_order');
            $t->longText('body_md');
            $t->json('enrichment');
            $t->json('source_snapshot');
            $t->string('editorial_status');
            $t->date('authored_at');
            $t->date('reviewed_at')->nullable();
            $t->timestamps();
        });
        Schema::create('lesson_sources', function (Blueprint $t) {
            $t->id();
            $t->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $t->string('title');
            $t->string('url', 1000);
            $t->unique(['lesson_id', 'title']);
        });
        Schema::create('lesson_prerequisites', function (Blueprint $t) {
            $t->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $t->foreignId('prerequisite_id')->constrained('lessons')->cascadeOnDelete();
            $t->primary(['lesson_id', 'prerequisite_id']);
        });
        Schema::create('lab_specs', function (Blueprint $t) {
            $t->id();
            $t->string('slug')->unique();
            $t->string('title');
            $t->foreignId('lesson_id')->nullable()->constrained()->nullOnDelete();
            $t->string('difficulty');
            $t->text('goal');
        });
        Schema::create('quiz_questions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $t->string('source_id')->unique();
            $t->text('question');
            $t->text('explanation');
            $t->unsignedSmallInteger('points')->default(10);
        });
        Schema::create('quiz_choices', function (Blueprint $t) {
            $t->id();
            $t->foreignId('quiz_question_id')->constrained()->cascadeOnDelete();
            $t->string('source_key');
            $t->text('text');
            $t->boolean('is_correct');
            $t->unique(['quiz_question_id', 'source_key']);
        });
        Schema::create('quiz_attempts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $t->uuid('submission_id');
            $t->unsignedTinyInteger('score');
            $t->boolean('passed');
            $t->json('feedback');
            $t->timestamp('created_at');
            $t->unique(['user_id', 'submission_id']);
            $t->index(['user_id', 'lesson_id', 'created_at']);
        });
        Schema::create('lesson_progress', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $t->timestamp('read_at')->nullable();
            $t->timestamp('quiz_passed_at')->nullable();
            $t->timestamp('completed_at')->nullable();
            $t->timestamps();
            $t->unique(['user_id', 'lesson_id']);
            $t->index(['user_id', 'completed_at']);
        });
        Schema::create('roadmap_lesson_links', function (Blueprint $t) {
            $t->unsignedSmallInteger('day_number')->primary();
            $t->foreignId('lesson_id')->constrained()->cascadeOnDelete();
        });
        Schema::create('notes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('title', 180);
            $t->longText('body_md');
            $t->string('category', 60)->default('Belajar');
            $t->boolean('pinned')->default(false);
            $t->unsignedInteger('revision')->default(1);
            $t->foreignId('lesson_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('lab_spec_id')->nullable()->constrained()->nullOnDelete();
            $t->timestamps();
            $t->index(['user_id', 'pinned', 'updated_at']);
            $t->index(['user_id', 'category']);
        });
        Schema::create('note_tags', function (Blueprint $t) {
            $t->id();
            $t->foreignId('note_id')->constrained()->cascadeOnDelete();
            $t->string('name', 40);
            $t->unique(['note_id', 'name']);
            $t->index('name');
        });
    }

    public function down(): void
    {
        foreach (['note_tags', 'notes', 'roadmap_lesson_links', 'lesson_progress', 'quiz_attempts', 'quiz_choices', 'quiz_questions', 'lab_specs', 'lesson_prerequisites', 'lesson_sources', 'lessons', 'modules'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('learning_paths', fn (Blueprint $t) => $t->dropColumn(['is_course', 'outcomes', 'difficulty', 'sort_order']));
    }
};
