<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

// Ad-hoc read-only queries for the V9 audit. Usage: php v9-query.php <key>
$base = is_file(__DIR__.'/../vendor/autoload.php') ? __DIR__.'/..' : __DIR__;
require $base.'/vendor/autoload.php';
$app = require $base.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$key = $argv[1] ?? 'users';

$rows = match ($key) {
    'users' => DB::table('users')->get(['id', 'email', 'role', 'created_at'])->map(fn ($r) => (array) $r),
    'modules' => DB::table('modules as m')
        ->join('learning_paths as lp', 'lp.id', '=', 'm.learning_path_id')
        ->orderBy('m.id')
        ->get(['m.*', 'lp.slug as path_slug', 'lp.is_course', 'lp.catalog_visible as path_visible'])
        ->map(fn ($r) => (array) $r),
    'lessons' => DB::table('lessons')->orderBy('sort_order')->get(['id', 'source_id', 'slug', 'module_id', 'editorial_status', 'catalog_visible', 'difficulty'])->map(fn ($r) => (array) $r),
    'lesson_sources' => DB::table('lessons')->orderBy('id')->get(['id', 'source_id', 'slug', 'title', 'module_id'])->map(fn ($r) => (array) $r),
    default => throw new InvalidArgumentException("Unknown query key: $key"),
};

echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
