<?php

namespace Tests\Feature;

use App\Models\ActivityEvent;
use App\Models\Phase;
use App\Models\RoadmapDay;
use App\Models\RoadmapItem;
use App\Models\RoadmapPlan;
use App\Models\RoadmapTask;
use App\Models\User;
use App\Models\UserTaskProgress;
use App\Services\RoadmapService;
use Carbon\Carbon;
use Database\Seeders\RoadmapSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoadmapTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoadmapSeeder::class);
    }

    private function learner(string $start = '2026-10-23', string $zone = 'Asia/Jakarta'): User
    {
        $user = User::factory()->create(['timezone' => $zone]);
        app(RoadmapService::class)->create($user, $start, $zone);

        return $user;
    }

    private function item(int $slot): RoadmapItem
    {
        return RoadmapItem::orderBy('id')->skip($slot - 1)->firstOrFail();
    }

    private function url(int $slot): string
    {
        return '/roadmap/items/'.$this->item($slot)->id;
    }

    public function test_repeatable_seed_has_exactly_ninety_templates_and_thirteen_weeks(): void
    {
        $this->assertSame(range(1, 90), DB::table('roadmap_day_templates')->orderBy('day_number')->pluck('day_number')->all());
        $this->assertDatabaseCount('weeks', 13);
        $this->assertDatabaseCount('phases', 4);
        $ids = DB::table('roadmap_day_templates')->pluck('id')->all();
        $this->seed(RoadmapSeeder::class);
        $this->assertSame($ids, DB::table('roadmap_day_templates')->pluck('id')->all());
        $this->assertDatabaseCount('roadmap_plans', 0);
    }

    public function test_plan_has_ninety_dated_days_and_20_70_30_minutes_with_leap_boundary(): void
    {
        $this->learner('2028-01-31');
        $days = RoadmapDay::with('items')->orderBy('day_number')->get();
        $this->assertCount(90, $days);
        $this->assertSame('2028-02-29', $days[29]->scheduled_on->toDateString());
        $this->assertSame('2028-04-29', $days->last()->scheduled_on->toDateString());
        $this->assertSame(6, $days->filter(fn ($day) => $day->day_number >= 85)->count());
        foreach ($days as $day) {
            $this->assertSame([20, 70, 30], $day->items->pluck('estimated_minutes')->all());
            $this->assertSame(120, $day->items->sum('estimated_minutes'));
        }
        $this->assertSame(10800, (int) RoadmapItem::sum('estimated_minutes'));
        $this->assertDatabaseCount('roadmap_items', 270);
    }

    public function test_sunday_is_light_review_and_weekday_modes_follow_actual_calendar(): void
    {
        $this->learner('2026-10-25'); // Sunday.
        $this->assertStringContainsString('Review ringan', $this->item(1)->description);
        $this->assertStringStartsWith('Review ringan dan rekap:', $this->item(2)->title);
        $this->assertStringStartsWith('Teori dan contoh:', $this->item(5)->title);
        $this->assertStringContainsString('Tanpa materi baru', $this->item(2)->description);
    }

    public function test_dst_does_not_skip_or_duplicate_calendar_days(): void
    {
        $this->learner('2026-03-07', 'America/New_York');
        $dates = RoadmapDay::orderBy('day_number')->get()->map(fn ($day) => $day->scheduled_on->toDateString())->all();
        $this->assertSame(['2026-03-07', '2026-03-08', '2026-03-09'], array_slice($dates, 0, 3));
        $this->assertSame('2026-06-04', end($dates));
        $this->assertCount(90, array_unique($dates));
    }

    public function test_today_uses_plan_timezone_and_get_requests_never_write_progress(): void
    {
        $this->travelTo(Carbon::parse('2026-10-23 18:00:00', 'UTC'));
        $user = $this->learner();
        $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->component('Dashboard')
            ->where('today.date', '2026-10-24')->where('today.day', 2)->has('today.tasks', 3)
            ->where('stats.completed', 0)->where('stats.xp', 0)->where('stats.streak', 0)->where('stats.verified_minutes', 0)
            ->where('stats.total', 270)->where('stats.remaining_hours', 180)->has('activities', 0));
        $this->get('/roadmap')->assertOk();
        $phaseId = Phase::where('category', 'Fundamental')->value('id');
        $this->get('/roadmap/'.$phaseId)->assertInertia(fn (Assert $page) => $page->where('selectedPhase', $phaseId));
        $this->assertDatabaseCount('activity_events', 0);
        $this->assertSame(0, RoadmapItem::whereNotNull('completed_at')->count());
    }

    public function test_existing_user_has_useful_plan_empty_state_and_explicit_creation(): void
    {
        $this->actingAs($user = User::factory()->create())->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('plan', null)->where('stats.total', 0));
        $this->assertDatabaseCount('roadmap_plans', 0);
        $input = ['starts_on' => '2026-10-23', 'timezone' => 'Asia/Jakarta', 'daily_goal_minutes' => 120];
        $this->post('/roadmap/plan', $input)->assertSessionHasNoErrors();
        $this->post('/roadmap/plan', $input)->assertSessionHasNoErrors();
        $this->assertDatabaseCount('roadmap_plans', 1);
        $this->assertDatabaseCount('roadmap_days', 90);
        $this->assertSame($user->id, RoadmapPlan::first()->user_id);
    }

    public function test_start_completion_reload_and_retries_preserve_timestamp_without_xp(): void
    {
        $this->actingAs($this->learner());
        $this->patch($this->url(1), ['status' => 'in_progress'])->assertSessionHasNoErrors();
        $this->patch($this->url(1), ['status' => 'completed'])->assertSessionHasNoErrors();
        $stamp = $this->item(1)->completed_at;
        $this->travel(1)->day();
        $this->patch($this->url(1), ['status' => 'completed'])->assertSessionHasNoErrors();
        $this->patch($this->url(1), ['status' => 'in_progress'])->assertSessionHasNoErrors();
        $this->assertTrue($stamp->equalTo($this->item(1)->completed_at));
        $this->assertSame(1, ActivityEvent::where('event_type', 'checklist_reviewed')->count());
        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('stats.completed', 1)->where('stats.xp', 0)->where('stats.streak', 0)->where('stats.verified_minutes', 0)->where('stats.estimated_reviewed_minutes', 20));
        $this->seed(RoadmapSeeder::class);
        $this->assertDatabaseHas('roadmap_items', ['id' => $this->item(1)->id, 'status' => 'completed']);
    }

    public function test_prerequisites_and_day_completion_require_all_three_manual_items(): void
    {
        $this->actingAs($this->learner());
        $this->patch($this->url(2), ['status' => 'completed'])->assertSessionHasErrors('status');
        foreach ([1, 2, 3] as $id) {
            $this->patch($this->url($id), ['status' => 'completed'])->assertSessionHasNoErrors();
        }
        $this->get('/roadmap')->assertInertia(fn (Assert $page) => $page->where('stats.days_completed', 1)->where('phases.0.weeks.0.tasks.3.status', 'available'));
    }

    public function test_foreign_item_ids_cannot_be_mutated_and_queries_cannot_select_another_user(): void
    {
        $owner = $this->learner();
        $other = $this->learner();
        $this->actingAs($owner)->patch($this->url(1), ['status' => 'completed'])->assertSessionHasNoErrors();
        $this->assertFalse(Gate::forUser($other)->allows('update', $this->item(1)));
        $this->actingAs($other)->patch($this->url(1), ['status' => 'completed'])->assertForbidden();
        $this->get('/dashboard?user_id='.$owner->id)->assertInertia(fn (Assert $page) => $page->where('stats.completed', 0)->has('activities', 0)->where('nextTask.id', $this->item(271)->id));
        $this->patch($this->url(271), ['status' => 'completed', 'user_id' => $owner->id])->assertSessionHasErrors('user_id');
    }

    public function test_lesson_and_lab_items_cannot_be_manually_completed(): void
    {
        $this->actingAs($this->learner());
        foreach (['lab', 'lesson'] as $type) {
            $this->item(1)->update(['task_type' => $type]);
            foreach (['in_progress', 'completed'] as $status) {
                $this->patch($this->url(1), compact('status'))->assertSessionHasErrors('status');
            }
        }
        $this->get('/labs')->assertOk(); // Sprint 3 catalog is available; manual lab completion stays prohibited.
        $this->post('/labs/1/start')->assertNotFound();
        $this->assertDatabaseCount('activity_events', 0);
    }

    public function test_rescheduling_preserves_progress_and_only_updates_own_plan(): void
    {
        $owner = $this->learner();
        $other = $this->learner();
        $this->actingAs($owner)->patch($this->url(1), ['status' => 'completed'])->assertSessionHasNoErrors();
        $stamp = $this->item(1)->completed_at;
        $this->patch('/roadmap/plan', ['starts_on' => '2026-10-24', 'timezone' => 'UTC', 'daily_goal_minutes' => 120])->assertSessionHasNoErrors();
        $this->assertSame('2026-10-24', RoadmapPlan::where('user_id', $owner->id)->first()->starts_on->toDateString());
        $this->assertSame('2026-10-23', RoadmapPlan::where('user_id', $other->id)->first()->starts_on->toDateString());
        $this->assertSame('2027-01-21', RoadmapDay::orderBy('id')->skip(89)->firstOrFail()->scheduled_on->toDateString());
        $this->assertTrue($stamp->equalTo($this->item(1)->completed_at));
        $this->assertDatabaseCount('roadmap_items', 540);
        $this->assertStringStartsWith('Review ringan dan rekap:', $this->item(5)->title);
    }

    public function test_invalid_dates_goal_and_client_awards_are_rejected(): void
    {
        $this->actingAs($this->learner());
        $this->patch('/roadmap/plan', ['starts_on' => '2026-02-30', 'timezone' => 'invalid', 'daily_goal_minutes' => 10])->assertSessionHasErrors(['starts_on', 'timezone', 'daily_goal_minutes']);
        $this->patch($this->url(1), ['status' => 'done'])->assertSessionHasErrors('status');
        $this->patch($this->url(1), ['status' => 'completed', 'xp_awarded' => 999, 'completed_at' => '2026-10-23'])->assertSessionHasErrors(['xp_awarded', 'completed_at']);
        $this->patch('/roadmap/items/99999', ['status' => 'completed'])->assertNotFound();
        $this->patch('/tasks/1/progress', ['status' => 'done'])->assertStatus(410);
    }

    public function test_legacy_progress_is_preserved_as_owner_scoped_archive_not_new_completion(): void
    {
        $owner = User::factory()->create();
        $task = RoadmapTask::create(['week_id' => DB::table('weeks')->value('id'), 'day_number' => 1, 'sort_order' => 1, 'title' => 'Legacy self study', 'description' => 'Old checklist', 'task_type' => 'reading', 'estimated_minutes' => 45]);
        UserTaskProgress::create(['user_id' => $owner->id, 'roadmap_task_id' => $task->id, 'status' => 'done', 'completed_at' => now(), 'xp_awarded' => 10]);
        $this->actingAs($owner)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->has('legacyProgress', 1)->where('stats.completed', 0)->where('stats.xp', 0));
        $this->actingAs(User::factory()->create())->get('/dashboard')->assertInertia(fn (Assert $page) => $page->has('legacyProgress', 0));
        $this->assertDatabaseCount('user_task_progress', 1);
    }

    public function test_missing_templates_give_validation_error_and_no_partial_plan(): void
    {
        DB::table('roadmap_day_templates')->delete();
        $this->actingAs(User::factory()->create())->post('/roadmap/plan', ['starts_on' => '2026-10-23', 'timezone' => 'Asia/Jakarta', 'daily_goal_minutes' => 120])->assertSessionHasErrors('starts_on');
        $this->assertDatabaseCount('roadmap_plans', 0);
        $this->assertDatabaseCount('roadmap_days', 0);
    }
}
