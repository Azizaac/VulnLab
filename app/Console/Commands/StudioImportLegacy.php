<?php

namespace App\Console\Commands;

use App\Services\ContentCatalog;
use Illuminate\Console\Command;

class StudioImportLegacy extends Command
{
    protected $signature = 'studio:import-legacy';

    protected $description = 'Snapshot existing source content without modifying learning records or claiming human review';

    public function handle(ContentCatalog $catalog): int
    {
        $this->info($catalog->importLegacy().' legacy entries imported. Existing learner tables unchanged.');

        return self::SUCCESS;
    }
}
