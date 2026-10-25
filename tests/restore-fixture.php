<?php

use App\Http\Controllers\ReadinessController;
use App\Models\Note;
use App\Models\User;
use App\Services\LearningService;
use App\Services\RoadmapService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

// Piped into the isolated testing container by qa-restore.mjs. Nothing is
// persisted: even this disposable schema's sample workflow is rolled back.
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$database = config('database.connections.mysql.database');
if (PHP_SAPI !== 'cli' || ! app()->environment('testing') || config('database.default') !== 'mysql' || ! preg_match('/^vulnlab_qa_[a-f0-9]{16}_(current|pre_v5)$/', $database)) {
    throw new RuntimeException('Restore workflow requires a disposable QA schema.');
}
Artisan::call('migrate', ['--force' => true]);
if (app(ReadinessController::class)()->getStatusCode() !== 200) {
    exit(2);
}
DB::beginTransaction();
try {
    $password = 'disposable-restore-fixture-password';
    $user = User::create(['name' => 'Restore fixture', 'email' => 'restore-fixture@example.test', 'password' => $password, 'timezone' => 'Asia/Jakarta']);
    if (! Auth::attempt(['email' => $user->email, 'password' => $password])) {
        exit(3);
    }
    app(RoadmapService::class)->create($user, '2026-10-25', 'Asia/Jakarta');
    if (count(app(LearningService::class)->courses($user)) < 1) {
        exit(4);
    }
    $note = Note::forceCreate(['user_id' => $user->id, 'title' => 'Restore fixture', 'body_md' => 'Private fixture persisted', 'revision' => 1]);
    if ($note->fresh()->body_md !== 'Private fixture persisted') {
        exit(5);
    }
} finally {
    DB::rollBack();
}
echo 'migration, readiness, authentication, roadmap, catalog and note persistence passed';
