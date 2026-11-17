<?php

namespace Tests\Feature;

use App\Models\Lab;
use App\Models\User;
use App\Services\LabRuntimeRegistry;
use App\Services\LabService;
use App\Services\V9LabCatalog;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class V9LabRegistryTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_metadata_never_enables_unverified_or_stale_runtimes(): void
    {
        $this->seed(DatabaseSeeder::class);
        config(['labs.enabled' => true]);
        $editor = User::factory()->create(['role' => 'editor']);
        $catalog = app(V9LabCatalog::class);
        $this->assertGreaterThan(0, $catalog->import($editor));
        $this->assertSame(0, $catalog->import($editor));
        $lab = Lab::where('slug', 'csrf-preferences')->firstOrFail();
        $lab->update(['enabled' => true]);
        $learner = User::factory()->create();
        $this->assertFalse(app(LabService::class)->catalog($learner)->firstWhere('id', $lab->id)['available']);
        $this->actingAs($learner)->postJson('/labs/'.$lab->slug.'/sessions')->assertStatus(503);
        DB::table('lab_runtime_verifications')->insert(['lab_id' => $lab->id, 'runtime_revision' => str_repeat('0', 64), 'checks_json' => json_encode(array_fill_keys(LabRuntimeRegistry::CHECKS, true)), 'verified_at' => now()]);
        $this->assertFalse(app(LabService::class)->catalog($learner)->firstWhere('id', $lab->id)['available']);
        DB::table('lab_runtime_verifications')->insert(['lab_id' => $lab->id, 'runtime_revision' => app(LabRuntimeRegistry::class)->revision(), 'checks_json' => json_encode(['baseline' => true]), 'verified_at' => now()]);
        $this->assertFalse(app(LabService::class)->catalog($learner)->firstWhere('id', $lab->id)['available']);
        DB::table('lab_runtime_verifications')->where('lab_id', $lab->id)->where('runtime_revision', app(LabRuntimeRegistry::class)->revision())->update(['checks_json' => json_encode(array_fill_keys(LabRuntimeRegistry::CHECKS, true))]);
        $this->assertTrue(app(LabService::class)->catalog($learner)->firstWhere('id', $lab->id)['available']);
        $registry = app(LabRuntimeRegistry::class);
        $this->assertFalse($registry->matches($lab, str_repeat('0', 64)));
        $this->assertFalse($registry->matches($lab, null));
        $this->assertTrue($registry->matches($lab, $registry->revision()));
    }

    public function test_incomplete_receipt_cannot_activate_a_lab(): void
    {
        $this->seed(DatabaseSeeder::class);
        $editor = User::factory()->create(['role' => 'editor']);
        $catalog = app(V9LabCatalog::class);
        $catalog->import($editor);
        try {
            $catalog->register($editor, ['status' => 'PASS', 'checked_at' => now()->subSecond()->toIso8601String(), 'runtime_revision' => app(LabRuntimeRegistry::class)->revision(), 'labs' => ['csrf-preferences' => ['baseline' => true]]]);
            $this->fail('An incomplete receipt must be rejected');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('Missing verification', $exception->getMessage());
        }
        $this->assertDatabaseCount('lab_runtime_verifications', 0);
        $this->assertFalse(Lab::where('slug', 'csrf-preferences')->firstOrFail()->enabled);
    }
}
