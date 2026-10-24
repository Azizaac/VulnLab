<?php

use App\Models\User;
use App\Services\LearningEventService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_activity_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 60);
            $table->string('subject_type', 30);
            $table->unsignedBigInteger('subject_id');
            $table->timestamp('occurred_at');
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->string('source_event_key')->unique();
            $table->json('metadata_json');
            $table->timestamps();
            $table->index(['user_id', 'occurred_at', 'event_type'], 'learning_events_user_time_type');
        });
        Schema::create('xp_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('source_type', 30);
            $table->unsignedBigInteger('source_id');
            $table->string('reward_key');
            $table->unsignedSmallInteger('amount');
            $table->timestamp('granted_at');
            $table->json('context_json');
            $table->timestamps();
            $table->unique(['user_id', 'reward_key']);
        });
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('description');
            $table->string('icon', 40);
            $table->unsignedSmallInteger('rule_version')->default(1);
        });
        Schema::create('user_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('achievement_id')->constrained()->cascadeOnDelete();
            $table->timestamp('unlocked_at');
            $table->string('source_event_key');
            $table->unique(['user_id', 'achievement_id']);
        });
        Schema::create('learning_backfills', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('version');
            $table->timestamp('completed_at');
        });

        foreach (LearningEventService::ACHIEVEMENTS as $code => $definition) {
            DB::table('achievements')->insert(['code' => $code, ...$definition, 'rule_version' => 1]);
        }
        // Preserve every original source row; import each historical reward only once.
        User::orderBy('id')->chunkById(100, function ($users) {
            foreach ($users as $user) {
                app(LearningEventService::class)->backfill($user);
            }
        });
    }

    public function down(): void
    {
        foreach (['learning_backfills', 'user_achievements', 'achievements', 'xp_transactions', 'learning_activity_events'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
