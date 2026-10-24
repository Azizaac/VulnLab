<?php

namespace Tests\Feature;

use App\Models\RoadmapDay;
use App\Models\RoadmapItem;
use App\Models\User;
use App\Services\RoadmapService;
use Database\Seeders\RoadmapSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class VisualFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_theme_is_validated_persisted_and_scoped_to_authenticated_user(): void
    {
        $this->patch('/settings/theme', ['theme' => 'dark'])->assertRedirect('/login');
        $owner = User::factory()->create();
        $other = User::factory()->create();
        foreach (['dark', 'light', 'system'] as $theme) {
            $this->actingAs($owner)->from('/dashboard')->patch('/settings/theme', ['theme' => $theme])->assertRedirect('/dashboard');
            $this->assertSame($theme, $owner->fresh()->theme);
            $this->assertSame('system', $other->fresh()->theme);
            $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('auth.user.theme', $theme));
        }
        $this->patch('/settings/theme', ['theme' => 'invalid'])->assertSessionHasErrors('theme');
        $this->patch('/settings/theme', ['theme' => 'dark', 'user_id' => $other->id])->assertSessionHasErrors('user_id');
        $this->assertSame('system', $owner->fresh()->theme);
    }

    public function test_v4_source_is_imported_exactly_and_reseed_preserves_personal_snapshot(): void
    {
        $this->seed(RoadmapSeeder::class);
        $source = json_decode(file_get_contents(database_path('data/roadmap-v4.json')), true, 512, JSON_THROW_ON_ERROR);
        foreach ($source as $entry) {
            $template = DB::table('roadmap_day_templates')->where('day_number', $entry['day'])->first();
            $this->assertSame($entry['title'], $template->title);
            $persisted = json_decode($template->source_actions, true);
            ksort($entry);
            ksort($persisted);
            $this->assertSame($entry, $persisted);
        }
        $user = User::factory()->create();
        app(RoadmapService::class)->create($user, '2026-10-23', 'Asia/Jakarta');
        $first = RoadmapDay::orderBy('day_number')->firstOrFail();
        $first->update(['title' => 'Existing personal content']);
        $item = $first->items()->firstOrFail();
        app(RoadmapService::class)->update($user, $item, 'completed');
        $before = RoadmapItem::orderBy('id')->get()->toArray();
        $this->seed(RoadmapSeeder::class);
        $this->assertSame($before, RoadmapItem::orderBy('id')->get()->toArray());
        $this->assertSame('Existing personal content', $first->fresh()->title);
        $snapshot = $first->fresh()->source_actions;
        $expected = $source[0];
        ksort($snapshot);
        ksort($expected);
        $this->assertSame($expected, $snapshot);
        app(RoadmapService::class)->reschedule($user, '2026-11-02', 'Asia/Jakarta');
        $this->assertSame($before[0]['description'], $item->fresh()->description);
        $this->assertSame($before[0]['completed_at'], $item->fresh()->toArray()['completed_at']);
        $practice = $first->items()->where('category', 'practice')->firstOrFail();
        $this->assertStringStartsWith($source[0]['practice_action'], $practice->description);
        $this->assertStringContainsString('Checklist tetap terpisah dari validasi lab.', $practice->description);
    }
}
