<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['learner', 'admin'])->default('learner');
            $table->string('timezone')->default('Asia/Jakarta');
        });
        Schema::create('learning_paths', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description');
            $table->timestamps();
        });
        Schema::create('phases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('learning_path_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('category');
            $table->string('milestone');
            $table->unsignedSmallInteger('sort_order');
            $table->unique(['learning_path_id', 'sort_order']);
        });
        Schema::create('weeks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('phase_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('week_number')->unique();
            $table->string('title');
        });
        Schema::create('roadmap_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('week_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('day_number')->index();
            $table->unsignedSmallInteger('sort_order');
            $table->string('title');
            $table->text('description');
            $table->enum('task_type', ['reading', 'practice', 'lab']);
            $table->unsignedSmallInteger('estimated_minutes');
            $table->foreignId('prerequisite_task_id')->nullable()->constrained('roadmap_tasks')->nullOnDelete();
            $table->unique(['day_number', 'sort_order']);
        });
        Schema::create('user_task_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('roadmap_task_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['in_progress', 'done'])->index();
            $table->timestamp('completed_at')->nullable()->index();
            $table->unsignedSmallInteger('xp_awarded')->default(0);
            $table->timestamps();
            $table->unique(['user_id', 'roadmap_task_id']);
        });
        Schema::create('activity_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('event_type');
            $table->json('metadata_json');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        foreach (['activity_events', 'user_task_progress', 'roadmap_tasks', 'weeks', 'phases', 'learning_paths'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['role', 'timezone']));
    }
};
