<?php

use App\Services\V9ContentImporter;
use Illuminate\Support\Facades\DB;

// Reuse the CLI-only, temp-database guard and disposable account setup.
require __DIR__.'/browser-fixture.php';

$user->forceFill(['role' => 'editor'])->save();
app(V9ContentImporter::class)->import($user);
$records = DB::table('content_import_records')
    ->whereIn('source_key', ['L001', 'N026', 'quiz-N033'])->get()->keyBy('source_key');
echo 'V9_CONTENT:'.json_encode([
    'baseline_entry' => $records['L001']->content_entry_id,
    'new_entry' => $records['N026']->content_entry_id,
    'quiz_revision' => $records['quiz-N033']->content_revision_id,
], JSON_THROW_ON_ERROR).PHP_EOL;
