<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoadmapSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoadmapSeeder::class);
    }

    public function test_guest_routes_and_protected_routes(): void
    {
        foreach (['/dashboard', '/roadmap', '/roadmap/1'] as $url) {
            $this->get($url)->assertRedirect('/login');
        }
        $this->patch('/tasks/1/progress', ['status' => 'done'])->assertRedirect('/login');
        $this->get('/login')->assertInertia(fn (Assert $page) => $page->component('Auth')->where('mode', 'login'));
        $this->get('/register')->assertOk();
    }

    public function test_registration_hashes_password_normalizes_email_and_logs_in(): void
    {
        $this->post('/register', $this->registration())->assertRedirect('/dashboard');
        $user = User::firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertTrue(Hash::check('secure-password-123', $user->password));
        $this->assertSame('learner', $user->role);
        $this->assertSame('learner@example.com', $user->email);
        $this->assertSame('Asia/Jakarta', $user->timezone);
    }

    public function test_registration_validation_prevents_privilege_escalation(): void
    {
        $this->post('/register', [...$this->registration(), 'role' => 'admin'])->assertSessionHasErrors('role');
        $this->post('/register', [...$this->registration(), 'password' => 'short', 'timezone' => 'invalid'])->assertSessionHasErrors(['password', 'timezone']);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_duplicate_email_is_rejected(): void
    {
        User::factory()->create(['email' => 'learner@example.com']);
        $this->post('/register', $this->registration())->assertSessionHasErrors('email');
    }

    public function test_registration_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/register', [])->assertSessionHasErrors();
        }
        $this->post('/register', [])->assertStatus(429);
    }

    public function test_login_logout_and_auth_redirects(): void
    {
        $user = User::factory()->create(['password' => 'secure-password-123']);
        $this->post('/login', ['email' => $user->email, 'password' => 'wrong'])->assertSessionHasErrors('email');
        $this->assertGuest();
        $this->post('/login', ['email' => $user->email, 'password' => 'secure-password-123'])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
        $this->get('/login')->assertRedirect('/dashboard');
        $this->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_login_blocks_after_five_failed_attempts_even_with_correct_password(): void
    {
        $user = User::factory()->create(['password' => 'secure-password-123']);
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', ['email' => $user->email, 'password' => 'wrong'])->assertSessionHasErrors('email');
        }
        $this->post('/login', ['email' => $user->email, 'password' => 'secure-password-123'])->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_login_throttle_does_not_consume_registration_allowance(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $this->post('/login', ['email' => 'missing@example.com', 'password' => 'wrong'])->assertSessionHasErrors('email');
        }
        $this->post('/register', $this->registration())->assertRedirect('/dashboard');
        $this->assertAuthenticated();
        $this->assertDatabaseCount('users', 1);
    }

    private function registration(): array
    {
        return ['name' => 'Learner', 'email' => 'LEARNER@example.com', 'password' => 'secure-password-123', 'password_confirmation' => 'secure-password-123', 'timezone' => 'Asia/Jakarta'];
    }
}
