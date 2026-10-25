<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Services\RoadmapService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, RoadmapService $roadmap): RedirectResponse
    {
        $user = DB::transaction(function () use ($request, $roadmap) {
            $user = User::create($request->safe()->only(['name', 'email', 'password', 'timezone']));
            $roadmap->create($user, $request->validated('starts_on') ?? now($user->timezone)->toDateString(), $user->timezone);

            return $user;
        });
        Auth::login($user);
        $request->session()->regenerate();
        $request->session()->put('auth_epoch', (int) $user->auth_epoch);
        Inertia::clearHistory();

        return redirect()->route('dashboard');
    }

    public function login(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();
        $request->session()->put('auth_epoch', (int) $request->user()->auth_epoch);
        Inertia::clearHistory();

        return redirect()->intended(route('dashboard'));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        Inertia::clearHistory();

        return redirect()->route('login');
    }
}
