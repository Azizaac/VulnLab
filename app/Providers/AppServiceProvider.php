<?php

namespace App\Providers;

use App\Contracts\LabRunnerAdapter;
use App\Services\LocalLabRunnerAdapter;
use App\Services\StudioAccess;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(LabRunnerAdapter::class, LocalLabRunnerAdapter::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        foreach (StudioAccess::PERMISSIONS as $permission) {
            Gate::define($permission, fn ($user) => in_array($permission, StudioAccess::permissions($user)));
        }
        Gate::after(function ($user, $ability, $result) {
            if ($result !== true && in_array($ability, StudioAccess::PERMISSIONS)) {
                StudioAccess::audit($user, 'authorization.denied', 'studio', null, ['permission' => $ability]);
                request()->attributes->set('studio_denial_logged', true);
            }
        });
        RateLimiter::for('sensitive-account', fn (Request $request) => Limit::perMinute(5)->by('sensitive|'.$request->user()->id));
        RateLimiter::for('auth-register', fn (Request $request) => Limit::perMinute(5)->by('register|'.$request->ip()));
        RateLimiter::for('auth-login', fn (Request $request) => Limit::perMinute(20)->by('login|'.$request->ip()));
        foreach (['lab-start' => 20, 'lab-hint' => 30, 'lab-solution' => 20, 'lab-request' => 60, 'lab-flag' => 30, 'lab-reset' => 10, 'lab-stop' => 20] as $name => $limit) {
            RateLimiter::for($name, fn (Request $request) => Limit::perMinute($limit)->by($name.'|'.$request->user()->id));
        }
    }
}
