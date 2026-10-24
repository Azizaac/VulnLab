<?php

namespace Tests\Feature;

use App\Models\LearningPath;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use App\Services\RoadmapService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LearningTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function answers(Lesson $lesson, bool $correct = true): array
    {
        return $lesson->questions()->with('choices')->get()->map(fn ($q) => ['question_id' => $q->id, 'choice_id' => $q->choices->firstWhere('is_correct', $correct)->id])->all();
    }

    private function submit(Lesson $l, bool $correct = true, ?string $id = null)
    {
        return $this->postJson('/learning/'.$l->slug.'/quiz', ['submission_id' => $id ?? (string) Str::uuid(), 'answers' => $this->answers($l, $correct)]);
    }

    public function test_import_preserves_all_original_content_and_is_idempotent(): void
    {
        $this->assertDatabaseCount('lessons', 25);
        $this->assertDatabaseCount('quiz_questions', 50);
        $this->assertDatabaseCount('quiz_choices', 200);
        $this->assertDatabaseCount('modules', 10);
        $this->assertSame(10, LearningPath::where('is_course', true)->count());
        $this->assertDatabaseCount('lab_specs', 9); // Original eight retained, plus the new JWT lab metadata.
        $this->assertDatabaseCount('roadmap_lesson_links', 90);
        $source = json_decode(file_get_contents(database_path('data/lessons-v4.json')), true);
        foreach ($source as $row) {
            $l = Lesson::where('source_id', $row['id'])->firstOrFail();
            $this->assertSame($row['body_md'], $l->body_md);
            $this->assertEquals($row, $l->source_snapshot);
            $this->assertNotEmpty($l->enrichment['technical']);
            $this->assertNotEmpty($l->enrichment['mistakes']);
            $this->assertNull($l->reviewed_at);
            $this->assertSame(count($row['prerequisites']), $l->prerequisites->count());
        }
        $user = User::factory()->create();
        $l = Lesson::first();
        $this->actingAs($user)->post('/learning/'.$l->slug.'/read')->assertRedirect();
        $this->seed(DatabaseSeeder::class);
        $this->assertDatabaseCount('lessons', 25);
        $this->assertDatabaseCount('quiz_questions', 50);
        $this->assertDatabaseCount('lesson_progress', 1);
        $this->assertNotNull(LessonProgress::first()->read_at);
    }

    public function test_authentication_and_safe_lesson_payload_without_answers(): void
    {
        $this->get('/learning')->assertRedirect('/login');
        $this->get('/learning/client-server')->assertRedirect('/login');
        $this->actingAs(User::factory()->create());
        $this->get('/learning')->assertInertia(fn (Assert $p) => $p->component('Learning')->has('courses', 10));
        $this->get('/learning/client-server')->assertInertia(fn (Assert $p) => $p->component('LessonReader')->has('questions', 2)->missing('questions.0.explanation')->missing('questions.0.choices.0.is_correct')->missing('questions.0.choices.0.source_key')->missing('lesson.source_snapshot')->has('attempts', 0));
        $this->assertDatabaseCount('lesson_progress', 0);
        $this->assertDatabaseCount('quiz_attempts', 0);
        foreach (Lesson::all() as $l) {
            $this->get('/learning/'.$l->slug)->assertOk();
        }
    }

    public function test_read_then_server_quiz_grading_retries_and_idempotency(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $l = Lesson::where('slug', 'client-server')->firstOrFail();
        $this->submit($l)->assertUnprocessable();
        $this->post('/learning/'.$l->slug.'/read')->assertRedirect();
        $this->submit($l, false)->assertOk()->assertJsonPath('score', 0)->assertJsonPath('passed', false)->assertJsonStructure(['feedback' => [['question', 'answer', 'explanation', 'selected', 'correct']]]);
        $this->assertNull(LessonProgress::first()->completed_at);
        $id = (string) Str::uuid();
        $this->submit($l, true, $id)->assertOk()->assertJsonPath('score', 100)->assertJsonPath('passed', true);
        $this->submit($l, true, $id)->assertOk();
        $this->assertDatabaseCount('quiz_attempts', 2);
        $this->submit($l, false)->assertOk();
        $this->assertNotNull(LessonProgress::first()->quiz_passed_at);
        $this->assertNotNull(LessonProgress::first()->completed_at);
        $this->post('/learning/'.$l->slug.'/read')->assertRedirect();
        $this->assertSame(1, DB::table('activity_events')->where('event_type', 'lesson_completed')->count());
        $this->get('/learning/'.$l->slug)->assertInertia(fn (Assert $p) => $p->has('attempts', 3));
        $this->actingAs(User::factory()->create())->get('/learning/'.$l->slug)->assertInertia(fn (Assert $p) => $p->has('attempts', 0)->where('courses.0.completed', 0));
    }

    public function test_quiz_spoofing_foreign_choices_duplicates_and_prerequisites_are_rejected(): void
    {
        $this->actingAs(User::factory()->create());
        $l = Lesson::where('slug', 'client-server')->firstOrFail();
        $locked = Lesson::where('slug', 'http-methods')->firstOrFail();
        $this->postJson('/learning/'.$locked->slug.'/read')->assertUnprocessable();
        $this->submit($locked)->assertUnprocessable();
        $this->post('/learning/'.$l->slug.'/read')->assertRedirect();
        $base = ['submission_id' => (string) Str::uuid(), 'answers' => $this->answers($l)];
        foreach (['score' => 100, 'passed' => true, 'user_id' => 3, 'xp' => 999, 'lab_solved' => true, 'skill_demonstrated' => true] as $key => $value) {
            $this->postJson('/learning/'.$l->slug.'/quiz', [...$base, $key => $value])->assertUnprocessable();
        }
        $this->postJson('/learning/'.$l->slug.'/quiz', [...$base, 'answers' => $this->answers($locked)])->assertUnprocessable();
        $answers = $this->answers($l);
        $answers[1] = $answers[0];
        $this->postJson('/learning/'.$l->slug.'/quiz', [...$base, 'answers' => $answers])->assertUnprocessable();
        $answers = $this->answers($l);
        $answers[0]['choice_id'] = $this->answers($locked)[0]['choice_id'];
        $this->postJson('/learning/'.$l->slug.'/quiz', [...$base, 'answers' => $answers])->assertUnprocessable();
        $this->assertDatabaseCount('quiz_attempts', 0);
        $this->submit($l)->assertOk();
        $this->postJson('/learning/'.$locked->slug.'/read')->assertRedirect();
    }

    public function test_partial_score_is_calculated_server_side(): void
    {
        $this->actingAs(User::factory()->create());
        $l = Lesson::first();
        $this->post('/learning/'.$l->slug.'/read');
        $answers = $this->answers($l);
        $answers[1] = $this->answers($l, false)[1];
        $this->postJson('/learning/'.$l->slug.'/quiz', ['submission_id' => (string) Str::uuid(), 'answers' => $answers])->assertOk()->assertJsonPath('score', 50)->assertJsonPath('passed', false);
    }

    public function test_roadmap_and_dashboard_use_separate_learning_evidence_without_reset(): void
    {
        $user = User::factory()->create();
        $roadmap = app(RoadmapService::class);
        $plan = $roadmap->create($user, '2026-10-24', 'Asia/Jakarta');
        $before = DB::table('roadmap_items')->get()->toJson();
        $this->actingAs($user);
        $l = Lesson::first();
        $this->post('/learning/'.$l->slug.'/read');
        $this->submit($l)->assertOk();
        $data = $roadmap->overview($user);
        $this->assertSame(1, $data['stats']['lessons_completed']);
        $this->assertSame(0, $data['stats']['completed']);
        $this->assertSame(30, $data['stats']['xp']); // First quiz pass +20 and lesson completion +10.
        $this->assertSame(0, $data['stats']['labs_solved']);
        $this->assertSame('http-methods', $data['nextLesson']['slug']);
        $this->assertTrue($data['phases'][0]['weeks'][0]['tasks'][0]['lesson']['completed']);
        $this->assertSame($before, DB::table('roadmap_items')->get()->toJson());
        $this->assertDatabaseCount('roadmap_plans', 1);
        $this->seed(DatabaseSeeder::class);
        $this->assertSame($before, DB::table('roadmap_items')->get()->toJson());
    }
}
