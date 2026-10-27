<?php

namespace App\Services;

use App\Models\ContentEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ContentSchema
{
    public const KINDS = ['lesson', 'quiz', 'lab', 'roadmap', 'path', 'module'];

    public const CHECKS = ['accuracy', 'clarity', 'safety', 'references', 'license'];

    public function validate(string $kind, array $data, bool $publishing = false, ?ContentEntry $entry = null, bool $requirePublishedParent = true): array
    {
        $required = $publishing ? 'required' : 'nullable';
        $rules = [
            'title' => 'required|string|min:3|max:180', 'slug' => 'required|string|max:160|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            'sources' => 'present|array|max:20'.($publishing && ! in_array($kind, ['path', 'module']) ? '|min:1' : ''),
            'sources.*' => 'array:title,url,publisher,license', 'sources.*.title' => 'required|string|max:180',
            'sources.*.url' => 'required|url:https|max:1000', 'sources.*.publisher' => 'required|string|max:180', 'sources.*.license' => 'required|string|max:180',
        ];
        $specific = match ($kind) {
            'lesson' => [
                'module_id' => ['required', 'integer', Rule::exists('modules', 'id')], 'summary' => "$required|string|max:500", 'audience' => "$required|string|max:200",
                'difficulty' => 'required|in:Pemula,Menengah,Lanjutan', 'minutes' => 'required|integer|min:1|max:480',
                'objectives' => 'present|array|max:12'.($publishing ? '|min:1' : ''), 'objectives.*' => 'required|string|max:300',
                'tags' => 'present|array|max:12', 'tags.*' => 'required|string|max:40|distinct',
                'prerequisite_ids' => 'present|array|max:20', 'prerequisite_ids.*' => ['integer', 'distinct', Rule::exists('lessons', 'id')],
                'body_md' => "$required|string|max:150000", 'example_md' => 'nullable|string|max:30000',
            ],
            'quiz' => [
                'lesson_id' => ['nullable', 'integer', Rule::exists('lessons', 'id')],
                'lesson_entry_id' => ['nullable', 'integer', Rule::exists('content_entries', 'id')->where('kind', 'lesson')],
                'passing_score' => 'required|integer|min:1|max:100', 'randomize' => 'required|boolean',
                'questions' => 'present|array|max:50'.($publishing ? '|min:1' : ''), 'questions.*' => 'array:question,explanation,difficulty,source_url,choices,source_key',
                'questions.*.source_key' => 'nullable|string|max:80|regex:/^[A-Za-z0-9][A-Za-z0-9_-]*$/|distinct',
                'questions.*.question' => 'required|string|max:3000', 'questions.*.explanation' => 'required|string|max:6000',
                'questions.*.difficulty' => 'required|in:Pemula,Menengah,Lanjutan', 'questions.*.source_url' => 'required|url:https|max:1000',
                'questions.*.choices' => 'required|array|min:2|max:6', 'questions.*.choices.*' => 'array:text,is_correct',
                'questions.*.choices.*.text' => 'required|string|max:2000', 'questions.*.choices.*.is_correct' => 'required|boolean',
            ],
            'lab' => [
                'lesson_id' => ['required', 'integer', Rule::exists('lessons', 'id')], 'category_id' => ['required', 'integer', Rule::exists('lab_categories', 'id')],
                'difficulty' => 'required|in:Easy,Medium,Hard', 'minutes' => 'required|integer|min:1|max:480',
                'scenario_md' => "$required|string|max:30000", 'objectives' => 'present|array|max:12', 'objectives.*' => 'required|string|max:300',
                'instructions' => 'present|array|max:20', 'instructions.*' => 'required|string|max:4000',
                'hints' => 'present|array|max:3', 'hints.*' => 'required|string|max:4000',
                'visibility' => 'required|boolean',
            ],
            'path' => ['description' => "$required|string|max:1000", 'difficulty' => 'required|in:Pemula,Menengah,Lanjutan', 'objectives' => 'present|array|max:12', 'objectives.*' => 'required|string|max:300'],
            'module' => ['path_id' => ['required', 'integer', Rule::exists('learning_paths', 'id')]],
            'roadmap' => [
                'stages' => 'required|array|min:1|max:12', 'stages.*' => 'array:key,title,milestone,category',
                'stages.*.key' => 'required|string|alpha_dash|max:40|distinct', 'stages.*.title' => 'required|string|max:180', 'stages.*.milestone' => 'required|string|max:500', 'stages.*.category' => 'required|string|max:80',
                'days' => 'required|array|size:90', 'days.*' => 'array:day_number,stage_key,title,objective,tasks',
                'days.*.day_number' => 'required|integer|min:1|max:90|distinct', 'days.*.stage_key' => 'required|string|max:40',
                'days.*.title' => 'required|string|max:180', 'days.*.objective' => 'required|string|max:2000',
                'days.*.tasks' => 'required|array|min:1|max:8', 'days.*.tasks.*' => 'array:key,kind,title,description,minutes,subject_id,prerequisite_key',
                'days.*.tasks.*.key' => 'required|string|alpha_dash|max:60', 'days.*.tasks.*.kind' => 'required|in:theory,practice,reflection,quiz,lab,report',
                'days.*.tasks.*.title' => 'required|string|max:180', 'days.*.tasks.*.description' => 'required|string|max:4000',
                'days.*.tasks.*.minutes' => 'required|integer|min:1|max:480', 'days.*.tasks.*.subject_id' => 'nullable|integer|min:1',
                'days.*.tasks.*.prerequisite_key' => 'nullable|string|max:60',
            ],
            default => abort(422),
        };
        $rules = [...$rules, ...$specific];
        if (array_diff(array_keys($data), array_keys($rules))) {
            throw ValidationException::withMessages(['data' => 'Field di luar skema konten ditolak. Konfigurasi runtime dan data akun tidak dapat diedit di sini.']);
        }
        $validated = Validator::make($data, $rules)->validate();
        if ($publishing && $kind === 'lesson' && ! DB::table('modules')->join('learning_paths', 'learning_paths.id', '=', 'modules.learning_path_id')->where('modules.id', $data['module_id'])->where('modules.catalog_visible', true)->where('learning_paths.catalog_visible', true)->where('learning_paths.is_course', true)->exists()) {
            throw ValidationException::withMessages(['module_id' => 'Pilih modul dari jalur belajar terbit.']);
        }
        if ($publishing && $kind === 'lab' && ! DB::table('lessons')->where('id', $data['lesson_id'])->where('catalog_visible', true)->exists()) {
            throw ValidationException::withMessages(['lesson_id' => 'Lesson terkait harus masih terbit.']);
        }
        if ($entry && $data['slug'] !== $entry->slug) {
            throw ValidationException::withMessages(['slug' => 'Slug stabil tidak dapat diubah. Buat konten baru untuk URL baru.']);
        }
        if ($kind === 'lesson') {
            $graph = DB::table('lesson_prerequisites')->get()->groupBy('lesson_id')->map(fn ($rows) => $rows->pluck('prerequisite_id')->all())->all();
            $subject = $entry?->subject_id ?? -1;
            $graph[$subject] = $validated['prerequisite_ids'];
            $this->acyclic($graph);
        }
        if ($kind === 'quiz') {
            $lessonId = $validated['lesson_id'] ?? null;
            $parentId = $validated['lesson_entry_id'] ?? null;
            if ((bool) $lessonId === (bool) $parentId) {
                throw ValidationException::withMessages(['lesson_id' => 'Pilih tepat satu lesson atau draft lesson.']);
            }
            $parent = $parentId ? ContentEntry::whereKey($parentId)->where('kind', 'lesson')->where('is_archived', false)->first() : null;
            if ($parentId && ! $parent) {
                throw ValidationException::withMessages(['lesson_entry_id' => 'Draft lesson tidak tersedia.']);
            }
            if ($entry && (($entry->parent_lesson_entry_id && (int) $entry->parent_lesson_entry_id !== (int) $parentId) || (! $entry->parent_lesson_entry_id && $entry->subject_id && (int) $entry->subject_id !== (int) $lessonId))) {
                throw ValidationException::withMessages(['lesson_id' => 'Bank kuis terikat pada lesson awal.']);
            }
            $resolved = $parent ? ($parent->published_revision_id ? $parent->subject_id : null) : $lessonId;
            if ($publishing && ($requirePublishedParent || ! $parentId) && (! $resolved || ! DB::table('lessons')->where('id', $resolved)->where('catalog_visible', true)->exists())) {
                throw ValidationException::withMessages(['lesson_id' => 'Terbitkan lesson terkait sebelum menerbitkan kuis.']);
            }
            foreach ($validated['questions'] as $i => $q) {
                if (collect($q['choices'])->where('is_correct', true)->count() !== 1 || collect($q['choices'])->map(fn ($c) => mb_strtolower(trim($c['text'])))->unique()->count() !== count($q['choices'])) {
                    throw ValidationException::withMessages(["questions.$i.choices" => 'Tepat satu jawaban benar dan 2–6 pilihan berbeda diperlukan.']);
                }
            }
        }
        if ($kind === 'roadmap') {
            $keys = collect($validated['stages'])->pluck('key')->all();
            $graph = [];
            $kinds = [];
            foreach ($validated['days'] as $i => $day) {
                if (! in_array($day['stage_key'], $keys)) {
                    throw ValidationException::withMessages(["days.$i.stage_key" => 'Tahap tidak ditemukan.']);
                }
                foreach ($day['tasks'] as $task) {
                    if (isset($graph[$task['key']])) {
                        throw ValidationException::withMessages(['days' => 'Kunci tugas harus unik.']);
                    }
                    $graph[$task['key']] = empty($task['prerequisite_key']) ? [] : [$task['prerequisite_key']];
                    $kinds[$task['key']] = $task['kind'];
                    $table = match ($task['kind']) {
                        'quiz' => 'lessons', 'lab' => 'labs', default => null
                    };
                    if ($table && (empty($task['subject_id']) || ! DB::table($table)->where('id', $task['subject_id'])->where('catalog_visible', true)->exists())) {
                        throw ValidationException::withMessages(['days' => 'Tugas kuis/lab harus menautkan konten terbit yang valid.']);
                    }
                    if ($publishing && $task['kind'] === 'quiz' && ! DB::table('quiz_questions')->where('lesson_id', $task['subject_id'])->where('catalog_active', true)->exists()) {
                        throw ValidationException::withMessages(['days' => 'Tugas kuis harus menautkan bank soal terbit.']);
                    }
                    if ($publishing && $task['kind'] === 'lab' && ! DB::table('labs')->where('id', $task['subject_id'])->where('enabled', true)->exists()) {
                        throw ValidationException::withMessages(['days' => 'Tugas lab memerlukan runtime yang sudah diverifikasi.']);
                    }
                    if ($task['kind'] === 'report' && ! empty($task['subject_id'])) {
                        throw ValidationException::withMessages(['days' => 'Tugas laporan memeriksa laporan milik pelajar sendiri; ID laporan pribadi tidak boleh ada di template.']);
                    }
                }
            }
            foreach ($graph as $links) {
                foreach ($links as $link) {
                    if (! array_key_exists($link, $graph)) {
                        throw ValidationException::withMessages(['days' => 'Prasyarat tugas tidak ditemukan.']);
                    }
                }
            }
            $this->acyclic($graph);
        }

        return $validated;
    }

    private function acyclic(array $graph): void
    {
        $visited = [];
        $visiting = [];
        $visit = function ($key) use (&$visit, &$visited, &$visiting, $graph) {
            if (isset($visiting[$key])) {
                throw ValidationException::withMessages(['prerequisite_ids' => 'Prasyarat membentuk siklus. Perbaiki urutan tugas atau lesson.']);
            }
            if (isset($visited[$key])) {
                return;
            }
            $visiting[$key] = true;
            foreach ($graph[$key] ?? [] as $next) {
                $visit($next);
            }
            unset($visiting[$key]);
            $visited[$key] = true;
        };
        foreach (array_keys($graph) as $key) {
            $visit($key);
        }
    }
}
