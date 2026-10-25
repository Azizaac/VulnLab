<?php

use App\Models\LabSession;
use App\Models\User;
use App\Services\LabResetService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Auth;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (PHP_SAPI !== 'cli' || ! app()->environment('testing') || config('database.default') !== 'sqlite'
    || realpath(config('database.connections.sqlite.database')) !== realpath(base_path('database/e2e.sqlite'))
    || ! in_array('--confirm', $argv, true)) {
    throw new RuntimeException('Cleanup requires --confirm and the dedicated E2E SQLite database.');
}
$count = 0;
foreach (LabSession::whereIn('status', ['running', 'solved'])->where('expires_at', '>', now())->get() as $session) {
    $user = User::findOrFail($session->user_id);
    if (! preg_match('/@example\.(com|test)$/', $user->email)) {
        throw new RuntimeException('Non-fixture account in browser test database; refusing cleanup.');
    }
    Auth::login($user);
    app(LabResetService::class)->stop($session, $session->generation);
    $count++;
}
echo "Stopped $count disposable browser lab sessions; persistent solves retained.\n";
