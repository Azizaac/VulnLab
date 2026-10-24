<?php

namespace Tests\Feature;

use App\Models\LabSpec;
use App\Models\Lesson;
use App\Models\Note;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function data(): array
    {
        return ['title' => 'HTTP notes', 'body_md' => '# Cookie\nCatatan pribadi', 'category' => 'Web', 'pinned' => true, 'tags' => ['http', 'cookie'], 'lesson_id' => Lesson::first()->id, 'lab_spec_id' => LabSpec::first()->id];
    }

    public function test_notes_require_authentication_and_support_crud_links_and_tags(): void
    {
        $this->get('/notes')->assertRedirect('/login');
        $this->postJson('/notes', $this->data())->assertUnauthorized();
        $this->actingAs(User::factory()->create());
        $id = $this->postJson('/notes', $this->data())->assertCreated()->assertJsonPath('revision', 1)->assertJsonPath('tags.0', 'http')->json('id');
        $this->patchJson('/notes/'.$id, [...$this->data(), 'title' => 'Updated', 'body_md' => '', 'tags' => ['new'], 'revision' => 1])->assertOk()->assertJsonPath('revision', 2)->assertJsonPath('body_md', '');
        $this->getJson('/notes/'.$id)->assertOk()->assertJsonPath('title', 'Updated')->assertJsonPath('tags.0', 'new');
        $this->assertDatabaseCount('note_tags', 1);
        $this->deleteJson('/notes/'.$id, ['revision' => 2])->assertNoContent();
        $this->assertDatabaseCount('notes', 0);
        $this->assertDatabaseCount('note_tags', 0);
    }

    public function test_owner_policy_protects_reads_updates_deletes_search_and_tags(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $this->actingAs($a);
        $id = $this->postJson('/notes', $this->data())->json('id');
        $this->actingAs($b);
        $this->getJson('/notes/'.$id)->assertForbidden();
        $this->patchJson('/notes/'.$id, [...$this->data(), 'revision' => 1])->assertForbidden();
        $this->deleteJson('/notes/'.$id, ['revision' => 1])->assertForbidden();
        $this->get('/notes?search=Cookie')->assertInertia(fn (Assert $p) => $p->has('notes.data', 0)->has('tags', 0));
        $this->postJson('/notes', [...$this->data(), 'user_id' => $a->id])->assertUnprocessable();
        $this->assertSame($a->id, Note::first()->user_id);
    }

    public function test_optimistic_autosave_conflicts_do_not_overwrite_or_delete_newer_version(): void
    {
        $this->actingAs(User::factory()->create());
        $id = $this->postJson('/notes', $this->data())->json('id');
        $this->patchJson('/notes/'.$id, [...$this->data(), 'title' => 'Newer', 'revision' => 1])->assertOk();
        $this->patchJson('/notes/'.$id, [...$this->data(), 'title' => 'Stale', 'revision' => 1])->assertConflict()->assertJsonPath('current.title', 'Newer')->assertJsonPath('current.revision', 2);
        $this->deleteJson('/notes/'.$id, ['revision' => 1])->assertConflict();
        $this->assertSame('Newer', Note::first()->title);
        $this->seed(DatabaseSeeder::class);
        $this->assertSame('Newer', Note::first()->title);
    }

    public function test_database_search_filters_and_validation(): void
    {
        $this->actingAs(User::factory()->create());
        $this->postJson('/notes', $this->data());
        $this->get('/notes?search=Cookie&tag=http&category=Web')->assertInertia(fn (Assert $p) => $p->has('notes.data', 1));
        $this->get('/notes?search=missing')->assertInertia(fn (Assert $p) => $p->has('notes.data', 0));
        foreach ([['title' => ''], ['body_md' => str_repeat('x', 60001)], ['tags' => array_fill(0, 11, 'x')], ['lesson_id' => 99999], ['lab_spec_id' => 99999]] as $invalid) {
            $this->postJson('/notes', [...$this->data(), ...$invalid])->assertUnprocessable();
        }
    }

    public function test_markdown_sanitizer_blocks_active_html_unsafe_urls_and_remote_images(): void
    {
        $this->actingAs(User::factory()->create());
        $response = $this->postJson('/notes/preview', ['body_md' => '# Aman'."\n\n".'<script>alert(1)</script><img src=x onerror=alert(1)><svg onload=alert(1)></svg>'."\n\n".'[bad](javascript:alert%281%29) ![track](https://example.org/pixel)'."\n\n```http\nGET /dummy HTTP/1.1\n```"])->assertOk();
        $html = $response->json('html');
        foreach (['<script', '<img', '<svg', 'javascript:', 'onerror=', 'onload='] as $bad) {
            $this->assertStringNotContainsString($bad, $html);
        }$this->assertStringContainsString('<h1>Aman</h1>', $html);
        $this->assertStringContainsString('language-http', $html);
        $this->postJson('/notes/preview', ['body_md' => ''])->assertOk()->assertJsonPath('html', '');
    }
}
