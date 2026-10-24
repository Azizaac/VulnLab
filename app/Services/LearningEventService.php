<?php

namespace App\Services;

use App\Models\Lab;
use App\Models\LabProgress;
use App\Models\LearningActivityEvent;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Note;
use App\Models\QuizAttempt;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class LearningEventService
{
    public const ACHIEVEMENTS = [
        'first_step' => ['name' => 'Langkah Pertama', 'description' => 'Selesaikan satu materi dengan bacaan dan kuis lulus.', 'icon' => 'footprints'],
        'http_explorer' => ['name' => 'HTTP Explorer', 'description' => 'Selesaikan enam materi Dasar Web dan HTTP.', 'icon' => 'globe'],
        'quiz_starter' => ['name' => 'Quiz Starter', 'description' => 'Lulus satu kuis yang dinilai server.', 'icon' => 'check'],
        'first_lab' => ['name' => 'Lab Pertama', 'description' => 'Selesaikan satu lab dengan bukti runtime.', 'icon' => 'flask'],
        'api_explorer' => ['name' => 'API Explorer', 'description' => 'Selesaikan lima lab API dan kontrol akses yang berbeda.', 'icon' => 'code'],
        'note_master' => ['name' => 'Note Master', 'description' => 'Simpan sepuluh catatan dengan isi. Tanpa hadiah XP.', 'icon' => 'book'],
        'week_warrior' => ['name' => 'Week Warrior', 'description' => 'Belajar dengan bukti yang memenuhi syarat tujuh hari berturut-turut.', 'icon' => 'flame'],
        'bug_hunter' => ['name' => 'Bug Hunter Latihan', 'description' => 'Satu laporan diterima oleh validator Latihan Internal.', 'icon' => 'shield'],
    ];

    public const HTTP_LESSONS = ['client-server', 'http-methods', 'status-headers', 'cookies-sessions', 'origin-cors', 'rest-api-json'];

    public const API_LABS = ['order-idor', 'address-bola', 'profile-mass-assignment', 'jwt-validation', 'admin-bfla'];

    private const REWARDS = ['lesson_completed' => 10, 'quiz_passed' => 20, 'lab_solved' => 0, 'report_accepted_for_practice' => 50];

    /** Only trusted domain handlers call this method; no activity-write HTTP route exists. */
    public function record(User $user, string $eventType, string $subjectType, int $subjectId, CarbonInterface|string|null $occurredAt = null, array $metadata = []): array
    {
        return DB::transaction(function () use ($user, $eventType, $subjectType, $subjectId, $occurredAt, $metadata) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $this->assertQualified($user, $eventType, $subjectType, $subjectId);
            $at = CarbonImmutable::parse($occurredAt ?? now())->utc();
            $key = $eventType.':'.$subjectType.':'.$subjectId;
            $safeMetadata = array_intersect_key($metadata, array_flip(['title', 'score', 'rubric_version']));
            $inserted = DB::table('learning_activity_events')->insertOrIgnore([
                'user_id' => $user->id, 'event_type' => $eventType, 'subject_type' => $subjectType, 'subject_id' => $subjectId,
                'occurred_at' => $at, 'duration_seconds' => null, 'source_event_key' => $user->id.':'.$key,
                'metadata_json' => json_encode($safeMetadata), 'created_at' => now(), 'updated_at' => now(),
            ]);
            $amount = self::REWARDS[$eventType];
            if ($eventType === 'lab_solved') {
                // Historical awards are imported as awarded, never re-valued or added twice.
                $amount = (int) (DB::table('xp_events')->where('user_id', $user->id)->where('lab_id', $subjectId)->value('points')
                    ?? LabProgress::where('user_id', $user->id)->where('lab_id', $subjectId)->value('points_awarded'));
            }
            $rewarded = DB::table('xp_transactions')->insertOrIgnore([
                'user_id' => $user->id, 'source_type' => $subjectType, 'source_id' => $subjectId, 'reward_key' => $key,
                'amount' => $amount, 'granted_at' => $at, 'context_json' => json_encode(['event_type' => $eventType, 'rule_version' => 1]),
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $badges = $this->refreshAchievements($user, $user->id.':'.$key);

            return ['xp_delta' => $rewarded ? $amount : 0, 'event_created' => (bool) $inserted, 'new_achievements' => $badges, ...$this->level($user)];
        });
    }

    private function assertQualified(User $user, string $type, string $subjectType, int $id): void
    {
        $qualified = match ($type) {
            'lesson_completed' => $subjectType === 'lesson' && LessonProgress::where('user_id', $user->id)->where('lesson_id', $id)->whereNotNull('read_at')->whereNotNull('quiz_passed_at')->whereNotNull('completed_at')->exists()
                && QuizAttempt::where('user_id', $user->id)->where('lesson_id', $id)->where('passed', true)->exists(),
            'quiz_passed' => $subjectType === 'lesson' && QuizAttempt::where('user_id', $user->id)->where('lesson_id', $id)->where('passed', true)->exists(),
            'lab_solved' => $subjectType === 'lab' && LabProgress::where('user_id', $user->id)->where('lab_id', $id)->exists(),
            'report_accepted_for_practice' => $subjectType === 'report' && Schema::hasTable('vulnerability_reports') && DB::table('vulnerability_reports')->where('user_id', $user->id)->where('id', $id)->where('status', 'accepted_for_practice')->exists(),
            default => false,
        };
        if (! $qualified) {
            throw new InvalidArgumentException('Activity must be supported by validated owner-scoped domain state.');
        }
    }

    public function level(User $user): array
    {
        $xp = (int) DB::table('xp_transactions')->where('user_id', $user->id)->sum('amount');
        $level = (int) floor(sqrt($xp / 100)) + 1;
        $start = 100 * ($level - 1) ** 2;
        $next = 100 * $level ** 2;

        return ['total_xp' => $xp, 'level' => $level, 'next_level_xp' => $next, 'level_progress_percent' => round(100 * ($xp - $start) / ($next - $start), 1)];
    }

    public function streak(User $user): array
    {
        $zone = $user->timezone ?: 'Asia/Jakarta';
        $today = CarbonImmutable::now($zone)->startOfDay();
        $days = LearningActivityEvent::where('user_id', $user->id)->where('occurred_at', '<=', now())->orderBy('occurred_at')->get(['occurred_at'])
            ->map(fn ($event) => $event->occurred_at->timezone($zone)->toDateString())->unique()->values();
        $longest = 0;
        $run = 0;
        $previous = null;
        foreach ($days as $date) {
            $day = CarbonImmutable::parse($date, $zone);
            $run = $previous && $previous->addDay()->toDateString() === $date ? $run + 1 : 1;
            $longest = max($longest, $run);
            $previous = $day;
        }
        $qualified = array_fill_keys($days->all(), true);
        $cursor = isset($qualified[$today->toDateString()]) ? $today : $today->subDay();
        $current = 0;
        while (isset($qualified[$cursor->toDateString()])) {
            $current++;
            $cursor = $cursor->subDay();
        }

        return ['current' => $current, 'longest' => $longest, 'days' => collect(range(6, 0))->map(fn ($n) => ['date' => $today->subDays($n)->toDateString(), 'qualified' => isset($qualified[$today->subDays($n)->toDateString()])])->all()];
    }

    public function achievements(User $user): array
    {
        $completed = LearningActivityEvent::where('user_id', $user->id)->where('event_type', 'lesson_completed')->pluck('subject_id');
        $httpIds = Lesson::whereIn('slug', self::HTTP_LESSONS)->pluck('id');
        $apiIds = Lab::whereIn('slug', self::API_LABS)->pluck('id');
        $events = LearningActivityEvent::where('user_id', $user->id)->get(['event_type', 'subject_id']);
        $notes = Note::where('user_id', $user->id)->get(['body_md'])->filter(fn ($note) => trim(strip_tags($note->body_md)) !== '')->count();
        $rules = [
            'first_step' => [$completed->count(), 1, Lesson::exists()],
            'http_explorer' => [$completed->intersect($httpIds)->count(), 6, $httpIds->count() === 6],
            'quiz_starter' => [$events->where('event_type', 'quiz_passed')->count(), 1, Lesson::exists()],
            'first_lab' => [$events->where('event_type', 'lab_solved')->count(), 1, Lab::exists()],
            'api_explorer' => [$events->where('event_type', 'lab_solved')->pluck('subject_id')->intersect($apiIds)->count(), 5, $apiIds->count() >= 5],
            'note_master' => [$notes, 10, true],
            'week_warrior' => [$this->streak($user)['longest'], 7, true],
            'bug_hunter' => [$events->where('event_type', 'report_accepted_for_practice')->count(), 1, true],
        ];
        $unlocked = DB::table('user_achievements')->where('user_id', $user->id)->pluck('unlocked_at', 'achievement_id');

        return DB::table('achievements')->orderBy('id')->get()->map(function ($achievement) use ($rules, $unlocked) {
            [$progress, $target, $attainable] = $rules[$achievement->code];

            return ['code' => $achievement->code, 'name' => $achievement->name, 'description' => $achievement->description, 'icon' => $achievement->icon, 'unlocked_at' => $unlocked->get($achievement->id), 'attainable' => $attainable, 'progress' => min($progress, $target), 'target' => $target, 'id' => $achievement->id];
        })->all();
    }

    public function refreshAchievements(User $user, string $sourceEventKey = 'notes:updated'): array
    {
        return DB::transaction(function () use ($user, $sourceEventKey) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $new = [];
            foreach ($this->achievements($user) as $achievement) {
                if ($achievement['attainable'] && ! $achievement['unlocked_at'] && $achievement['progress'] >= $achievement['target']) {
                    $created = DB::table('user_achievements')->insertOrIgnore(['user_id' => $user->id, 'achievement_id' => $achievement['id'], 'unlocked_at' => now(), 'source_event_key' => $sourceEventKey]);
                    if ($created) {
                        $new[] = $achievement['name'];
                    }
                }
            }

            return $new;
        });
    }

    public function backfill(User $user): void
    {
        DB::transaction(function () use ($user) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            if (DB::table('learning_backfills')->where('user_id', $user->id)->where('version', 1)->exists()) {
                return;
            }
            $attempts = QuizAttempt::where('user_id', $user->id)->where('passed', true)->orderBy('created_at')->orderBy('id')->get()->unique('lesson_id');
            foreach ($attempts as $attempt) {
                $this->record($user, 'quiz_passed', 'lesson', $attempt->lesson_id, $attempt->created_at);
                $progress = LessonProgress::where('user_id', $user->id)->where('lesson_id', $attempt->lesson_id)->first();
                if ($progress?->read_at && $progress->completed_at && $progress->quiz_passed_at) {
                    $this->record($user, 'lesson_completed', 'lesson', $attempt->lesson_id, $progress->completed_at);
                }
            }
            foreach (LabProgress::where('user_id', $user->id)->get() as $progress) {
                $this->record($user, 'lab_solved', 'lab', $progress->lab_id, $progress->solved_at);
            }
            // Preserve a trusted pre-Sprint-4 ledger row even if its old progress projection is missing.
            foreach (DB::table('xp_events')->where('user_id', $user->id)->get() as $award) {
                DB::table('xp_transactions')->insertOrIgnore(['user_id' => $user->id, 'source_type' => 'lab', 'source_id' => $award->lab_id, 'reward_key' => 'lab_solved:lab:'.$award->lab_id, 'amount' => $award->points, 'granted_at' => $award->created_at, 'context_json' => json_encode(['event_type' => 'lab_solved', 'rule_version' => 1, 'legacy_import' => true]), 'created_at' => now(), 'updated_at' => now()]);
            }
            $this->refreshAchievements($user, 'backfill:v1:'.$user->id);
            DB::table('learning_backfills')->insert(['user_id' => $user->id, 'version' => 1, 'completed_at' => now()]);
        });
    }
}
