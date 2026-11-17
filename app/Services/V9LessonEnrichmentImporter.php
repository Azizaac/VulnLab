<?php

namespace App\Services;

use App\Models\ContentEntry;
use App\Models\ContentRevision;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;
use RuntimeException;

class V9LessonEnrichmentImporter
{
    private const BUNDLE = 'v9-baseline-enrichment';

    public function __construct(private ContentCatalog $catalog, private ContentWorkflow $workflow) {}

    /** @return array{created: int, unchanged: int} */
    public function import(User $editor): array
    {
        Gate::forUser($editor)->authorize('content.edit');
        $rows = $this->source();

        return DB::transaction(function () use ($editor, $rows) {
            $lessons = Lesson::withoutGlobalScopes()->whereIn('source_id', array_column($rows, 'source_id'))->get()->keyBy('source_id');
            foreach ($rows as $row) {
                if (! isset($lessons[$row['source_id']]) || $lessons[$row['source_id']]->slug !== $row['slug']) {
                    throw new RuntimeException("Import conflict for {$row['source_id']}; baseline lesson ID or slug does not match");
                }
            }

            $subjectIds = $lessons->pluck('id')->all();
            if (ContentEntry::where('kind', 'lesson')->whereIn('subject_id', $subjectIds)->count() !== count($rows)) {
                $this->catalog->importLegacy();
            }
            $entries = ContentEntry::with('published')->where('kind', 'lesson')->whereIn('subject_id', $subjectIds)->orderBy('id')->lockForUpdate()->get()->keyBy('subject_id');
            // Match publication's entry-before-subject lock order, then recheck the actual baseline.
            $lessons = Lesson::withoutGlobalScopes()->whereIn('id', $subjectIds)->orderBy('id')->lockForUpdate()->get()->keyBy('source_id');
            $result = ['created' => 0, 'unchanged' => 0];

            // Workflow calls retain their per-entry locks, validation, save history, and audit events.
            foreach ($rows as $row) {
                $key = $row['source_id'];
                $lesson = $lessons->get($key);
                $entry = $lesson ? $entries->get($lesson->id) : null;
                $published = $entry?->published;
                if (! $lesson || $lesson->slug !== $row['slug'] || ! $entry || $entry->is_archived || $entry->slug !== $row['slug'] || ! $published || $published->status !== 'published' || $published->content_entry_id !== $entry->id || ($published->data_json['slug'] ?? null) !== $row['slug'] || ($published->data_json['body_md'] ?? null) !== $lesson->body_md) {
                    throw new RuntimeException("Import conflict for $key; published baseline does not match");
                }

                $data = $published->data_json;
                $data['body_md'] .= "\n\n".$row['body_md'];
                $data['objectives'] = array_values(array_unique([...$data['objectives'], ...$row['objectives']]));
                $sources = [];
                foreach ([...$data['sources'], ...$row['sources']] as $source) {
                    if (mb_strlen($source['license']) > 180) {
                        $source['license'] = mb_substr(explode(';', $source['license'], 2)[0], 0, 135).' (atribusi lengkap pada provenance impor)';
                    }
                    $sources[$source['url']] = $source;
                }
                $data['sources'] = array_values($sources);
                $sourceHash = $this->hash($row);
                $publishedHash = $this->hash($published->data_json);
                $record = DB::table('content_import_records')->where('bundle', self::BUNDLE)->where('source_key', $key)->lockForUpdate()->first();

                if ($record) {
                    $revision = ContentRevision::whereKey($record->content_revision_id)->lockForUpdate()->first();
                    $provenance = json_decode($record->provenance_json, true, 512, JSON_THROW_ON_ERROR);
                    if ((int) $record->content_entry_id !== $entry->id || ! $revision || $revision->content_entry_id !== $entry->id || $revision->status !== 'draft' || $revision->approved_by !== null || $revision->published_at !== null || $record->source_hash !== $sourceHash || $record->data_hash !== $this->hash($data) || $record->data_hash !== $this->hash($revision->data_json) || ($provenance['original_published_revision_id'] ?? null) !== $published->id || ($provenance['original_published_hash'] ?? null) !== $publishedHash || ($provenance['imported_lock_version'] ?? null) !== $revision->lock_version || ($provenance['author_id'] ?? null) !== (int) $revision->author_id) {
                        throw new RuntimeException("Import conflict for $key; source or existing draft was changed");
                    }
                    $result['unchanged']++;

                    continue;
                }

                if ($entry->revisions()->whereIn('status', ['draft', 'changes_requested', 'in_review', 'approved'])->exists()) {
                    throw new RuntimeException("Import conflict for $key; an active draft already exists");
                }
                $revision = $this->workflow->draft($editor, $entry);
                $revision = $this->workflow->save($editor, $revision, $data, $revision->lock_version);
                $provenance = [
                    'source_id' => $key,
                    'slug' => $row['slug'],
                    'authorship' => 'ai',
                    'editorial_status' => 'research_draft_unreviewed',
                    'review_status' => 'pending_human_review',
                    'author_id' => (int) $revision->author_id,
                    'imported_lock_version' => $revision->lock_version,
                    'original_published_revision_id' => $published->id,
                    'original_published_hash' => $publishedHash,
                    'sources' => $row['sources'],
                    'source_checks' => $row['source_checks'],
                ];
                DB::table('content_import_records')->insert([
                    'bundle' => self::BUNDLE,
                    'source_key' => $key,
                    'content_entry_id' => $entry->id,
                    'content_revision_id' => $revision->id,
                    'source_hash' => $sourceHash,
                    'data_hash' => $this->hash($revision->data_json),
                    'provenance_json' => json_encode($provenance, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $result['created']++;
            }

            return $result;
        });
    }

    private function source(): array
    {
        $path = database_path('data/v9-lesson-enrichment.json');
        $contents = file_get_contents($path);
        if ($contents === false) {
            throw new RuntimeException("Cannot read $path");
        }
        $rows = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
        if (! is_array($rows) || ! array_is_list($rows)) {
            throw new InvalidArgumentException('Invalid baseline enrichment source');
        }
        $keys = array_column($rows, 'source_id');
        sort($keys);
        $expected = array_map(fn ($number) => sprintf('L%03d', $number), range(1, 25));
        if (count($rows) !== count($expected) || $keys !== $expected) {
            throw new InvalidArgumentException('Unexpected, missing, or duplicate source_id values');
        }
        Validator::make($rows, [
            '*' => 'array:source_id,slug,body_md,objectives,sources,source_checks',
            '*.slug' => 'required|string',
            '*.body_md' => 'required|string',
            '*.objectives' => 'required|array',
            '*.objectives.*' => 'required|string',
            '*.sources' => 'required|array',
            '*.sources.*' => 'array:title,url,publisher,license',
            '*.sources.*.title' => 'required|string',
            '*.sources.*.url' => 'required|string',
            '*.sources.*.publisher' => 'required|string',
            '*.sources.*.license' => 'required|string',
            '*.source_checks' => 'required|array',
            '*.source_checks.*.url' => 'required|url:https',
            '*.source_checks.*.claim' => 'required|string',
            '*.source_checks.*.checked_at' => 'required|date_format:Y-m-d',
            '*.source_checks.*.status' => 'required|string',
        ])->validate();

        return collect($rows)->sortBy('source_id')->values()->all();
    }

    private function hash(mixed $value): string
    {
        return hash('sha256', json_encode($this->canonical($value), JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function canonical(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }
        if (! array_is_list($value)) {
            ksort($value);
        }

        return array_map(fn ($item) => $this->canonical($item), $value);
    }
}
