<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->unsignedSmallInteger('daily_goal_minutes')->default(120));
        Schema::create('roadmap_day_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('week_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('day_number')->unique();
            $table->string('title');
            $table->text('objective');
        });
        Schema::create('roadmap_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->date('starts_on');
            $table->string('timezone');
            $table->string('status')->default('active')->index();
            $table->timestamps();
        });
        Schema::create('roadmap_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('roadmap_plans')->cascadeOnDelete();
            $table->foreignId('week_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('day_number');
            $table->date('scheduled_on')->index();
            $table->string('title');
            $table->text('objective');
            $table->unique(['plan_id', 'day_number']);
            $table->unique(['plan_id', 'scheduled_on']);
        });
        Schema::create('roadmap_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('roadmap_day_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order');
            $table->string('task_type')->default('checklist');
            $table->string('category');
            $table->string('title');
            $table->text('description');
            $table->unsignedSmallInteger('estimated_minutes');
            $table->foreignId('prerequisite_item_id')->nullable()->constrained('roadmap_items')->nullOnDelete();
            $table->enum('status', ['available', 'in_progress', 'completed'])->default('available')->index();
            $table->timestamp('completed_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['roadmap_day_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        foreach (['roadmap_items', 'roadmap_days', 'roadmap_plans', 'roadmap_day_templates'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('daily_goal_minutes'));
    }
};
