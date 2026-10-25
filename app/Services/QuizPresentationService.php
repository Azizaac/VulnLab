<?php

namespace App\Services;

use App\Models\ContentEntry;
use App\Models\Lesson;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class QuizPresentationService
{
    public function present(User $user, Lesson $lesson): array
    {
        $entry = ContentEntry::where('kind', 'quiz')->where('subject_id', $lesson->id)->first();
        $questions = $lesson->questions()->with('choices')->get();
        $random = $entry?->published?->data_json['randomize'] ?? true;
        if ($random) {
            $questions = $questions->shuffle();
        }
        $threshold = $entry?->published?->data_json['passing_score'] ?? 70;
        $id = (string) Str::uuid();
        DB::table('quiz_presentations')->where('expires_at', '<', now())->delete();
        DB::table('quiz_presentations')->insert(['id' => $id, 'user_id' => $user->id, 'lesson_id' => $lesson->id, 'revision_id' => $entry?->published_revision_id, 'question_ids' => json_encode($questions->pluck('id')->all()), 'passing_score' => $threshold, 'expires_at' => now()->addDay()]);

        return ['quiz_context' => $id, 'passing_score' => $threshold, 'questions' => $questions->map(fn ($q) => ['id' => $q->id, 'question' => $q->question, 'choices' => ($random ? $q->choices->shuffle() : $q->choices)->map(fn ($c) => ['id' => $c->id, 'text' => $c->text])->values()])->values()];
    }

    public function canonical(User $user, Lesson $lesson, ?string $context): array
    {
        if ($context) {
            $row = DB::table('quiz_presentations')->where('id', $context)->where('user_id', $user->id)->where('lesson_id', $lesson->id)->where('expires_at', '>', now())->first();
            if (! $row) {
                throw ValidationException::withMessages(['answers' => 'Konteks kuis kedaluwarsa atau bukan milik akun ini. Muat ulang kuis.']);
            }

            return [QuizQuestion::with('choices')->where('lesson_id', $lesson->id)->whereIn('id', json_decode($row->question_ids, true))->get(), $row->passing_score, $row->revision_id];
        }
        if (ContentEntry::where('kind', 'quiz')->where('subject_id', $lesson->id)->where('is_managed', true)->exists()) {
            throw ValidationException::withMessages(['answers' => 'Muat ulang kuis untuk memperoleh versi soal yang valid.']);
        }

        return [$lesson->questions()->with('choices')->get(), 70, null];
    }
}
