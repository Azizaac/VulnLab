<?php

namespace Tests\Feature;

use App\Contracts\LabRunnerAdapter;
use App\Models\LabSession;
use App\Models\User;
use App\Services\LocalLabRunnerAdapter;
use App\Services\RoadmapService;
use App\Services\SafeMarkdown;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class LabTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        config(['labs.enabled' => true, 'labs.runner_token' => str_repeat('a', 64)]);
        $fake = new class implements LabRunnerAdapter
        {
            public bool $eligible = true;

            public function provision(LabSession $s): array
            {
                return ['ready' => true];
            }

            public function request(LabSession $s, array $r): array
            {
                return ['status' => 200, 'body' => '{"dummy":true}', 'headers' => ['content-type' => 'application/json'], 'elapsed_ms' => 1, 'generation' => $s->generation, 'request' => $r];
            }

            public function evidence(LabSession $s): array
            {
                return ['eligible' => $this->eligible, 'generation' => $s->generation, 'lab' => $s->lab->slug];
            }

            public function stop(LabSession $s): array
            {
                return ['stopped' => true];
            }
        };
        $this->app->instance(LabRunnerAdapter::class, $fake);
    }

    private function start(?User $user = null, string $slug = 'order-idor'): LabSession
    {
        $this->actingAs($user ?? User::factory()->create());
        $this->postJson('/labs/'.$slug.'/sessions')->assertOk()->assertJsonPath('session.status', 'running');

        return LabSession::where('user_id', auth()->id())->whereHas('lab', fn ($q) => $q->where('slug', $slug))->firstOrFail();
    }

    private function requestData(LabSession $s): array
    {
        return ['generation' => $s->generation, 'endpoint' => 'order-a', 'method' => 'GET', 'headers_json' => '{"X-Dummy-User":"customer_b"}', 'body_json' => '{}', 'mode' => 'vulnerable'];
    }

    private function flagData(LabSession $s): array
    {
        return ['generation' => $s->generation, 'submission_id' => (string) Str::uuid(), 'flag' => $s->flag_secret];
    }

    public function test_catalog_has_eight_original_definitions_and_no_secrets_or_unrevealed_solutions(): void
    {
        $this->get('/labs')->assertRedirect('/login');
        $this->actingAs(User::factory()->create());
        $this->get('/labs')->assertInertia(fn (Assert $p) => $p->component('Labs')->has('labs', 8)->where('labs.0.status', 'not_started'));
        $this->get('/labs/order-idor')->assertInertia(fn (Assert $p) => $p->component('LabWorkspace')->has('lab.instructions', 9)->where('solution', null)->where('session', null)->has('hints', 0)->missing('lab.solution_md')->missing('lab.hints'));
        $this->assertDatabaseCount('labs', 8);
        $this->assertDatabaseCount('lab_hints', 24);
        $this->assertDatabaseCount('lab_sessions', 0);
        $this->seed(DatabaseSeeder::class);
        $this->assertDatabaseCount('labs', 8);
    }

    public function test_start_is_idempotent_and_credentials_are_encrypted_and_hidden(): void
    {
        $s = $this->start();
        $this->postJson('/labs/order-idor/sessions')->assertOk()->assertJsonPath('session.id', $s->id);
        $this->assertDatabaseCount('lab_sessions', 1);
        $this->assertSame(1, $s->generation);
        $stored = DB::table('lab_sessions')->first();
        $this->assertNotSame($s->capability, $stored->capability);
        $this->assertNotSame($s->flag_secret, $stored->flag_secret);
        $this->assertArrayNotHasKey('flag_secret', $s->toArray());
        $this->get('/labs/order-idor')->assertInertia(fn (Assert $p) => $p->missing('session.flag_secret')->missing('session.flag_hash')->missing('session.capability'));
    }

    public function test_owner_policy_rejects_request_flag_reset_and_stop_and_history_is_private(): void
    {
        $s = $this->start();
        $a = $this->requestData($s);
        $flag = $this->flagData($s);
        $this->actingAs(User::factory()->create());
        $this->postJson('/lab-sessions/'.$s->id.'/request', $a)->assertForbidden();
        $this->postJson('/lab-sessions/'.$s->id.'/flag', $flag)->assertForbidden();
        foreach (['reset', 'stop'] as $action) {
            $this->postJson('/lab-sessions/'.$s->id.'/'.$action, ['generation' => 1])->assertForbidden();
        }
        $this->get('/labs/order-idor')->assertInertia(fn (Assert $p) => $p->where('session', null)->has('history', 0)->has('attempts', 0));
    }

    public function test_request_scope_headers_methods_and_shapes_reject_ssrf_before_runner(): void
    {
        $s = $this->start();
        $base = $this->requestData($s);
        foreach ([['endpoint' => 'http://169.254.169.254/'], ['endpoint' => '../_control/provision'], ['method' => 'DELETE'], ['headers_json' => '{"Host":"db:3306"}'], ['headers_json' => '{"Cookie":"real-session"}'], ['headers_json' => '{"X-Control-Token":"guess"}'], ['headers_json' => '{"X-Dummy-User":"real_user"}'], ['headers_json' => '[]'], ['body_json' => '[]'], ['body_json' => '{'], ['url' => 'http://example.org'], ['host' => 'db'], ['target' => 'http://127.0.0.1']] as $invalid) {
            $this->postJson('/lab-sessions/'.$s->id.'/request', [...$base, ...$invalid])->assertUnprocessable();
        }
        $this->assertDatabaseCount('lab_requests', 0);
        $this->postJson('/lab-sessions/'.$s->id.'/request', $base)->assertOk()->assertJsonPath('status', 200);
        $this->assertDatabaseCount('lab_requests', 1);
    }

    public function test_flag_needs_both_unpredictable_value_and_runner_evidence_awards_once(): void
    {
        $s = $this->start();
        $data = $this->flagData($s);
        $this->postJson('/lab-sessions/'.$s->id.'/flag', [...$data, 'flag' => 'VULNLAB{wrong}'])->assertOk()->assertJsonPath('success', false);
        $this->app->make(LabRunnerAdapter::class)->eligible = false;
        $this->postJson('/lab-sessions/'.$s->id.'/flag', $data)->assertOk()->assertJsonPath('success', false);
        $this->assertDatabaseCount('lab_progress', 0);
        $this->app->make(LabRunnerAdapter::class)->eligible = true;
        $data['submission_id'] = (string) Str::uuid();
        $this->postJson('/lab-sessions/'.$s->id.'/flag', $data)->assertOk()->assertJsonPath('success', true);
        $this->postJson('/lab-sessions/'.$s->id.'/flag', $data)->assertOk()->assertJsonPath('duplicate', true);
        $data['submission_id'] = (string) Str::uuid();
        $this->postJson('/lab-sessions/'.$s->id.'/flag', $data)->assertOk();
        $this->assertDatabaseCount('lab_progress', 1);
        $this->assertDatabaseCount('xp_events', 1);
        $this->assertSame(50, (int) DB::table('xp_events')->sum('points'));
        $this->assertDatabaseCount('lesson_progress', 0);
        foreach (['points' => 999, 'xp' => 999, 'success' => true, 'completed' => true, 'user_id' => 999] as $key => $value) {
            $this->postJson('/lab-sessions/'.$s->id.'/flag', [...$data, $key => $value])->assertUnprocessable();
        }
    }

    public function test_hints_unlock_progressively_and_survive_reset_without_completion(): void
    {
        $s = $this->start();
        for ($i = 1; $i <= 3; $i++) {
            $this->postJson('/labs/order-idor/hints', ['generation' => 1])->assertOk()->assertJsonCount($i, 'hints');
        }$this->postJson('/labs/order-idor/hints', ['generation' => 1])->assertJsonCount(3, 'hints');
        $this->assertDatabaseCount('lab_hint_usage', 3);
        $this->assertDatabaseCount('lab_progress', 0);
        $oldFlag = $s->flag_secret;
        $this->postJson('/lab-sessions/'.$s->id.'/reset', ['generation' => 1])->assertOk()->assertJsonPath('session.generation', 2);
        $this->assertNotSame($oldFlag, $s->fresh()->flag_secret);
        $this->assertDatabaseCount('lab_hint_usage', 3);
        $this->assertDatabaseCount('lab_attempts', 0);
    }

    public function test_reset_and_expiry_preserve_solve_history_and_reject_stale_flags(): void
    {
        $s = $this->start();
        $old = $this->flagData($s);
        $this->postJson('/lab-sessions/'.$s->id.'/flag', $old)->assertJsonPath('success', true);
        $this->postJson('/lab-sessions/'.$s->id.'/reset', ['generation' => 1])->assertOk();
        $this->postJson('/lab-sessions/'.$s->id.'/flag', $old)->assertConflict();
        $this->assertDatabaseCount('lab_progress', 1);
        $this->assertDatabaseCount('lab_attempts', 1);
        $this->assertDatabaseCount('xp_events', 1);
        $s = $s->fresh();
        $this->postJson('/lab-sessions/'.$s->id.'/flag', $this->flagData($s))->assertJsonPath('success', true);
        $this->assertDatabaseCount('xp_events', 1);
        $s->update(['expires_at' => now()->subMinute()]);
        $this->postJson('/lab-sessions/'.$s->id.'/request', $this->requestData($s))->assertGone();
        $this->postJson('/lab-sessions/'.$s->id.'/flag', $this->flagData($s))->assertGone();
        $this->postJson('/labs/order-idor/sessions')->assertOk()->assertJsonPath('session.generation', 3);
    }

    public function test_learning_dashboard_and_roadmap_display_verified_evidence_separately(): void
    {
        $user = User::factory()->create();
        app(RoadmapService::class)->create($user, '2026-10-24', 'Asia/Jakarta');
        $before = DB::table('roadmap_items')->get()->toJson();
        $s = $this->start($user);
        $this->postJson('/lab-sessions/'.$s->id.'/flag', $this->flagData($s))->assertJsonPath('success', true);
        $this->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('stats.labs_solved', 1)->where('stats.xp', 50)->where('stats.lessons_completed', 0));
        $this->get('/learning/idor')->assertInertia(fn (Assert $p) => $p->where('lesson.labs.0.solved', true));
        $data = app(RoadmapService::class)->overview($user);
        $tasks = $data['phases']->flatMap(fn ($p) => $p['weeks']->flatMap(fn ($w) => $w['tasks']));
        $this->assertTrue($tasks->contains(fn ($t) => ($t['lab']['slug'] ?? null) === 'order-idor' && $t['lab']['status'] === 'solved'));
        $this->assertSame($before, DB::table('roadmap_items')->get()->toJson());
    }

    public function test_disabled_runner_returns_useful_state_and_never_fakes_start(): void
    {
        config(['labs.enabled' => false]);
        $this->actingAs(User::factory()->create());
        $this->postJson('/labs/order-idor/sessions')->assertStatus(503);
        $this->assertDatabaseCount('lab_sessions', 0);
    }

    public function test_runner_failure_preserves_retryable_session_without_faking_progress(): void
    {
        $this->app->instance(LabRunnerAdapter::class, new LocalLabRunnerAdapter);
        config(['labs.runner_url' => 'http://127.0.0.1:8090']);
        Http::fake(['*' => Http::sequence()->push(['message' => 'offline'], 503)->push(['ready' => true], 200)]);
        $this->actingAs(User::factory()->create());
        $this->postJson('/labs/order-idor/sessions')->assertStatus(503);
        $this->assertDatabaseHas('lab_sessions', ['status' => 'error']);
        $this->assertDatabaseCount('lab_progress', 0);
        $this->postJson('/labs/order-idor/sessions')->assertOk()->assertJsonPath('session.status', 'running');
        $this->assertDatabaseCount('lab_sessions', 1);
    }

    public function test_runner_response_size_is_bounded_and_untrusted_markup_never_becomes_core_html(): void
    {
        $s = $this->start();
        config(['labs.runner_url' => 'http://127.0.0.1:8090']);
        Http::fake(['*' => Http::response(str_repeat('x', 50001), 200)]);
        try {
            (new LocalLabRunnerAdapter)->evidence($s);
            $this->fail('Oversize response must fail');
        } catch (HttpException $e) {
            $this->assertSame(502, $e->getStatusCode());
        }
        $markdown = app(SafeMarkdown::class)->render('<script>window.core=1</script>');
        $this->assertStringNotContainsString('<script>', $markdown);
    }

    public function test_flag_rate_limit_does_not_consume_reset_or_request_allowance(): void
    {
        $s = $this->start();
        for ($i = 0; $i < 30; $i++) {
            $this->postJson('/lab-sessions/'.$s->id.'/flag', [...$this->flagData($s), 'flag' => 'wrong'])->assertOk();
        }
        $this->postJson('/lab-sessions/'.$s->id.'/flag', $this->flagData($s))->assertStatus(429);
        $this->postJson('/lab-sessions/'.$s->id.'/request', $this->requestData($s))->assertOk();
        $this->postJson('/lab-sessions/'.$s->id.'/reset', ['generation' => 1])->assertOk();
        $this->assertDatabaseCount('lab_progress', 0);
    }

    public function test_runner_adapter_rejects_unconfigured_hosts_redirects_and_failures(): void
    {
        $s = $this->start();
        Http::fake(['*' => Http::response([], 302, ['Location' => 'http://db:3306'])]);
        config(['labs.runner_url' => 'http://evil.example']);
        try {
            (new LocalLabRunnerAdapter)->evidence($s);
            $this->fail('Expected forbidden runner configuration');
        } catch (HttpException $e) {
            $this->assertSame(503, $e->getStatusCode());
        }Http::assertNothingSent();
        config(['labs.runner_url' => 'http://127.0.0.1:8090']);
        try {
            (new LocalLabRunnerAdapter)->evidence($s);
            $this->fail('Expected redirect refusal');
        } catch (HttpException $e) {
            $this->assertSame(502, $e->getStatusCode());
        }
    }
}
