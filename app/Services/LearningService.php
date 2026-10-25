<?php

namespace App\Services;

use App\Models\ActivityEvent;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Module;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LearningService
{
    public function summaries(User $user)
    {
        $progress = LessonProgress::where('user_id', $user->id)->get()->keyBy('lesson_id');

        return Lesson::with('prerequisites:id,slug,title')->orderBy('sort_order')->get()->map(function ($l) use ($progress) {
            $p = $progress->get($l->id);

            return ['id' => $l->id, 'slug' => $l->slug, 'title' => $l->title, 'module_id' => $l->module_id, 'minutes' => $l->estimated_minutes, 'read' => (bool) $p?->read_at, 'quiz_passed' => (bool) $p?->quiz_passed_at, 'completed' => (bool) $p?->completed_at, 'locked' => $l->prerequisites->contains(fn ($pre) => ! $progress->get($pre->id)?->completed_at), 'prerequisites' => $l->prerequisites->map(fn ($pre) => ['id' => $pre->id, 'slug' => $pre->slug, 'title' => $pre->title])];
        });
    }

    public function courses(User $user): array
    {
        $lessons = $this->summaries($user);

        return Module::with('path')->where('catalog_visible', true)->orderBy('id')->get()->filter(fn ($m) => $m->path?->catalog_visible && $m->path->is_course)->map(function ($m) use ($lessons) {
            $rows = $lessons->where('module_id', $m->id)->values();
            $ids = $rows->pluck('id');

            return ['id' => $m->id, 'title' => $m->path->title, 'description' => $m->path->description, 'outcomes' => json_decode($m->path->outcomes, true), 'difficulty' => $m->path->difficulty, 'section' => $m->title, 'minutes' => $rows->sum('minutes'), 'completed' => $rows->where('completed', true)->count(), 'lessons' => $rows, 'prerequisites' => $rows->flatMap(fn ($l) => $l['prerequisites'])->reject(fn ($p) => $ids->contains($p['id']))->unique('id')->values(), 'sources' => DB::table('lesson_sources')->where('catalog_active', true)->whereIn('lesson_id', $ids)->get(['title', 'url'])->unique('url')->values()];
        })->values()->all();
    }

    private function unlocked(User $user, Lesson $lesson): void
    {
        $completed = LessonProgress::where('user_id', $user->id)->whereNotNull('completed_at')->pluck('lesson_id');
        if ($lesson->prerequisites->contains(fn ($p) => ! $completed->contains($p->id))) {
            throw ValidationException::withMessages(['lesson' => 'Selesaikan bacaan dan kuis prasyarat terlebih dahulu.']);
        }
    }

    public function read(User $user, Lesson $lesson): LessonProgress
    {
        return DB::transaction(function () use ($user, $lesson) {
            User::whereKey($user->id)->lockForUpdate()->first();
            $this->unlocked($user, $lesson);
            $p = LessonProgress::firstOrCreate(['user_id' => $user->id, 'lesson_id' => $lesson->id]);
            if (! $p->read_at) {
                $p->read_at = now();
                $p->save();
                $this->event($user, 'lesson_read', $lesson);
            }

            return $p;
        });
    }

    public function grade(User $user, Lesson $lesson, array $data): QuizAttempt
    {
        return DB::transaction(function () use ($user, $lesson, $data) {
            User::whereKey($user->id)->lockForUpdate()->first();
            $existing = QuizAttempt::where('user_id', $user->id)->where('submission_id', $data['submission_id'])->first();
            if ($existing) {
                abort_if($existing->lesson_id !== $lesson->id, 409);

                $existing->setAttribute('xp_delta', 0);
                $existing->setAttribute('new_achievements', []);

                return $existing;
            }
            $this->unlocked($user, $lesson);
            $p = LessonProgress::where('user_id', $user->id)->where('lesson_id', $lesson->id)->first();
            if (! $p?->read_at) {
                throw ValidationException::withMessages(['lesson' => 'Tandai bacaan sudah dipahami sebelum mengerjakan kuis.']);
            }
            [$questions, $passingScore, $revisionId] = app(QuizPresentationService::class)->canonical($user, $lesson, $data['quiz_context'] ?? null);
            $answers = collect($data['answers']);
            if ($questions->isEmpty() || $answers->count() !== $questions->count() || $answers->pluck('question_id')->unique()->count() !== $questions->count() || $answers->pluck('question_id')->diff($questions->pluck('id'))->isNotEmpty()) {
                throw ValidationException::withMessages(['answers' => 'Jawab semua soal lesson ini tepat satu kali.']);
            }
            $earned = 0;
            $feedback = [];
            foreach ($questions as $q) {
                $choice = $q->choices->firstWhere('id', $answers->firstWhere('question_id', $q->id)['choice_id']);
                if (! $choice) {
                    throw ValidationException::withMessages(['answers' => 'Pilihan tidak sesuai soal.']);
                }
                if ($choice->is_correct) {
                    $earned += $q->points;
                }
                $feedback[] = ['question' => $q->question, 'selected' => $choice->text, 'correct' => $choice->is_correct, 'answer' => $q->choices->firstWhere('is_correct', true)->text, 'explanation' => $q->explanation];
            }
            $score = (int) round(100 * $earned / $questions->sum('points'));
            $passed = $score >= $passingScore;
            $attempt = QuizAttempt::create(['user_id' => $user->id, 'lesson_id' => $lesson->id, 'quiz_revision_id' => $revisionId, 'submission_id' => $data['submission_id'], 'score' => $score, 'passed' => $passed, 'feedback' => $feedback, 'created_at' => now()]);
            if ($passed && ! $p->quiz_passed_at) {
                $p->quiz_passed_at = now();
                $p->completed_at = now();
                $p->save();
                $this->event($user, 'lesson_completed', $lesson);
            }
            $xpDelta = 0;
            $badges = [];
            if ($passed) {
                $events = app(LearningEventService::class);
                foreach (['quiz_passed', 'lesson_completed'] as $type) {
                    $reward = $events->record($user, $type, 'lesson', $lesson->id, $p->completed_at, ['title' => $lesson->title]);
                    $xpDelta += $reward['xp_delta'];
                    $badges = array_merge($badges, $reward['new_achievements']);
                }
            }
            $attempt->setAttribute('xp_delta', $xpDelta);
            $attempt->setAttribute('new_achievements', $badges);

            return $attempt;
        });
    }

    private function event(User $user, string $type, Lesson $lesson): void
    {
        ActivityEvent::create(['user_id' => $user->id, 'event_type' => $type, 'metadata_json' => ['title' => $lesson->title], 'created_at' => now()]);
    }
}
