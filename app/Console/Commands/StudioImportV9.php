<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\V9ContentImporter;
use Illuminate\Console\Command;
use RuntimeException;
use Throwable;

class StudioImportV9 extends Command
{
    protected $signature = 'studio:import-v9 {editor? : Existing editor user ID} {--system-console : Import in local console with an ephemeral editor guard without mutating users}';

    protected $description = 'Import V9 source-checked drafts and baseline addenda without publishing or modifying learner progress';

    public function handle(V9ContentImporter $importer): int
    {
        try {
            $editorId = $this->argument('editor');
            if ($editorId !== null) {
                $editor = User::findOrFail($editorId);
            } elseif ($this->option('system-console') && app()->runningInConsole() && app()->environment(['local', 'testing'])) {
                $editor = (new User)->forceFill(['role' => 'editor']);
            } else {
                throw new RuntimeException('Provide an existing editor user ID or pass --system-console in local console.');
            }
            $result = $importer->import($editor);
            foreach ($result as $kind => $counts) {
                $this->info("$kind: {$counts['created']} created; {$counts['unchanged']} unchanged.");
            }
            $this->warn('Draft only: AI source checks are not independent human review. Nothing was published.');

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error('V9 import stopped: '.$exception->getMessage());

            return self::FAILURE;
        }
    }
}
