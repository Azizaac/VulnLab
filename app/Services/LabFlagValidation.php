<?php

namespace App\Services;

use App\Contracts\LabRunnerAdapter;
use App\Models\ActivityEvent;
use App\Models\LabAttempt;
use App\Models\LabProgress;
use App\Models\LabSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LabFlagValidation
{
    public function __construct(private LabService $service, private LabRunnerAdapter $runner) {}

    public function submit(LabSession $s, array $input): array
    {
        return DB::transaction(function () use ($s, $input) {
            User::whereKey($s->user_id)->lockForUpdate()->firstOrFail();
            $s = LabSession::whereKey($s->id)->lockForUpdate()->firstOrFail();
            $this->service->active($s, $input['generation']);
            $prior = LabAttempt::where('lab_session_id', $s->id)->where('submission_id', $input['submission_id'])->first();
            if ($prior) {
                abort_if($prior->generation !== $s->generation, 409, 'Percobaan berasal dari sesi lama.');

                return ['success' => $prior->success, 'message' => $prior->success ? 'Flag sudah tervalidasi.' : 'Flag belum cocok atau kondisi lab belum terpenuhi.', 'duplicate' => true, 'xp_delta' => 0, 'new_achievements' => []];
            }
            $valid = hash_equals($s->flag_hash, hash('sha256', $input['flag']));
            $reward = ['xp_delta' => 0, 'new_achievements' => []];
            if ($valid) {
                $proof = $this->runner->evidence($s);
                $valid = ($proof['eligible'] ?? false) === true && ($proof['generation'] ?? null) === $s->generation && ($proof['lab'] ?? null) === $s->lab->slug;
            }
            LabAttempt::create(['lab_session_id' => $s->id, 'generation' => $s->generation, 'submission_id' => $input['submission_id'], 'success' => $valid, 'created_at' => now()]);
            if ($valid) {
                $p = LabProgress::firstOrCreate(['user_id' => $s->user_id, 'lab_id' => $s->lab_id], ['solved_at' => now(), 'points_awarded' => $s->lab->points]);
                if ($p->wasRecentlyCreated) {
                    DB::table('xp_events')->insertOrIgnore(['user_id' => $s->user_id, 'lab_id' => $s->lab_id, 'points' => $s->lab->points, 'created_at' => now()]);
                    ActivityEvent::create(['user_id' => $s->user_id, 'event_type' => 'lab_solved', 'metadata_json' => ['title' => $s->lab->title, 'lab_id' => $s->lab_id], 'created_at' => now()]);
                }
                if (! $s->solved_at) {
                    $s->update(['status' => 'solved', 'solved_at' => now()]);
                }
                $reward = app(LearningEventService::class)->record(User::findOrFail($s->user_id), 'lab_solved', 'lab', $s->lab_id, $p->solved_at, ['title' => $s->lab->title]);
            }

            return ['success' => $valid, 'message' => $valid ? 'Flag tervalidasi. Kelulusan tersimpan; XP hanya diberikan pada kelulusan pertama.' : 'Flag belum cocok atau kondisi lab belum terpenuhi.', 'duplicate' => false, ...$reward];
        });
    }
}
