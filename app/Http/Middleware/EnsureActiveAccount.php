<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EnsureActiveAccount
{
    public function handle(Request $request, Closure $next)
    {
        if ($user = $request->user()) {
            if (Auth::viaRemember()) {
                $request->session()->put('auth_epoch', (int) $user->auth_epoch);
            }
            $epoch = $request->session()->get('auth_epoch', 0);
            if ($user->suspended_at || $epoch !== (int) $user->auth_epoch) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                Inertia::clearHistory();

                return $request->expectsJson() ? response()->json(['message' => 'Sesi berakhir. Silakan masuk kembali.'], 401) : redirect('/login');
            }
        }

        return $next($request);
    }
}
