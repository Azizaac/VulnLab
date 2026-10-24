<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_categories', function (Blueprint $t) {
            $t->id();
            $t->string('name')->unique();
        });
        Schema::create('labs', function (Blueprint $t) {
            $t->id();
            $t->string('code')->unique();
            $t->string('slug')->unique();
            $t->string('title');
            $t->foreignId('lab_category_id')->constrained();
            $t->foreignId('lesson_id')->constrained();
            $t->foreignId('lab_spec_id')->constrained();
            $t->string('difficulty')->index();
            $t->unsignedSmallInteger('minutes');
            $t->unsignedSmallInteger('points');
            $t->boolean('enabled')->default(false);
            $t->text('scenario_md');
            $t->json('objectives');
            $t->json('sources');
            $t->text('solution_md');
            $t->text('secure_code');
            $t->json('default_body');
            $t->json('default_headers');
            $t->string('classification');
            $t->date('authored_at');
            $t->date('reviewed_at')->nullable();
            $t->timestamps();
        });
        Schema::create('lab_instructions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('lab_id')->constrained()->cascadeOnDelete();
            $t->unsignedTinyInteger('position');
            $t->text('body');
            $t->unique(['lab_id', 'position']);
        });
        Schema::create('lab_hints', function (Blueprint $t) {
            $t->id();
            $t->foreignId('lab_id')->constrained()->cascadeOnDelete();
            $t->unsignedTinyInteger('level');
            $t->text('body');
            $t->unique(['lab_id', 'level']);
        });
        Schema::create('lab_sessions', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lab_id')->constrained();
            $t->unique(['user_id', 'lab_id']);
            $t->unsignedInteger('generation')->default(1);
            $t->string('status')->index();
            $t->text('capability');
            $t->text('flag_secret');
            $t->string('flag_hash', 64);
            $t->json('fixtures')->nullable();
            $t->timestamp('started_at');
            $t->timestamp('expires_at')->index();
            $t->timestamp('solved_at')->nullable();
            $t->timestamps();
        });
        Schema::create('lab_attempts', function (Blueprint $t) {
            $t->id();
            $t->foreignUuid('lab_session_id')->constrained()->cascadeOnDelete();
            $t->unsignedInteger('generation');
            $t->uuid('submission_id');
            $t->boolean('success');
            $t->timestamp('created_at');
            $t->unique(['lab_session_id', 'submission_id']);
        });
        Schema::create('lab_progress', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lab_id')->constrained();
            $t->timestamp('solved_at');
            $t->unsignedSmallInteger('points_awarded');
            $t->unique(['user_id', 'lab_id']);
        });
        Schema::create('lab_hint_usage', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lab_hint_id')->constrained()->cascadeOnDelete();
            $t->timestamp('created_at');
            $t->unique(['user_id', 'lab_hint_id']);
        });
        Schema::create('xp_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lab_id')->constrained();
            $t->unsignedSmallInteger('points');
            $t->timestamp('created_at');
            $t->unique(['user_id', 'lab_id']);
        });
        Schema::create('lab_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignUuid('lab_session_id')->constrained()->cascadeOnDelete();
            $t->unsignedInteger('generation');
            $t->json('request');
            $t->json('response');
            $t->timestamp('created_at');
            $t->index(['lab_session_id', 'id']);
        });
    }

    public function down(): void
    {
        foreach (['lab_requests', 'xp_events', 'lab_hint_usage', 'lab_progress', 'lab_attempts', 'lab_sessions', 'lab_hints', 'lab_instructions', 'labs', 'lab_categories'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
