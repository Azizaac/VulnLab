<?php

namespace Tests\Feature;

use App\Models\Lab;
use App\Models\LabProgress;
use App\Models\ReportEvidence;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        Storage::fake('local');
    }

    private function draft(array $overrides = []): array
    {
        return $this->postJson('/reports', ['title' => 'Latihan IDOR pada detail pesanan', 'lab_id' => Lab::where('slug', 'order-idor')->value('id'), 'cwe_id' => 'CWE-639', 'endpoint' => '/api/orders/101', 'severity' => 'medium', ...$overrides])->assertCreated()->json();
    }

    private function completeBody(): array
    {
        return [
            'summary' => 'Server sandbox menerima permintaan akun dummy B untuk pesanan akun A tanpa memeriksa kepemilikan. Bukti berikut hanya berasal dari sesi latihan lokal.',
            'prerequisites' => 'Dua akun dummy A dan B tersedia pada sesi sandbox lokal yang masih aktif.',
            'reproduction_md' => "1. Buka pesanan 102 dengan akun dummy B untuk mendapatkan respons baseline milik sendiri.\n2. Ganti objek menjadi pesanan 101 sambil mempertahankan akun dummy B. Bandingkan respons mode rentan dan mode aman.",
            'expected_md' => 'Server menolak akses akun B ke pesanan milik akun A dengan respons 403 atau 404.',
            'actual_md' => 'Mode rentan mengembalikan data pesanan milik akun A ke akun dummy B tanpa pemeriksaan pemilik.',
            'evidence_md' => 'Request GET /api/orders/101 dengan identitas dummy B menerima HTTP 200 dan owner customer_a. Mode aman menolak dengan HTTP 403; flag tidak dicantumkan.',
            'impact_md' => 'Dalam skenario dummy ini, akun B dapat membaca rincian pesanan milik akun A. Bukti hanya mendukung akses baca satu objek dan tidak membuktikan perubahan atau akses di luar sandbox.',
            'remediation_md' => 'Batasi query berdasarkan identitas pengguna yang terautentikasi dan jalankan authorization policy per objek. Tambahkan pengujian regresi untuk akun A, akun B, objek tidak ada, serta role yang memang diberi izin.',
            'references_md' => 'https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html',
        ];
    }

    public function test_auth_draft_fields_persistence_and_revision_conflicts(): void
    {
        $this->get('/reports')->assertRedirect('/login');
        $this->postJson('/reports', ['title' => 'unauthenticated'])->assertUnauthorized();
        $this->actingAs(User::factory()->create());
        $report = $this->draft($this->completeBody());
        $this->assertSame('draft', $report['status']);
        $this->assertSame(1, $report['version']);
        $this->getJson('/reports/'.$report['id'])->assertOk()->assertJsonPath('summary', $this->completeBody()['summary']);
        $this->patchJson('/reports/'.$report['id'], ['title' => 'Judul laporan direvisi', 'version' => 1])->assertOk()->assertJsonPath('version', 2);
        $this->patchJson('/reports/'.$report['id'], ['title' => 'Tulisan tab basi', 'version' => 1])->assertConflict()->assertJsonPath('current.title', 'Judul laporan direvisi');
        $this->assertDatabaseHas('vulnerability_reports', ['id' => $report['id'], 'version' => 2, 'title' => 'Judul laporan direvisi']);
        $this->get('/reports')->assertInertia(fn (Assert $page) => $page->component('Reports')->has('reports.data', 1));
        $this->get('/reports/'.$report['id'].'/edit')->assertInertia(fn (Assert $page) => $page->component('ReportEditor')->where('readOnly', false));
    }

    public function test_validation_prevents_owner_status_reward_score_and_remote_endpoint_tampering(): void
    {
        $this->actingAs(User::factory()->create());
        $this->postJson('/reports', ['title' => ''])->assertUnprocessable()->assertJsonValidationErrors('title');
        foreach (['user_id' => 999, 'status' => 'accepted_for_practice', 'score' => 24, 'scores' => ['technical_accuracy' => 4], 'xp' => 900, 'reviewed_at' => now()->toISOString(), 'body_json' => ['summary' => 'bypass']] as $field => $value) {
            $this->postJson('/reports', ['title' => 'Latihan valid', $field => $value])->assertUnprocessable();
        }
        $this->postJson('/reports', ['title' => 'Remote endpoint', 'endpoint' => 'http://169.254.169.254/latest/meta-data'])->assertUnprocessable();
        $report = $this->draft();
        $this->postJson('/reports/'.$report['id'].'/submit-for-review', ['version' => 1])->assertUnprocessable()->assertJsonValidationErrors(['summary', 'reproduction_md']);
        $this->postJson('/reports/'.$report['id'].'/evaluate', ['version' => 1, 'scores' => ['technical_accuracy' => 4]])->assertUnprocessable();
        $this->assertDatabaseCount('xp_transactions', 0);
    }

    public function test_private_report_actions_exports_and_signed_evidence_are_owner_scoped(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $this->actingAs($owner);
        $report = $this->draft();
        $uploaded = $this->postJson('/reports/'.$report['id'].'/evidence', ['version' => 1, 'file' => UploadedFile::fake()->createWithContent('proof.txt', 'Dummy HTTP response for local training only.')])->assertOk()->json();
        $evidence = $uploaded['evidence'][0];
        $this->assertArrayNotHasKey('path', $evidence);
        $this->assertArrayNotHasKey('disk', $evidence);
        $this->get($evidence['download_url'])->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->get(strtok($evidence['download_url'], '?'))->assertForbidden();
        $this->actingAs($other);
        foreach (['', '/edit', '/export?format=md', '/export?format=html'] as $suffix) {
            $this->get('/reports/'.$report['id'].$suffix)->assertForbidden();
        }
        $this->patchJson('/reports/'.$report['id'], ['version' => 2, 'title' => 'Other owner edit'])->assertForbidden();
        foreach (['submit-for-review', 'evaluate', 'archive', 'evidence'] as $action) {
            $this->postJson('/reports/'.$report['id'].'/'.$action, ['version' => 2])->assertForbidden();
        }
        $this->deleteJson('/reports/'.$report['id'], ['version' => 2])->assertForbidden();
        $this->deleteJson('/reports/'.$report['id'].'/evidence/'.$evidence['id'], ['version' => 2])->assertForbidden();
        $this->get($evidence['download_url'])->assertForbidden();
        $this->get('/reports')->assertInertia(fn (Assert $page) => $page->has('reports.data', 0));
        $this->assertDatabaseHas('vulnerability_reports', ['id' => $report['id'], 'user_id' => $owner->id]);
    }

    public function test_evidence_validates_content_limits_versions_and_private_storage(): void
    {
        $this->actingAs(User::factory()->create());
        $report = $this->draft();
        foreach (['proof.svg' => '<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'fake.png' => 'Not a PNG image', 'script.txt' => '<script>alert(1)</script>', 'payload.php' => '<?php echo 1;'] as $name => $content) {
            $this->postJson('/reports/'.$report['id'].'/evidence', ['version' => 1, 'file' => UploadedFile::fake()->createWithContent($name, $content)])->assertUnprocessable()->assertJsonValidationErrors('file');
        }
        $this->postJson('/reports/'.$report['id'].'/evidence', ['version' => 1, 'file' => UploadedFile::fake()->createWithContent('too-large.txt', str_repeat('x', 5 * 1024 * 1024 + 1))])->assertUnprocessable();
        $upload = $this->postJson('/reports/'.$report['id'].'/evidence', ['version' => 1, 'file' => UploadedFile::fake()->createWithContent('large-valid.txt', str_repeat('Dummy training text. ', 150000))])->assertOk()->assertJsonPath('version', 2)->json();
        $file = ReportEvidence::findOrFail($upload['evidence'][0]['id']);
        Storage::disk('local')->assertExists($file->path);
        $this->assertSame(storage_path('app/private'), config('filesystems.disks.local.root'));
        $this->assertStringNotContainsString('large-valid', $file->path);
        $this->postJson('/reports/'.$report['id'].'/evidence', ['version' => 1, 'file' => UploadedFile::fake()->createWithContent('stale.txt', 'Old browser version request.')])->assertConflict();
        $this->assertDatabaseCount('report_evidence', 1);
        $this->deleteJson('/reports/'.$report['id'].'/evidence/'.$file->id, ['version' => 2])->assertOk()->assertJsonPath('version', 3)->assertJsonCount(0, 'evidence');
        $this->assertDatabaseCount('report_evidence', 0);
    }

    public function test_internal_evaluation_is_disclosed_server_authoritative_and_rewards_once(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $report = $this->draft($this->completeBody());
        $this->postJson('/reports/'.$report['id'].'/submit-for-review', ['version' => 1])->assertOk()->assertJsonPath('status', 'ready_for_review')->assertJsonPath('xp_delta', 0);
        $this->assertDatabaseCount('xp_transactions', 0);
        $revision = $this->postJson('/reports/'.$report['id'].'/evaluate', ['version' => 2])->assertOk()->assertJsonPath('status', 'needs_revision')->assertJsonPath('xp_delta', 0)->json();
        $this->assertSame('automated_completeness', $revision['evaluations'][0]['evaluator_type']);
        LabProgress::create(['user_id' => $user->id, 'lab_id' => $report['lab_id'], 'solved_at' => now(), 'points_awarded' => 50]);
        $this->postJson('/reports/'.$report['id'].'/submit-for-review', ['version' => $revision['version']])->assertOk();
        $accepted = $this->postJson('/reports/'.$report['id'].'/evaluate', ['version' => $revision['version'] + 1])->assertOk()->assertJsonPath('status', 'accepted_for_practice')->assertJsonPath('xp_delta', 50)->json();
        $this->assertSame(24, $accepted['evaluations'][0]['total']);
        $this->postJson('/reports/'.$report['id'].'/evaluate', ['version' => $accepted['version']])->assertUnprocessable();
        $this->patchJson('/reports/'.$report['id'], ['title' => 'Locked report change', 'version' => $accepted['version']])->assertUnprocessable();
        $this->assertDatabaseCount('xp_transactions', 1);
        $this->assertDatabaseCount('learning_activity_events', 1);
        $this->assertDatabaseCount('user_achievements', 1);
        $this->assertSame(50, (int) DB::table('xp_transactions')->sum('amount'));
    }

    public function test_export_redacts_secrets_sanitizes_active_markdown_and_never_fetches_urls(): void
    {
        Http::preventStrayRequests();
        $this->actingAs(User::factory()->create());
        $report = $this->draft(['title' => 'Export latihan aman', ...$this->completeBody(), 'evidence_md' => "Authorization: Bearer private-example-value\nCookie: session=private-cookie\npassword=private-password\nVULNLAB{abcdef0123456789}\n<script>alert(1)</script>\n![remote](https://example.invalid/private.png)"]);
        $md = $this->get('/reports/'.$report['id'].'/export?format=md')->assertOk()->assertHeader('Cache-Control', 'no-store, private')->getContent();
        foreach (['private-example-value', 'private-cookie', 'private-password', 'VULNLAB{abcdef0123456789}'] as $secret) {
            $this->assertStringNotContainsString($secret, $md);
        }
        $html = $this->get('/reports/'.$report['id'].'/export?format=html')->assertOk()->assertHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")->getContent();
        $this->assertStringNotContainsString('<script>', $html);
        $this->assertStringNotContainsString('<img', $html);
        $this->assertStringContainsString('LATIHAN INTERNAL', $html);
        Http::assertNothingSent();
    }

    public function test_archive_filters_and_deletion_do_not_change_unrelated_reports(): void
    {
        $this->actingAs(User::factory()->create());
        $first = $this->draft();
        $second = $this->draft(['title' => 'Laporan lainnya']);
        $this->postJson('/reports/'.$first['id'].'/archive', ['version' => 1])->assertOk()->assertJsonPath('status', 'archived');
        $this->get('/reports')->assertInertia(fn (Assert $page) => $page->has('reports.data', 1)->where('reports.data.0.id', $second['id']));
        $this->get('/reports?status=archived')->assertInertia(fn (Assert $page) => $page->has('reports.data', 1)->where('reports.data.0.id', $first['id']));
        $this->deleteJson('/reports/'.$first['id'], ['version' => 1])->assertConflict();
        $this->deleteJson('/reports/'.$first['id'], ['version' => 2])->assertNoContent();
        $this->assertDatabaseHas('vulnerability_reports', ['id' => $second['id']]);
    }

    public function test_evidence_count_and_aggregate_limits_are_checked_under_the_report_lock(): void
    {
        $this->actingAs(User::factory()->create());
        $report = $this->draft();
        foreach (range(1, 5) as $version) {
            $this->postJson('/reports/'.$report['id'].'/evidence', ['version' => $version, 'file' => UploadedFile::fake()->createWithContent('proof-'.$version.'.txt', 'Small dummy evidence file.')])->assertOk();
        }
        $this->postJson('/reports/'.$report['id'].'/evidence', ['version' => 6, 'file' => UploadedFile::fake()->createWithContent('sixth.txt', 'Another dummy evidence file.')])->assertUnprocessable();
        $large = $this->draft(['title' => 'Aggregate evidence limit']);
        foreach (range(1, 4) as $version) {
            $this->postJson('/reports/'.$large['id'].'/evidence', ['version' => $version, 'file' => UploadedFile::fake()->createWithContent('large-'.$version.'.txt', str_repeat('Dummy training evidence. ', 180000))])->assertOk();
        }
        $this->postJson('/reports/'.$large['id'].'/evidence', ['version' => 5, 'file' => UploadedFile::fake()->createWithContent('over-total.txt', str_repeat('Dummy training evidence. ', 180000))])->assertUnprocessable();
        $this->assertSame(4, ReportEvidence::where('report_id', $large['id'])->count());
    }
}
