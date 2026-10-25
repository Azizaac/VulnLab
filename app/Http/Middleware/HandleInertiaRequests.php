<?php

namespace App\Http\Middleware;

use App\Services\StudioAccess;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => ['user' => fn () => $request->user() ? [...$request->user()->only('id', 'name', 'email', 'timezone', 'theme', 'role', 'density', 'reduced_motion'), 'permissions' => StudioAccess::permissions($request->user()), 'avatar_url' => $request->user()->avatar_path ? '/profile/avatar?v='.$request->user()->updated_at->timestamp : null] : null],
            'flash' => ['success' => fn () => $request->session()->get('success')],
        ];
    }
}
