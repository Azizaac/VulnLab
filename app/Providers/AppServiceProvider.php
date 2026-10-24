<?php

namespace App\Providers;

use App\Contracts\LabRunnerAdapter;
use App\Services\LocalLabRunnerAdapter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
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
        RateLimiter::for('auth-register', fn (Request $request) => Limit::perMinute(5)->by('register|'.$request->ip()));
        RateLimiter::for('auth-login', fn (Request $request) => Limit::perMinute(20)->by('login|'.$request->ip()));
        foreach (['lab-start' => 20, 'lab-hint' => 30, 'lab-solution' => 20, 'lab-request' => 60, 'lab-flag' => 30, 'lab-reset' => 10, 'lab-stop' => 20] as $name => $limit) {
            RateLimiter::for($name, fn (Request $request) => Limit::perMinute($limit)->by($name.'|'.$request->user()->id));
        }
    }
}
