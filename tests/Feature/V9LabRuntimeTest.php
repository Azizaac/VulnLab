<?php

namespace Tests\Feature;

use App\Contracts\LabRunnerAdapter;
use App\Models\Lab;
use App\Models\LabSession;
use App\Models\User;
use App\Services\LabRuntimeRegistry;
use App\Services\V9LabCatalog;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class V9LabRuntimeTest extends TestCase
{
    use RefreshDatabase;

    private array $sessions = [];

    protected function setUp(): void
    {
        parent::setUp();
        if (getenv('V9_REAL_RUNNER') !== '1') {
            $this->markTestSkipped('Opt-in local real-runner acceptance; no mock substitute.');
        }
        $this->seed(DatabaseSeeder::class);
        config([
            'labs.enabled' => true,
            'labs.runner_url' => getenv('LAB_RUNNER_URL') ?: 'http://127.0.0.1:8090',
        ]);
        app(V9LabCatalog::class)->import(User::factory()->create(['role' => 'editor']));
    }

    protected function tearDown(): void
    {
        foreach ($this->sessions as $session) {
            try {
                app(LabRunnerAdapter::class)->stop($session->fresh());
            } catch (\Throwable) {
                // Expiry may already have disposed the temporary runner fixture.
            }
        }
        parent::tearDown();
    }

    public static function labs(): array
    {
        $rows = json_decode(file_get_contents(__DIR__.'/../../database/data/labs-v9.json'), true, 512, JSON_THROW_ON_ERROR);
        $requested = getenv('V9_RUNTIME_LABS') ? explode(',', getenv('V9_RUNTIME_LABS')) : array_column($rows, 'slug');
        $cases = [];
        foreach ($requested as $slug) {
            $cases[$slug] = [$slug];
        }

        return $cases;
    }

    #[DataProvider('labs')]
    public function test_real_runner_core_ownership_proof_reset_and_once_only_xp(string $slug): void
    {
        $learner = User::factory()->create();
        $this->actingAs($learner);
        $lab = Lab::where('slug', $slug)->firstOrFail();
        $this->postJson('/labs/'.$slug.'/sessions')->assertStatus(503);
        // Test-only prerequisite receipt. The real acceptance result is emitted by
        // the outer harness only after these assertions and runtime probes pass.
        DB::table('lab_runtime_verifications')->insert(['lab_id' => $lab->id, 'runtime_revision' => app(LabRuntimeRegistry::class)->revision(), 'checks_json' => json_encode([...array_fill_keys(LabRuntimeRegistry::CHECKS, true), 'test_fixture_only' => true]), 'verified_at' => now()]);
        $lab->update(['enabled' => true]);
        $started = $this->postJson('/labs/'.$slug.'/sessions')->assertOk()->assertJsonPath('session.status', 'running');
        $session = LabSession::findOrFail($started->json('session.id'));
        $this->sessions[] = $session;
        $this->assertStringNotContainsString($session->flag_secret, $started->getContent());
        $this->submit($session, 'VULNLAB{wrong}')->assertJsonPath('success', false)->assertJsonPath('xp_delta', 0);
        $this->submit($session, $session->flag_secret)->assertJsonPath('success', false);

        $this->actingAs(User::factory()->create());
        $this->postJson('/lab-sessions/'.$session->id.'/request', $this->requestData($session, array_key_first(json_decode(file_get_contents(database_path('data/lab-routes.json')), true)[$slug])))->assertForbidden();
        $this->submit($session, $session->flag_secret)->assertForbidden();
        foreach (['reset', 'stop'] as $action) {
            $this->postJson('/lab-sessions/'.$session->id.'/'.$action, ['generation' => $session->generation])->assertForbidden();
        }
        $this->actingAs($learner);
        foreach (['http://db:3306', 'http://169.254.169.254', 'http://127.0.0.1:8088'] as $target) {
            $this->postJson('/lab-sessions/'.$session->id.'/request', $this->requestData($session, $target))->assertUnprocessable();
        }
        $proof = $this->exploit($session);
        $this->assertSame($session->flag_secret, $proof);
        $this->submit($session, $proof)->assertOk()->assertJsonPath('success', true)->assertJsonPath('xp_delta', $lab->points);
        $this->submit($session, $proof)->assertOk()->assertJsonPath('success', true)->assertJsonPath('xp_delta', 0);
        $this->assertSame($lab->points, (int) DB::table('xp_transactions')->where('user_id', $learner->id)->sum('amount'));
        $oldFlag = $proof;
        $this->postJson('/lab-sessions/'.$session->id.'/reset', ['generation' => $session->generation])->assertOk();
        $session = $session->fresh();
        $this->submit($session, $oldFlag)->assertJsonPath('success', false);
        $newFlag = $this->exploit($session);
        $this->assertNotSame($oldFlag, $newFlag);
        $this->submit($session, $newFlag)->assertJsonPath('success', true)->assertJsonPath('xp_delta', 0);
        $this->assertSame($lab->points, (int) DB::table('xp_transactions')->where('user_id', $learner->id)->sum('amount'));
        $this->assertSame(1, DB::table('lab_progress')->where('user_id', $learner->id)->where('lab_id', $lab->id)->count());
        $session->update(['expires_at' => now()->subMinute()]);
        $this->submit($session, $newFlag)->assertGone();
    }

    private function exploit(LabSession $session): string
    {
        return match ($session->lab->slug) {
            'password-reset-token-lifecycle' => (function () use ($session) {
                $mailbox = $this->requestLab($session, 'mailbox');
                $token = collect($mailbox['tokens'])->firstWhere('fixture', 'valid')['token'];
                $body = ['token' => $token, 'password' => 'DummyChanged123!'];
                $this->requestLab($session, 'reset', 'POST', $body);

                return $this->requestLab($session, 'reset', 'POST', $body)['flag'];
            })(),
            'csrf-preferences' => $this->requestLab($session, 'preferences', 'POST', ['theme' => 'dark'], ['Origin' => 'http://attacker.lab.test'])['flag'],
            'path-traversal-receipts' => $this->requestLab($session, 'download', 'GET', ['file' => '../private/note.txt'])['flag'],
            'file-upload-validation' => $this->requestLab($session, 'uploads', 'POST', ['filename' => 'foto.png', 'content_type' => 'image/png', 'content_base64' => base64_encode('INI TEKS DUMMY')])['flag'],
            'graphql-object-access' => $this->requestLab($session, 'graphql', 'POST', ['operation' => 'workspaceOrder', 'variables' => ['orderId' => 201]])['flag'],
            'cors-credential-boundary' => $this->requestLab($session, 'account', 'GET', [], ['Origin' => 'http://attacker.lab.test'])['flag'],
            'webhook-ssrf-fixtures' => $this->requestLab($session, 'test', 'POST', ['target_url' => 'http://canary-internal.lab.test/admin-health'])['flag'],
            'oauth-callback-state' => (function () use ($session) {
                $init = $this->requestLab($session, 'start', 'POST');

                return $this->requestLab($session, 'callback', 'POST', ['code' => $init['fixture_codes']['foreign_code'], 'state' => 'forged-state', 'redirect_uri' => $init['registered_redirect_uri']])['flag'];
            })(),
            'coupon-race' => $this->requestLab($session, 'burst', 'POST', ['code' => 'ONCE50', 'parallel' => 2])['flag'],
            'api-property-auth' => $this->requestLab($session, 'member', 'PATCH', ['tier' => 'enterprise', 'credit_limit' => 5000000])['flag'],
            'api-data-minimization' => $this->requestLab($session, 'directory', 'GET', ['limit' => 6, 'view' => 'detail'])['flag'],
            'multi-tenant-workspace' => $this->requestLab($session, 'projects', 'GET', ['tenant_id' => 'org-beta', 'project_id' => 'proj-alpha-1'])['flag'],
            default => throw new \RuntimeException('Missing core acceptance exploit for '.$session->lab->slug),
        };
    }

    private function requestData(LabSession $s, string $endpoint, string $method = 'GET', array $body = [], array $headers = []): array
    {
        return ['generation' => $s->generation, 'endpoint' => $endpoint, 'method' => $method, 'body_json' => json_encode((object) $body), 'headers_json' => json_encode(['X-Dummy-User' => 'customer_b', ...$headers]), 'mode' => 'vulnerable'];
    }

    private function requestLab(LabSession $s, string $endpoint, string $method = 'GET', array $body = [], array $headers = []): array
    {
        $result = $this->postJson('/lab-sessions/'.$s->id.'/request', $this->requestData($s, $endpoint, $method, $body, $headers))->assertOk();
        $this->assertContains($result->json('status'), [200, 201]);

        return json_decode($result->json('body'), true, 512, JSON_THROW_ON_ERROR);
    }

    private function submit(LabSession $s, string $flag): TestResponse
    {
        return $this->postJson('/lab-sessions/'.$s->id.'/flag', ['generation' => $s->generation, 'submission_id' => (string) Str::uuid(), 'flag' => $flag]);
    }
}
