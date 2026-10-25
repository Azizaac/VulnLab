<?php

namespace Tests\Feature;

use App\Models\ContentEntry;
use App\Models\ContentRevision;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\User;
use App\Services\ContentCatalog;
use App\Services\LearningService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FinalQaTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_rotates_session_identifier_and_logout_invalidates_it(): void
    {
        $user = User::factory()->create(['password' => 'rotation-test-password']);
        $this->withSession(['fixture' => 'retained']);
        $before = session()->getId();
        $this->post('/login', ['email' => $user->email, 'password' => 'rotation-test-password'])->assertRedirect('/dashboard')->assertSessionHas('fixture', 'retained');
        $authenticated = session()->getId();
        $this->assertNotSame($before, $authenticated);
        $this->post('/logout')->assertRedirect('/login');
        $this->assertNotSame($authenticated, session()->getId());
        $this->assertGuest();
    }

    public function test_readiness_is_separate_from_liveness_and_does_not_leak_database_errors(): void
    {
        $this->getJson('/ready')->assertOk()->assertExactJson(['ready' => true, 'database' => true, 'storage' => true]);
        DB::shouldReceive('select')->once()->with('select 1')->andThrow(new \RuntimeException('secret-password-host'));
        $this->getJson('/ready')->assertStatus(503)->assertExactJson(['ready' => false, 'database' => false, 'storage' => true])->assertDontSee('secret-password');
        $this->get('/up')->assertOk();
    }

    public function test_pages_receive_unique_csp_nonces_and_private_history(): void
    {
        $first = $this->get('/login')->assertOk()->assertHeader('X-Frame-Options', 'DENY')->assertHeader('X-Content-Type-Options', 'nosniff');
        $policy = $first->headers->get('Content-Security-Policy');
        preg_match("/nonce-([^']+)/", $policy, $match);
        $this->assertNotEmpty($match[1]);
        $first->assertSee('nonce="'.$match[1].'"', false);
        $this->assertStringNotContainsString("script-src 'self' 'unsafe-inline'", $policy);
        $this->assertNotSame($policy, $this->get('/login')->headers->get('Content-Security-Policy'));
        $this->assertTrue(config('inertia.history.encrypt'));
        $this->actingAs(User::factory()->create())->get('/settings/general')->assertOk()->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_studio_filters_use_current_revision_and_resolve_parent_paths_for_all_content_kinds(): void
    {
        $this->seed(DatabaseSeeder::class);
        app(ContentCatalog::class)->importLegacy();
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        $entry = ContentEntry::where('kind', 'lesson')->firstOrFail();
        $old = $entry->revisions()->firstOrFail();
        $data = $old->data_json;
        $old->forceFill(['data_json' => [...$data, 'title' => 'ObsoleteUniqueTitle']])->save();
        ContentRevision::create(['content_entry_id' => $entry->id, 'number' => $old->number + 1, 'status' => 'draft', 'lock_version' => 1, 'data_json' => [...$data, 'title' => 'CurrentUniqueTitle'], 'author_id' => $admin->id]);
        $this->actingAs($admin)->get('/studio/content?q=ObsoleteUniqueTitle')->assertInertia(fn (Assert $p) => $p->has('entries.data', 0));
        $this->get('/studio/content?q=CurrentUniqueTitle')->assertInertia(fn (Assert $p) => $p->has('entries.data', 1));
        $labLesson = ContentEntry::where('kind', 'lab')->firstOrFail()->revisions()->firstOrFail()->data_json['lesson_id'];
        $moduleId = DB::table('lessons')->where('id', $labLesson)->value('module_id');
        $pathId = DB::table('modules')->where('id', $moduleId)->value('learning_path_id');
        foreach (['module', 'lesson', 'quiz', 'lab'] as $kind) {
            $this->get('/studio/content?kind='.$kind.'&path_id='.$pathId)->assertInertia(fn (Assert $p) => $p->where('entries.total', fn ($total) => $total > 0)->etc());
        }
    }

    public function test_content_errata_are_additive_and_stop_applying_after_an_editorial_change(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->actingAs(User::factory()->create());
        foreach (['rest-api-json' => 'body respons', 'laravel-fixes' => 'Gate::authorize'] as $slug => $expected) {
            $lesson = Lesson::where('slug', $slug)->firstOrFail();
            $before = $lesson->body_md;
            $this->get('/learning/'.$slug)->assertInertia(fn (Assert $p) => $p->where('clarification', fn ($value) => str_contains($value, $expected)));
            $this->assertSame($before, $lesson->fresh()->body_md);
            $lesson->update(['body_md' => $before."\nEditorial change"]);
            $this->get('/learning/'.$slug)->assertInertia(fn (Assert $p) => $p->where('clarification', null));
        }
    }

    public function test_catalog_listing_does_not_query_sources_per_module(): void
    {
        $this->seed(DatabaseSeeder::class);
        $user = User::factory()->create();
        $measure = function () use ($user) {
            DB::flushQueryLog();
            DB::enableQueryLog();
            $start = hrtime(true);
            $courses = app(LearningService::class)->courses($user);
            $queries = DB::getQueryLog();
            DB::disableQueryLog();

            return ['modules' => count($courses), 'queries' => count($queries), 'sources' => count(array_filter($queries, fn ($q) => str_contains($q['query'], 'lesson_sources'))), 'ms' => round((hrtime(true) - $start) / 1e6, 2)];
        };
        $small = $measure();
        $module = Module::whereHas('path', fn ($q) => $q->where('is_course', true))->firstOrFail();
        foreach (range(1, 20) as $i) {
            $copy = $module->replicate();
            $copy->sort_order = 1000 + $i;
            $copy->save();
        }
        $large = $measure();
        fwrite(STDOUT, "\nCatalog performance ".json_encode(['small' => $small, 'large' => $large])."\n");
        $this->assertLessThanOrEqual(1, $large['sources'], 'Sources must be fetched once for the catalog.');
        $this->assertLessThanOrEqual($small['queries'] + 2, $large['queries']);
    }

    public function test_studio_pagination_has_bounded_query_growth(): void
    {
        $this->seed(DatabaseSeeder::class);
        app(ContentCatalog::class)->importLegacy();
        $user = User::factory()->create();
        $user->forceFill(['role' => 'admin'])->save();
        $this->actingAs($user);
        $measure = function () {
            DB::flushQueryLog();
            DB::enableQueryLog();
            $start = hrtime(true);
            $this->get('/studio/content')->assertInertia(fn (Assert $p) => $p->has('entries.data', 15));
            $result = ['queries' => count(DB::getQueryLog()), 'ms' => round((hrtime(true) - $start) / 1e6, 2)];
            DB::disableQueryLog();

            return $result;
        };
        $small = $measure();
        foreach (range(1, 30) as $i) {
            $entry = ContentEntry::create(['kind' => 'lesson', 'slug' => 'qa-pagination-'.$i]);
            ContentRevision::create(['content_entry_id' => $entry->id, 'number' => 1, 'status' => 'draft', 'author_id' => $user->id, 'data_json' => ['title' => 'QA fixture '.$i]]);
        }
        $large = $measure();
        fwrite(STDOUT, "\nStudio performance ".json_encode(['small' => $small, 'large' => $large, 'added_entries' => 30])."\n");
        $this->assertLessThanOrEqual($small['queries'] + 2, $large['queries']);
    }
}
