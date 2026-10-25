<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->string('role', 20)->default('learner')->change();
            $t->string('username', 24)->nullable()->unique();
            $t->string('bio', 280)->nullable();
            $t->string('avatar_path')->nullable();
            $t->string('locale', 8)->default('id');
            $t->boolean('reduced_motion')->default(false);
            $t->string('density', 12)->default('comfortable');
            $t->json('account_preferences')->nullable();
            $t->json('permission_grants')->nullable();
            $t->timestamp('suspended_at')->nullable();
            $t->unsignedInteger('auth_epoch')->default(0);
        });
        foreach (['lessons', 'labs', 'modules', 'learning_paths'] as $table) {
            Schema::table($table, fn (Blueprint $t) => $t->boolean('catalog_visible')->default(true)->index());
        }
        Schema::table('quiz_questions', fn (Blueprint $t) => $t->boolean('catalog_active')->default(true)->index());
        // MySQL may use the old composite unique index to support lesson_id's FK.
        // Install its replacement before removing the uniqueness restriction.
        Schema::table('lesson_sources', fn (Blueprint $t) => $t->index('lesson_id', 'lesson_sources_lesson_fk_idx'));
        Schema::table('lesson_sources', function (Blueprint $t) {
            $t->boolean('catalog_active')->default(true);
            $t->unsignedBigInteger('revision_id')->nullable();
            $t->dropUnique(['lesson_id', 'title']);
        });
        Schema::create('content_entries', function (Blueprint $t) {
            $t->id();
            $t->string('kind', 16)->index();
            $t->unsignedBigInteger('subject_id')->nullable();
            $t->string('slug');
            $t->unsignedBigInteger('published_revision_id')->nullable();
            $t->boolean('is_managed')->default(false);
            $t->boolean('is_archived')->default(false);
            $t->timestamps();
            $t->unique(['kind', 'slug']);
            $t->unique(['kind', 'subject_id']);
        });
        Schema::create('content_revisions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('content_entry_id')->constrained()->cascadeOnDelete();
            $t->unsignedInteger('number');
            $t->unsignedInteger('lock_version')->default(1);
            $t->string('status', 24)->default('draft')->index();
            $t->json('data_json');
            $t->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('published_at')->nullable();
            $t->timestamps();
            $t->unique(['content_entry_id', 'number']);
        });
        Schema::create('revision_saves', function (Blueprint $t) {
            $t->id();
            $t->foreignId('content_revision_id')->constrained()->cascadeOnDelete();
            $t->unsignedInteger('lock_version');
            $t->json('data_json');
            $t->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('created_at');
        });
        Schema::create('editorial_reviews', function (Blueprint $t) {
            $t->id();
            $t->foreignId('content_revision_id')->constrained()->cascadeOnDelete();
            $t->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('decision', 24);
            $t->text('notes');
            $t->json('checks');
            $t->timestamp('created_at');
        });
        Schema::create('studio_audit_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('action', 80)->index();
            $t->string('subject_type', 24)->nullable();
            $t->unsignedBigInteger('subject_id')->nullable();
            $t->json('metadata_json');
            $t->timestamp('created_at')->index();
        });
        Schema::create('account_notifications', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('type', 40);
            $t->string('message');
            $t->string('href');
            $t->timestamp('read_at')->nullable();
            $t->timestamp('created_at');
        });
        Schema::create('account_data_requests', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('kind', 16);
            $t->string('status', 16);
            $t->string('path')->nullable();
            $t->timestamp('expires_at')->nullable();
            $t->timestamp('execute_after')->nullable();
            $t->timestamps();
        });
        Schema::create('quiz_presentations', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lesson_id')->constrained();
            $t->unsignedBigInteger('revision_id')->nullable();
            $t->json('question_ids');
            $t->unsignedTinyInteger('passing_score');
            $t->timestamp('expires_at');
        });
        Schema::table('quiz_attempts', fn (Blueprint $t) => $t->unsignedBigInteger('quiz_revision_id')->nullable());
        Schema::table('roadmap_plans', fn (Blueprint $t) => $t->unsignedBigInteger('template_revision_id')->nullable());
        Schema::table('roadmap_days', fn (Blueprint $t) => $t->string('stage_label')->nullable());
        Schema::table('roadmap_items', function (Blueprint $t) {
            $t->string('completion_kind', 16)->default('manual');
            $t->unsignedBigInteger('linked_subject_id')->nullable();
        });
    }

    public function down(): void
    {
        // Rollback is intentionally refused: restoring a pre-V5 backup is an operator action.
        throw new RuntimeException('V5 stores editorial and account records. Use a reviewed restore plan, never migrate:rollback.');
    }
};
