<?php

namespace Tests\Feature;

use App\Models\Lab;
use App\Models\LabProgress;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Note;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Services\LearningEventService;
use App\Services\ProgressService;
use App\Services\RoadmapService;
use Carbon\CarbonImmutable;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProgressTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function completedLesson(User $user, Lesson $lesson, string $at): void
    {
        QuizAttempt::create(['user_id' => $user->id, 'lesson_id' => $lesson->id, 'submission_id' => (string) Str::uuid(), 'score' => 100, 'passed' => true, 'feedback' => [], 'created_at' => $at]);
        LessonProgress::create(['user_id' => $user->id, 'lesson_id' => $lesson->id, 'read_at' => $at, 'quiz_passed_at' => $at, 'completed_at' => $at]);
    }

    public function test_progress_requires_auth_and_honest_empty_state_has_no_write_side_effects(): void
    {
        $this->get('/progress')->assertRedirect('/login');
        $user = User::factory()->create();
        $this->actingAs($user)->get('/progress')->assertInertia(fn (Assert $page) => $page->component('Progress')
            ->where('progress.summary.total_xp', 0)->where('progress.summary.level', 1)
            ->where('progress.summary.verified_minutes', null)->where('progress.summary.roadmap_total', 0)
            ->where('progress.streak.current', 0)->where('progress.has_activity', false)
            ->has('progress.activity', 7)->has('progress.skills', 8)->where('progress.skills.0.score', null)
            ->has('progress.achievements', 8));
        $this->assertDatabaseCount('learning_activity_events', 0);
        $this->assertDatabaseCount('xp_transactions', 0);
        $this->assertDatabaseCount('user_achievements', 0);
        $this->getJson('/progress?period=invalid')->assertUnprocessable();
        $this->getJson('/progress?user_id=123')->assertUnprocessable();
        $this->postJson('/progress', ['xp' => 99999])->assertStatus(405);
    }

    public function test_only_first_server_graded_completion_awards_quiz_and_lesson_xp(): void
    {
        $user = User::factory()->create();
        $lesson = Lesson::where('slug', 'client-server')->firstOrFail();
        $this->actingAs($user)->post('/learning/'.$lesson->slug.'/read')->assertRedirect();
        $this->assertDatabaseCount('xp_transactions', 0);
        $answers = fn (bool $correct) => $lesson->questions()->with('choices')->get()->map(fn ($question) => ['question_id' => $question->id, 'choice_id' => $question->choices->firstWhere('is_correct', $correct)->id])->all();
        $this->postJson('/learning/'.$lesson->slug.'/quiz', ['submission_id' => (string) Str::uuid(), 'answers' => $answers(false)])->assertOk()->assertJsonPath('xp_delta', 0)->assertJsonPath('correct_count', 0)->assertJsonPath('total_questions', 2);
        $this->assertDatabaseCount('xp_transactions', 0);
        $id = (string) Str::uuid();
        $this->postJson('/learning/'.$lesson->slug.'/quiz', ['submission_id' => $id, 'answers' => $answers(true)])->assertOk()->assertJsonPath('xp_delta', 30)->assertJsonPath('correct_count', 2);
        foreach ([$id, (string) Str::uuid()] as $submission) {
            $this->postJson('/learning/'.$lesson->slug.'/quiz', ['submission_id' => $submission, 'answers' => $answers(true)])->assertOk()->assertJsonPath('xp_delta', 0);
        }
        $this->assertDatabaseCount('learning_activity_events', 2);
        $this->assertDatabaseCount('xp_transactions', 2);
        $this->assertDatabaseCount('user_achievements', 2);
        $this->assertSame(30, app(LearningEventService::class)->level($user)['total_xp']);
        $this->postJson('/learning/'.$lesson->slug.'/quiz', ['submission_id' => (string) Str::uuid(), 'answers' => $answers(true), 'xp' => 1000])->assertUnprocessable();
    }

    public function test_backfill_is_idempotent_preserves_source_rows_and_imports_old_lab_xp_once(): void
    {
        $user = User::factory()->create();
        $lesson = Lesson::firstOrFail();
        $this->completedLesson($user, $lesson, '2026-10-20 10:00:00');
        $lab = Lab::firstOrFail();
        LabProgress::create(['user_id' => $user->id, 'lab_id' => $lab->id, 'solved_at' => '2026-10-21 10:00:00', 'points_awarded' => 50]);
        DB::table('xp_events')->insert(['user_id' => $user->id, 'lab_id' => $lab->id, 'points' => 50, 'created_at' => '2026-10-21 10:00:00']);
        $before = [DB::table('lesson_progress')->get()->toJson(), DB::table('quiz_attempts')->get()->toJson(), DB::table('lab_progress')->get()->toJson(), DB::table('xp_events')->get()->toJson()];
        $events = app(LearningEventService::class);
        $events->backfill($user);
        $events->backfill($user);
        $this->assertSame(80, $events->level($user)['total_xp']);
        $this->assertDatabaseCount('learning_activity_events', 3);
        $this->assertDatabaseCount('xp_transactions', 3);
        $this->assertDatabaseCount('learning_backfills', 1);
        $after = [DB::table('lesson_progress')->get()->toJson(), DB::table('quiz_attempts')->get()->toJson(), DB::table('lab_progress')->get()->toJson(), DB::table('xp_events')->get()->toJson()];
        $this->assertSame($before, $after);
        $this->assertDatabaseHas('learning_activity_events', ['event_type' => 'lab_solved', 'occurred_at' => '2026-10-21 10:00:00']);
        $this->assertSame(0, $events->record($user, 'lab_solved', 'lab', $lab->id)['xp_delta']);
    }

    public function test_legacy_reward_without_progress_is_preserved_without_invented_solve_event(): void
    {
        $user = User::factory()->create();
        DB::table('xp_events')->insert(['user_id' => $user->id, 'lab_id' => Lab::first()->id, 'points' => 50, 'created_at' => now()]);
        app(LearningEventService::class)->backfill($user);
        $progress = app(ProgressService::class)->overview($user);
        $this->assertSame(50, $progress['summary']['total_xp']);
        $this->assertSame(0, $progress['summary']['labs_solved']);
        $this->assertFalse($progress['has_activity']);
    }

    public function test_timezone_calendar_streak_handles_dst_midnight_and_yesterday_grace(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-02 12:00:00', 'UTC'));
        $user = User::factory()->create(['timezone' => 'America/New_York']);
        $events = app(LearningEventService::class);
        $lessons = Lesson::orderBy('id')->take(4)->get();
        // November 1 has 25 hours in New York. Two UTC dates can be one local day.
        foreach (['2026-11-01 03:50:00', '2026-11-01 04:10:00', '2026-11-02 04:50:00', '2026-11-02 05:10:00'] as $i => $at) {
            $this->completedLesson($user, $lessons[$i], $at);
            $events->record($user, 'quiz_passed', 'lesson', $lessons[$i]->id, $at);
        }
        $this->assertSame(3, $events->streak($user)['current']);
        $this->assertSame(3, $events->streak($user)['longest']);
        $this->assertSame(3, collect($events->streak($user)['days'])->where('qualified', true)->count());
        $this->travelTo(CarbonImmutable::parse('2026-11-03 12:00:00', 'UTC'));
        $this->assertSame(3, $events->streak($user)['current']);
        $this->travelTo(CarbonImmutable::parse('2026-11-04 12:00:00', 'UTC'));
        $this->assertSame(0, $events->streak($user)['current']);
        $this->assertSame(3, $events->streak($user)['longest']);
    }

    public function test_period_chart_uses_local_dates_summary_is_lifetime_and_other_user_is_isolated(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-25 05:00:00', 'UTC'));
        $user = User::factory()->create(['timezone' => 'Asia/Jakarta']);
        $other = User::factory()->create();
        $lessons = Lesson::orderBy('id')->take(2)->get();
        $this->completedLesson($user, $lessons[0], '2026-10-24 17:10:00');
        $this->completedLesson($other, $lessons[1], '2026-10-24 17:10:00');
        foreach ([$user, $other] as $i => $learner) {
            app(LearningEventService::class)->backfill($learner);
        }
        $this->actingAs($user)->get('/progress?period=30')->assertInertia(fn (Assert $page) => $page->has('progress.activity', 30)->where('progress.activity.29.date', '2026-10-25')->where('progress.activity.29.quizzes', 1)->where('progress.summary.total_xp', 30)->where('progress.summary.lessons_completed', 1));
        $this->get('/progress?period=90')->assertInertia(fn (Assert $page) => $page->has('progress.activity', 90));
        $this->get('/progress?period=all')->assertInertia(fn (Assert $page) => $page->has('progress.activity', 1));
    }

    public function test_skills_expose_denominators_and_require_practice_evidence(): void
    {
        $user = User::factory()->create();
        $lesson = Lesson::where('slug', 'client-server')->firstOrFail();
        $this->completedLesson($user, $lesson, now()->toDateTimeString());
        app(LearningEventService::class)->backfill($user);
        $skills = collect(app(ProgressService::class)->overview($user)['skills'])->keyBy('key');
        $this->assertSame(6, $skills['web_fundamentals']['quiz_total']);
        $this->assertEquals(6.7, $skills['web_fundamentals']['score']);
        $this->assertFalse($skills['web_fundamentals']['practice_assessed']);
        $this->assertNull($skills['access_control']['score']);
        $lab = Lab::where('slug', 'order-idor')->firstOrFail();
        LabProgress::create(['user_id' => $user->id, 'lab_id' => $lab->id, 'solved_at' => now(), 'points_awarded' => 50]);
        app(LearningEventService::class)->record($user, 'lab_solved', 'lab', $lab->id);
        $skills = collect(app(ProgressService::class)->overview($user)['skills'])->keyBy('key');
        $this->assertSame(3, $skills['access_control']['labs_total']);
        $this->assertEquals(20, $skills['access_control']['score']);
        $this->assertTrue($skills['access_control']['practice_assessed']);
    }

    public function test_note_badge_is_private_persistent_idempotent_and_never_awards_xp(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        foreach (range(1, 10) as $number) {
            Note::forceCreate(['user_id' => $other->id, 'title' => 'Private '.$number, 'body_md' => 'A real note']);
        }
        foreach (range(1, 9) as $number) {
            Note::forceCreate(['user_id' => $user->id, 'title' => 'Note '.$number, 'body_md' => 'A real note']);
        }
        Note::forceCreate(['user_id' => $user->id, 'title' => 'Empty', 'body_md' => '   ']);
        $service = app(LearningEventService::class);
        $this->assertSame([], $service->refreshAchievements($user));
        $this->actingAs($user)->postJson('/notes', ['title' => 'Tenth useful note', 'body_md' => 'Evidence and remediation', 'category' => 'Belajar', 'pinned' => false, 'tags' => []])->assertCreated();
        $this->assertDatabaseCount('user_achievements', 1);
        $this->assertSame([], $service->refreshAchievements($user));
        $this->assertDatabaseCount('xp_transactions', 0);
        $this->assertDatabaseCount('learning_activity_events', 0);
    }

    public function test_level_thresholds_and_unqualified_rewards_are_server_authoritative(): void
    {
        $user = User::factory()->create();
        $service = app(LearningEventService::class);
        foreach ([0 => 1, 99 => 1, 100 => 2, 399 => 2, 400 => 3, 899 => 3, 900 => 4] as $xp => $level) {
            DB::table('xp_transactions')->where('user_id', $user->id)->delete();
            if ($xp) {
                DB::table('xp_transactions')->insert(['user_id' => $user->id, 'source_type' => 'fixture', 'source_id' => 1, 'reward_key' => 'test-threshold', 'amount' => $xp, 'granted_at' => now(), 'context_json' => '{}', 'created_at' => now(), 'updated_at' => now()]);
            }
            $this->assertSame($level, $service->level($user)['level']);
            $this->assertSame(100 * $level ** 2, $service->level($user)['next_level_xp']);
        }
        $this->expectException(\InvalidArgumentException::class);
        $service->record($user, 'lab_solved', 'lab', Lab::first()->id);
    }

    public function test_http_and_api_badges_require_all_distinct_mapped_evidence(): void
    {
        $user = User::factory()->create();
        $service = app(LearningEventService::class);
        foreach (Lesson::whereIn('slug', LearningEventService::HTTP_LESSONS)->get() as $lesson) {
            $this->completedLesson($user, $lesson, now()->subDay()->toDateTimeString());
        }
        $service->backfill($user);
        $badges = collect($service->achievements($user))->keyBy('code');
        $this->assertNotNull($badges['http_explorer']['unlocked_at']);
        $this->assertNull($badges['api_explorer']['unlocked_at']);
        foreach (Lab::whereIn('slug', LearningEventService::API_LABS)->orderBy('id')->get() as $index => $lab) {
            LabProgress::create(['user_id' => $user->id, 'lab_id' => $lab->id, 'solved_at' => now(), 'points_awarded' => $lab->points]);
            $service->record($user, 'lab_solved', 'lab', $lab->id);
            $service->record($user, 'lab_solved', 'lab', $lab->id);
            $badge = collect($service->achievements($user))->firstWhere('code', 'api_explorer');
            $this->assertEquals($index + 1, $badge['progress']);
            $this->assertSame($index === 4, $badge['unlocked_at'] !== null);
        }
        $this->assertDatabaseCount('user_achievements', 5);
        $this->assertDatabaseCount('xp_transactions', 17); // Six lessons + six quizzes + five distinct labs.
    }

    public function test_seven_day_badge_unlocks_once_and_preserves_its_original_unlock_date(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-24 12:00:00', 'UTC'));
        $user = User::factory()->create(['timezone' => 'Asia/Jakarta']);
        foreach (Lesson::orderBy('id')->take(7)->get() as $index => $lesson) {
            $this->completedLesson($user, $lesson, now()->subDays(6 - $index)->toDateTimeString());
        }
        $service = app(LearningEventService::class);
        $service->backfill($user);
        $badge = collect($service->achievements($user))->firstWhere('code', 'week_warrior');
        $this->assertNotNull($badge['unlocked_at']);
        $this->assertSame(7, $service->streak($user)['current']);
        $this->assertSame(7, $service->streak($user)['longest']);
        $this->travel(3)->days();
        $service->refreshAchievements($user);
        $this->assertSame($badge['unlocked_at'], collect($service->achievements($user))->firstWhere('code', 'week_warrior')['unlocked_at']);
    }

    public function test_checklist_review_and_page_visits_do_not_qualify_for_xp_or_streak(): void
    {
        $user = User::factory()->create();
        app(RoadmapService::class)->create($user, '2026-10-24', 'Asia/Jakarta');
        $item = DB::table('roadmap_items')->orderBy('id')->first();
        $this->actingAs($user)->patch('/roadmap/items/'.$item->id, ['status' => 'completed'])->assertRedirect();
        $this->get('/dashboard')->assertOk();
        $this->assertDatabaseCount('learning_activity_events', 0);
        $this->assertDatabaseCount('xp_transactions', 0);
        $this->assertSame(0, app(LearningEventService::class)->streak($user)['current']);
        $this->assertSame(1, app(ProgressService::class)->overview($user)['summary']['roadmap_completed']);
    }

    public function test_journey_day_uses_calendar_dates_instead_of_utc_elapsed_hours(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-25 01:00:00', 'Asia/Jakarta'));
        $user = User::factory()->create(['timezone' => 'Asia/Jakarta']);
        app(RoadmapService::class)->create($user, '2026-10-24', 'Asia/Jakarta');
        $journey = app(ProgressService::class)->overview($user)['journey'];
        $this->assertSame(2, $journey['current_day']);
        $this->assertSame(90, $journey['total_days']);
        $this->assertSame('2027-01-21', $journey['ends_on']);
    }
}
