<?php

namespace App\Services;

use App\Models\ContentEntry;
use App\Models\ContentRevision;
use App\Models\Lab;
use App\Models\Lesson;
use Illuminate\Support\Facades\DB;

class ContentCatalog
{
    public function importLegacy(): int
    {
        return DB::transaction(function () {
            $count = 0;
            foreach (['lesson' => 'lessons', 'lab' => 'labs', 'path' => 'learning_paths', 'module' => 'modules'] as $kind => $table) {
                foreach (DB::table($table)->get() as $row) {
                    $count += $this->legacy($kind, $row->id, $row->slug ?? 'module-'.$row->id, $this->snapshot($kind, $row->id));
                    if ($kind === 'lesson' && DB::table('quiz_questions')->where('lesson_id', $row->id)->exists()) {
                        $count += $this->legacy('quiz', $row->id, 'quiz-'.$row->slug, $this->snapshot('quiz', $row->id));
                    }
                }
            }
            $count += $this->legacy('roadmap', 1, 'roadmap-90-hari', $this->roadmap());

            return $count;
        });
    }

    private function legacy(string $kind, int $id, string $slug, array $data): int
    {
        $entry = ContentEntry::firstOrCreate(['kind' => $kind, 'subject_id' => $id], ['slug' => $slug]);
        if (! $entry->wasRecentlyCreated) {
            return 0;
        }
        $revision = $entry->revisions()->create(['number' => 1, 'status' => 'published', 'data_json' => $data, 'published_at' => now()]);
        $entry->update(['published_revision_id' => $revision->id]);

        return 1;
    }

    private function sources($sources): array
    {
        return collect($sources)->map(fn ($s) => ['title' => $s['title'] ?? 'Referensi', 'url' => $s['url'], 'publisher' => parse_url($s['url'], PHP_URL_HOST) ?: 'Perlu diperiksa', 'license' => 'Perlu diperiksa reviewer'])->all();
    }

    public function snapshot(string $kind, int $id): array
    {
        if ($kind === 'lesson') {
            $l = Lesson::withoutGlobalScopes()->with('sources', 'prerequisites')->findOrFail($id);

            return ['title' => $l->title, 'slug' => $l->slug, 'module_id' => $l->module_id, 'summary' => $l->enrichment['technical'] ?? '', 'audience' => 'Pelajar Web & API Security', 'difficulty' => $l->difficulty, 'minutes' => $l->estimated_minutes, 'objectives' => $l->enrichment['objectives'] ?? [], 'tags' => [], 'prerequisite_ids' => $l->prerequisites->pluck('id')->all(), 'body_md' => $l->body_md, 'example_md' => $l->enrichment['example_md'] ?? '', 'sources' => $this->sources($l->sources->toArray())];
        }
        if ($kind === 'quiz') {
            $l = Lesson::withoutGlobalScopes()->with('questions.choices', 'sources')->findOrFail($id);
            $sources = $this->sources($l->sources->toArray());

            return ['title' => 'Kuis: '.$l->title, 'slug' => 'quiz-'.$l->slug, 'lesson_id' => $l->id, 'passing_score' => 70, 'randomize' => true, 'sources' => $sources, 'questions' => $l->questions->map(fn ($q) => [...($q->editorial_source_key !== null && $q->editorial_source_key !== '' ? ['source_key' => $q->editorial_source_key] : []), 'question' => $q->question, 'explanation' => $q->explanation, 'difficulty' => $l->difficulty, 'source_url' => $sources[0]['url'] ?? 'https://owasp.org/', 'choices' => $q->choices->map(fn ($c) => ['text' => $c->text, 'is_correct' => (bool) $c->is_correct])->all()])->all()];
        }
        if ($kind === 'lab') {
            $l = Lab::withoutGlobalScopes()->with('instructions', 'hints')->findOrFail($id);

            return ['title' => $l->title, 'slug' => $l->slug, 'lesson_id' => $l->lesson_id, 'category_id' => $l->lab_category_id, 'difficulty' => $l->difficulty, 'minutes' => $l->minutes, 'scenario_md' => $l->scenario_md, 'objectives' => $l->objectives, 'instructions' => $l->instructions->pluck('body')->all(), 'hints' => $l->hints->pluck('body')->all(), 'sources' => $this->sources($l->sources), 'visibility' => (bool) $l->catalog_visible];
        }
        if ($kind === 'path') {
            $p = DB::table('learning_paths')->find($id);

            return ['title' => $p->title, 'slug' => $p->slug, 'description' => $p->description, 'difficulty' => $p->difficulty, 'objectives' => json_decode($p->outcomes ?? '[]', true) ?? [], 'sources' => []];
        }
        $m = DB::table('modules')->find($id);

        return ['title' => $m->title, 'slug' => 'module-'.$id, 'path_id' => $m->learning_path_id, 'sources' => []];
    }

    public function roadmap(): array
    {
        $phases = DB::table('phases')->orderBy('sort_order')->get();
        $weeks = DB::table('weeks')->get()->keyBy('id');

        return ['title' => 'Roadmap 90 Hari', 'slug' => 'roadmap-90-hari', 'sources' => [['title' => 'OWASP Web Security Testing Guide', 'url' => 'https://owasp.org/www-project-web-security-testing-guide/', 'publisher' => 'OWASP', 'license' => 'Perlu diperiksa reviewer']], 'stages' => $phases->map(fn ($p) => ['key' => 'stage_'.$p->id, 'title' => $p->title, 'milestone' => $p->milestone, 'category' => $p->category])->all(), 'days' => DB::table('roadmap_day_templates')->orderBy('day_number')->get()->map(function ($day) use ($weeks) {
            $actions = json_decode($day->source_actions ?? '{}', true);
            $tasks = [];
            foreach (['theory' => ['theory_action', 20], 'practice' => ['practice_action', 70], 'reflection' => ['reflection_action', 30]] as $kind => [$source, $minutes]) {
                $key = 'day_'.$day->day_number.'_'.$kind;
                $tasks[] = ['key' => $key, 'kind' => $kind, 'title' => ucfirst($kind).': '.$day->title, 'description' => $actions[$source] ?? $day->objective, 'minutes' => $minutes, 'subject_id' => null, 'prerequisite_key' => $kind === 'theory' ? ($day->day_number > 1 ? 'day_'.($day->day_number - 1).'_reflection' : null) : 'day_'.$day->day_number.'_'.($kind === 'practice' ? 'theory' : 'practice')];
            }

            return ['day_number' => $day->day_number, 'stage_key' => 'stage_'.$weeks[$day->week_id]->phase_id, 'title' => $day->title, 'objective' => $day->objective, 'tasks' => $tasks];
        })->all()];
    }

    public function project(ContentEntry $entry, ContentRevision $revision): void
    {
        $d = $revision->data_json;
        $id = $entry->subject_id;
        if ($entry->kind === 'lesson') {
            $l = $id ? Lesson::withoutGlobalScopes()->findOrFail($id) : new Lesson(['source_id' => 'studio-'.$entry->id, 'slug' => $entry->slug, 'source_snapshot' => [], 'sort_order' => (Lesson::withoutGlobalScopes()->max('sort_order') ?? 0) + 1, 'authored_at' => today()]);
            $l->fill(['module_id' => $d['module_id'], 'title' => $d['title'], 'difficulty' => $d['difficulty'], 'estimated_minutes' => $d['minutes'], 'body_md' => $d['body_md'], 'enrichment' => ['mistakes' => [], 'classification' => 'Materi original / sumber diperiksa reviewer', ...($l->enrichment ?? []), 'updated_at' => today()->toDateString(), 'technical' => $d['summary'], 'objectives' => $d['objectives'], 'example_md' => $d['example_md'] ?? '', 'audience' => $d['audience'], 'tags' => $d['tags']], 'editorial_status' => 'reviewed_published', 'reviewed_at' => today(), 'catalog_visible' => true])->save();
            $entry->subject_id = $l->id;
            $l->prerequisites()->sync($d['prerequisite_ids']);
            DB::table('lesson_sources')->where('lesson_id', $l->id)->update(['catalog_active' => false]);
            foreach ($d['sources'] as $s) {
                DB::table('lesson_sources')->insert(['lesson_id' => $l->id, 'title' => $s['title'], 'url' => $s['url'], 'catalog_active' => true, 'revision_id' => $revision->id]);
            }
        } elseif ($entry->kind === 'quiz') {
            $lessonId = $entry->parent_lesson_entry_id
                ? ContentEntry::whereKey($entry->parent_lesson_entry_id)->value('subject_id')
                : $d['lesson_id'];
            $entry->subject_id = $lessonId;
            DB::table('quiz_questions')->where('lesson_id', $lessonId)->update(['catalog_active' => false]);
            foreach ($d['questions'] as $i => $q) {
                $questionId = DB::table('quiz_questions')->insertGetId(['lesson_id' => $lessonId, 'source_id' => 'revision-'.$revision->id.'-'.$i, 'editorial_source_key' => $q['source_key'] ?? null, 'question' => $q['question'], 'explanation' => $q['explanation'], 'points' => 10, 'catalog_active' => true]);
                foreach ($q['choices'] as $j => $c) {
                    DB::table('quiz_choices')->insert(['quiz_question_id' => $questionId, 'source_key' => (string) $j, 'text' => $c['text'], 'is_correct' => $c['is_correct']]);
                }
            }
        } elseif ($entry->kind === 'lab') {
            $l = $id ? Lab::withoutGlobalScopes()->findOrFail($id) : new Lab(['code' => 'CMS-'.$entry->id, 'slug' => $entry->slug, 'points' => 0, 'enabled' => false, 'solution_md' => '', 'secure_code' => '', 'default_body' => [], 'default_headers' => [], 'classification' => 'Metadata — runtime belum diverifikasi', 'authored_at' => today()]);
            if (! $id) {
                $l->lab_spec_id = DB::table('lab_specs')->insertGetId(['slug' => $entry->slug, 'title' => $d['title'], 'lesson_id' => $d['lesson_id'], 'difficulty' => $d['difficulty'], 'goal' => $d['scenario_md']]);
            }
            $l->fill(['title' => $d['title'], 'lesson_id' => $d['lesson_id'], 'lab_category_id' => $d['category_id'], 'difficulty' => $d['difficulty'], 'minutes' => $d['minutes'], 'scenario_md' => $d['scenario_md'], 'objectives' => $d['objectives'], 'sources' => $d['sources'], 'reviewed_at' => today(), 'catalog_visible' => $d['visibility']])->save();
            $entry->subject_id = $l->id;
            foreach (['lab_instructions' => ['position', $d['instructions']], 'lab_hints' => ['level', $d['hints']]] as $table => [$key, $rows]) {
                foreach ($rows as $i => $body) {
                    DB::table($table)->updateOrInsert(['lab_id' => $l->id, $key => $i + 1], ['body' => $body]);
                }
                // Preserve hint IDs referenced by historical usage; blank extras are never exposed.
                DB::table($table)->where('lab_id', $l->id)->where($key, '>', count($rows))->update(['body' => 'Petunjuk ini telah diarsipkan.']);
            }
        } elseif ($entry->kind === 'path') {
            $values = ['title' => $d['title'], 'description' => $d['description'], 'difficulty' => $d['difficulty'], 'outcomes' => json_encode($d['objectives']), 'catalog_visible' => true, 'updated_at' => now()];
            if ($id) {
                DB::table('learning_paths')->where('id', $id)->update($values);
            } else {
                $entry->subject_id = DB::table('learning_paths')->insertGetId([...$values, 'slug' => $entry->slug, 'is_course' => true, 'sort_order' => (DB::table('learning_paths')->max('sort_order') ?? 0) + 1, 'created_at' => now()]);
            }
        } elseif ($entry->kind === 'module') {
            $values = ['title' => $d['title'], 'learning_path_id' => $d['path_id'], 'catalog_visible' => true, 'updated_at' => now()];
            if ($id) {
                if (DB::table('modules')->where('id', $id)->value('learning_path_id') !== $d['path_id']) {
                    $values['sort_order'] = (DB::table('modules')->where('learning_path_id', $d['path_id'])->max('sort_order') ?? 0) + 1;
                }
                DB::table('modules')->where('id', $id)->update($values);
            } else {
                $entry->subject_id = DB::table('modules')->insertGetId([...$values, 'sort_order' => (DB::table('modules')->where('learning_path_id', $d['path_id'])->max('sort_order') ?? 0) + 1, 'created_at' => now()]);
            }
        }
        $entry->is_managed = true;
        $entry->is_archived = false;
        $entry->published_revision_id = $revision->id;
        $entry->save();
    }
}
