<?php

namespace App\Services;

use App\Models\ContentEntry;
use App\Models\ContentRevision;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;
use RuntimeException;

/** Imports only staff drafts; an operator must provide curriculum and citation choices. */
class ExpansionV71Importer
{
    private const BUNDLE = 'expansion-v7.1';

    public function __construct(private ContentWorkflow $workflow) {}

    /** @param array<string, int> $modules @param array<string, string> $questionSources */
    public function import(User $editor, array $modules, array $questionSources): array
    {
        Gate::forUser($editor)->authorize('content.edit');
        $root = base_path('docs/expansion-v7.1');
        $lessons = $this->json($root.'/content/LESSON_MANIFEST.json');
        $questions = $this->json($root.'/content/quizzes/NEW_QUESTION_BANK.json');
        $lessonKeys = array_map(fn ($n) => sprintf('N%03d', $n), range(26, 35));
        $questionKeys = array_map(fn ($n) => sprintf('Q%03d', $n), range(51, 80));
        $this->keys($lessons, 'id', $lessonKeys);
        $this->keys($questions, 'id', $questionKeys);
        $this->mapKeys($modules, $lessonKeys, 'module');
        $this->mapKeys($questionSources, $questionKeys, 'question source');
        $grouped = collect($questions)->groupBy('lesson_id');

        return DB::transaction(function () use ($editor, $root, $lessons, $grouped, $modules, $questionSources) {
            $result = ['created' => 0, 'unchanged' => 0];
            foreach ($lessons as $lesson) {
                $id = $lesson['id'];
                if (DB::table('lessons')->where('source_id', $id)->exists()) {
                    throw new RuntimeException("Lesson source ID already exists: $id");
                }
                $moduleId = $modules[$id];
                if (! is_int($moduleId) || ! DB::table('modules')->join('learning_paths', 'learning_paths.id', '=', 'modules.learning_path_id')->where('modules.id', $moduleId)->where('modules.catalog_visible', true)->where('learning_paths.catalog_visible', true)->where('learning_paths.is_course', true)->exists()) {
                    throw new InvalidArgumentException("Invalid published course module for $id");
                }
                if (($lesson['published'] ?? null) !== false || ($lesson['editorial_status'] ?? null) !== 'research_draft_unreviewed') {
                    throw new InvalidArgumentException("Unexpected editorial status for $id");
                }
                $path = $root.'/'.$lesson['path'];
                $realRoot = realpath($root.'/content/lessons');
                $realPath = realpath($path);
                if (! $realPath || ! $realRoot || ! str_starts_with($realPath, $realRoot.DIRECTORY_SEPARATOR) || ! is_file($realPath)) {
                    throw new InvalidArgumentException("Invalid lesson file for $id");
                }
                $body = file_get_contents($realPath);
                if ($body === false || trim($body) === '') {
                    throw new InvalidArgumentException("Empty lesson for $id");
                }
                $prerequisites = [];
                foreach ($lesson['prereqs'] as $prerequisite) {
                    $subject = DB::table('lessons')->where('source_id', $prerequisite)->where('catalog_visible', true)->value('id');
                    if (! $subject) {
                        throw new InvalidArgumentException("Missing prerequisite $prerequisite for $id");
                    }
                    $prerequisites[] = (int) $subject;
                }
                $sources = array_map(fn ($s) => ['title' => $s['title'], 'url' => $s['url'], 'publisher' => 'Belum diperiksa', 'license' => 'Belum diperiksa'], $lesson['sources']);
                $data = ['title' => $lesson['title'], 'slug' => $lesson['slug'], 'module_id' => $moduleId, 'summary' => null, 'audience' => null, 'difficulty' => $lesson['level'], 'minutes' => $lesson['minutes'], 'objectives' => [], 'tags' => [], 'prerequisite_ids' => $prerequisites, 'body_md' => $body, 'example_md' => null, 'sources' => $sources];
                $provenance = ['editorial_status' => $lesson['editorial_status'], 'source_id' => $id, 'source_revision' => $lesson['revision'], 'path' => $lesson['path'], 'references' => $lesson['sources']];
                [$revision, $created] = $this->upsert($editor, 'lesson', $id, $data, $this->hash([$lesson, $body, $moduleId]), $provenance);
                $result[$created ? 'created' : 'unchanged']++;

                $items = $grouped->get($id, collect())->all();
                if (count($items) !== 3) {
                    throw new InvalidArgumentException("Expected three questions for $id");
                }
                $mapped = [];
                foreach ($items as $question) {
                    $qid = $question['id'];
                    $url = $questionSources[$qid];
                    if (! in_array($url, array_column($lesson['sources'], 'url'), true)) {
                        throw new InvalidArgumentException("Question source for $qid must be a supplied lesson reference");
                    }
                    if (($question['published'] ?? null) !== false || ($question['editorial_status'] ?? null) !== 'research_draft_unreviewed' || ! is_int($question['correct_index']) || ! array_key_exists($question['correct_index'], $question['options'])) {
                        throw new InvalidArgumentException("Invalid question $qid");
                    }
                    $otherSource = DB::table('quiz_questions')->where('editorial_source_key', $qid);
                    $lessonSubject = $revision->entry->subject_id;
                    if ($lessonSubject) {
                        $otherSource->where('lesson_id', '!=', $lessonSubject);
                    }
                    if (DB::table('quiz_questions')->where('source_id', $qid)->exists() || $otherSource->exists()) {
                        throw new RuntimeException("Question source ID already exists: $qid");
                    }
                    $mapped[] = ['source_key' => $qid, 'question' => $question['question'], 'explanation' => $question['explanation'], 'difficulty' => $lesson['level'], 'source_url' => $url, 'choices' => array_map(fn ($text, $index) => ['text' => $text, 'is_correct' => $index === $question['correct_index']], $question['options'], array_keys($question['options']))];
                }
                $quizData = ['title' => 'Kuis: '.$lesson['title'], 'slug' => 'quiz-'.$lesson['slug'], 'lesson_entry_id' => $revision->content_entry_id, 'passing_score' => 70, 'randomize' => true, 'sources' => $sources, 'questions' => $mapped];
                $quizProvenance = ['editorial_status' => 'research_draft_unreviewed', 'lesson_source_id' => $id, 'question_ids' => array_column($items, 'id'), 'question_revisions' => array_column($items, 'revision', 'id'), 'question_sources' => array_intersect_key($questionSources, array_flip(array_column($items, 'id')))];
                [, $created] = $this->upsert($editor, 'quiz', 'quiz-'.$id, $quizData, $this->hash([$items, $quizProvenance, $lesson['sources']]), $quizProvenance);
                $result[$created ? 'created' : 'unchanged']++;
            }

            return $result;
        });
    }

    private function upsert(User $editor, string $kind, string $key, array $data, string $sourceHash, array $provenance): array
    {
        $record = DB::table('content_import_records')->where('bundle', self::BUNDLE)->where('source_key', $key)->lockForUpdate()->first();
        if ($record) {
            $revision = ContentRevision::findOrFail($record->content_revision_id);
            $entry = ContentEntry::findOrFail($record->content_entry_id);
            if ($record->source_hash !== $sourceHash || $record->data_hash !== $this->hash($data) || $record->data_hash !== $this->hash($revision->data_json) || $revision->content_entry_id !== $entry->id || $entry->kind !== $kind || $entry->is_archived) {
                throw new RuntimeException("Import conflict for $key; existing content was changed");
            }

            return [$revision, false];
        }
        $revision = $this->workflow->create($editor, $kind, $data);
        DB::table('content_import_records')->insert(['bundle' => self::BUNDLE, 'source_key' => $key, 'content_entry_id' => $revision->content_entry_id, 'content_revision_id' => $revision->id, 'source_hash' => $sourceHash, 'data_hash' => $this->hash($revision->data_json), 'provenance_json' => json_encode($provenance, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), 'created_at' => now(), 'updated_at' => now()]);

        return [$revision, true];
    }

    private function json(string $path): array
    {
        $contents = file_get_contents($path);
        if ($contents === false) {
            throw new RuntimeException("Cannot read $path");
        }
        $data = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
        if (! is_array($data) || ! array_is_list($data)) {
            throw new InvalidArgumentException("Invalid kit file $path");
        }

        return $data;
    }

    private function keys(array $rows, string $field, array $expected): void
    {
        $keys = array_column($rows, $field);
        sort($keys);
        if ($keys !== $expected) {
            throw new InvalidArgumentException("Unexpected or duplicate $field values");
        }
    }

    private function mapKeys(array $map, array $expected, string $name): void
    {
        $keys = array_keys($map);
        sort($keys);
        if ($keys !== $expected) {
            throw new InvalidArgumentException("Explicit $name mapping required for every source ID");
        }
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
