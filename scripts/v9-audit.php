<?php

// Read-only V9 repository/DB audit. Never writes learner data.
// Runs either from scripts/ on the host or from the app webroot in a one-off container.
$base = is_file(__DIR__.'/../vendor/autoload.php') ? __DIR__.'/..' : __DIR__;
require $base.'/vendor/autoload.php';

$app = require $base.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$out = [];
$tables = [
    'lessons', 'lesson_sources', 'modules', 'learning_paths', 'quiz_questions', 'quiz_choices',
    'labs', 'lab_hints', 'lab_specs', 'users', 'xp_transactions', 'lesson_progress', 'quiz_attempts',
    'lab_progress', 'lab_sessions', 'lab_requests', 'notes', 'vulnerability_reports',
    'content_entries', 'content_revisions', 'editorial_reviews', 'roadmap_plans',
];

foreach ($tables as $t) {
    $out['counts'][$t] = DB::table($t)->count();
}

$out['lessons_by_status'] = DB::table('lessons')->select('editorial_status', DB::raw('count(*) as c'))->groupBy('editorial_status')->pluck('c', 'editorial_status')->all();
$out['labs'] = DB::table('labs')->orderBy('code')->get(['code', 'slug', 'enabled', 'catalog_visible', 'difficulty', 'points'])->map(fn ($r) => (array) $r)->all();
$out['paths'] = DB::table('learning_paths')->orderBy('id')->get(['id', 'slug'])->map(fn ($r) => (array) $r)->all();
$ran = DB::table('migrations')->pluck('migration')->all();
$files = collect(glob($base.'/database/migrations/*.php'))
    ->map(fn ($p) => basename($p, '.php'))
    ->reject(fn ($name) => in_array($name, $ran, true))
    ->values()
    ->all();
$out['pending_migrations'] = $files;

// Preserve a checksum of learner-owned rows so before/after can be compared.
$learner = [];
foreach (['xp_transactions', 'lesson_progress', 'quiz_attempts', 'lab_progress', 'lab_sessions', 'notes', 'vulnerability_reports', 'users'] as $t) {
    $rows = DB::table($t)->orderBy('id')->get();
    $learner[$t] = ['rows' => $rows->count(), 'checksum' => hash('sha256', $rows->toJson())];
}
$out['learner_fingerprint'] = $learner;

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
