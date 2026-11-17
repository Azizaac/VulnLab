<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\V9LabCatalog;
use Illuminate\Console\Command;
use RuntimeException;
use Throwable;

class LabsImportV9 extends Command
{
    protected $signature = 'labs:import-v9 {editor? : Existing editor ID} {--receipt= : Real local verification receipt; omit to import unavailable drafts only} {--system-console : Run in local console with an ephemeral editor guard without mutating users}';

    protected $description = 'Import local V9 lab metadata; activate only exact revisions with complete runtime and core verification receipts';

    public function handle(V9LabCatalog $catalog): int
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
            $created = $catalog->import($editor);
            $this->info("$created local lab metadata records created; unverified runtimes remain unavailable.");
            if ($path = $this->option('receipt')) {
                $receipt = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
                $verified = $catalog->register($editor, $receipt);
                $this->info("$verified exact runtime revisions registered for local use only.");
            }

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error('Local lab import stopped: '.$exception->getMessage());

            return self::FAILURE;
        }
    }
}
