<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\ExpansionV71Importer;
use Illuminate\Console\Command;
use Throwable;

class StudioImportExpansionV71 extends Command
{
    protected $signature = 'studio:import-expansion-v71 {editor : Existing editor user ID} {mapping : Path to explicit module and question-source JSON mapping}';

    protected $description = 'Create unreviewed v7.1 content drafts using explicit curriculum and citation mappings';

    public function handle(ExpansionV71Importer $importer): int
    {
        try {
            $editor = User::findOrFail($this->argument('editor'));
            $path = $this->argument('mapping');
            if (! is_file($path) || ! is_readable($path)) {
                throw new \InvalidArgumentException('Mapping file is not readable.');
            }
            $mapping = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
            if (! is_array($mapping) || ! isset($mapping['modules'], $mapping['question_sources']) || ! is_array($mapping['modules']) || ! is_array($mapping['question_sources'])) {
                throw new \InvalidArgumentException('Mapping requires modules and question_sources objects.');
            }
            $result = $importer->import($editor, $mapping['modules'], $mapping['question_sources']);
            $this->info("Drafts created: {$result['created']}; unchanged: {$result['unchanged']}. No content was published.");

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Import stopped: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
