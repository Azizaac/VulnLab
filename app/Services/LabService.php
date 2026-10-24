<?php

namespace App\Services;

use App\Contracts\LabRunnerAdapter;
use App\Models\Lab;
use App\Models\LabProgress;
use App\Models\LabSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LabService
{
    public function __construct(private LabRunnerAdapter $runner) {}

    public function enabled(Lab $lab): void
    {
        abort_unless($lab->enabled && config('labs.enabled'), 503, 'Sandbox belum tersedia. Aktifkan runner lokal melalui dokumentasi.');
    }

    public function start(User $user, Lab $lab): LabSession
    {
        $this->enabled($lab);
        $session = DB::transaction(function () use ($user, $lab) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $s = LabSession::firstOrNew(['user_id' => $user->id, 'lab_id' => $lab->id]);
            if (! $s->exists) {
                $s->id = (string) Str::uuid();
                $this->rotate($s, 1);
            } elseif ($s->expires_at->isPast() || $s->status === 'stopped') {
                $this->rotate($s, $s->generation + 1);
            }

            return $s;
        });

        return in_array($session->status, ['starting', 'error'], true) ? $this->provision($session) : $session;
    }

    public function rotate(LabSession $s, int $generation): void
    {
        $flag = 'VULNLAB{'.bin2hex(random_bytes(24)).'}';
        $s->forceFill(['generation' => $generation, 'capability' => bin2hex(random_bytes(32)), 'flag_secret' => $flag, 'flag_hash' => hash('sha256', $flag), 'status' => 'starting', 'fixtures' => null, 'started_at' => now(), 'expires_at' => now()->addMinutes(config('labs.ttl_minutes')), 'solved_at' => null])->save();
    }

    public function provision(LabSession $s): LabSession
    {
        try {
            $result = $this->runner->provision($s);
            abort_unless(($result['ready'] ?? false) === true, 503, 'Sandbox belum siap.');
        } catch (\Throwable $e) {
            LabSession::whereKey($s->id)->where('generation', $s->generation)->update(['status' => 'error']);
            throw $e;
        }
        LabSession::whereKey($s->id)->where('generation', $s->generation)->update(['status' => 'running', 'fixtures' => json_encode($result['fixtures'] ?? [])]);

        return $s->fresh();
    }

    public function active(LabSession $session, int $generation): void
    {
        Gate::authorize('access', $session);
        $this->enabled($session->lab);
        abort_if($session->generation !== $generation, 409, 'Sesi berubah. Muat ulang workspace.');
        abort_if($session->expires_at->isPast() || $session->status === 'stopped', 410, 'Sesi kedaluwarsa atau dihentikan. Mulai kembali untuk melanjutkan.');
        abort_unless(in_array($session->status, ['running', 'solved'], true), 409, 'Sesi belum siap. Coba mulai kembali.');
    }

    public function payload(?LabSession $s): ?array
    {
        if (! $s) {
            return null;
        }

        return ['id' => $s->id, 'generation' => $s->generation, 'status' => $s->expires_at->isPast() ? 'expired' : $s->status, 'started_at' => $s->started_at->toIso8601String(), 'expires_at' => $s->expires_at->toIso8601String(), 'solved_at' => $s->solved_at?->toIso8601String(), 'fixtures' => $s->fixtures];
    }

    public function request(LabSession $s, array $data): array
    {
        return DB::transaction(function () use ($s, $data) {
            $s = LabSession::whereKey($s->id)->lockForUpdate()->firstOrFail();
            $this->active($s, $data['generation']);
            $routes = json_decode(file_get_contents(database_path('data/lab-routes.json')), true, 512, JSON_THROW_ON_ERROR);
            $rule = $routes[$s->lab->slug][$data['endpoint']] ?? null;
            if (! $rule || ! in_array($data['method'], $rule['methods'], true)) {
                throw ValidationException::withMessages(['endpoint' => 'Endpoint atau method di luar scope lab.']);
            }
            try {
                $headers = json_decode($data['headers_json'], false, 32, JSON_THROW_ON_ERROR);
                $body = json_decode($data['body_json'], false, 32, JSON_THROW_ON_ERROR);
            } catch (\Throwable) {
                throw ValidationException::withMessages(['request' => 'Header dan body harus JSON valid.']);
            }
            if (! is_object($headers) || ! is_object($body)) {
                throw ValidationException::withMessages(['request' => 'Header dan body harus berupa objek JSON.']);
            }
            foreach ((array) $headers as $key => $value) {
                if (! in_array($key, ['X-Dummy-User', 'Content-Type', 'Authorization'], true) || ! is_string($value) || strlen($value) > 2048 || preg_match('/[\r\n\x00]/', $value)) {
                    throw ValidationException::withMessages(['headers' => 'Header ini tidak diizinkan pada sandbox.']);
                }
            }
            if (isset($headers->{'X-Dummy-User'}) && ! in_array($headers->{'X-Dummy-User'}, ['customer_a', 'customer_b', 'admin'], true)) {
                throw ValidationException::withMessages(['headers' => 'Pilih akun dummy yang tersedia.']);
            }
            if (isset($headers->{'Content-Type'}) && $headers->{'Content-Type'} !== 'application/json') {
                throw ValidationException::withMessages(['headers' => 'Gunakan Content-Type application/json.']);
            }
            $request = ['endpoint' => $data['endpoint'], 'method' => $data['method'], 'headers' => $headers, 'body' => $body, 'mode' => $data['mode']];
            $result = $this->runner->request($s, $request);
            abort_unless(is_int($result['status'] ?? null) && is_string($result['body'] ?? null) && strlen($result['body']) <= 32768 && ($result['generation'] ?? null) === $s->generation, 502, 'Format respons sandbox tidak valid.');
            $id = DB::table('lab_requests')->insertGetId(['lab_session_id' => $s->id, 'generation' => $s->generation, 'request' => json_encode($request), 'response' => json_encode($result), 'created_at' => now()]);

            return [...$result, 'history_id' => $id];
        });
    }

    public function history(LabSession $s): array
    {
        return DB::table('lab_requests')->where('lab_session_id', $s->id)->where('generation', $s->generation)->latest('id')->limit(20)->get()->map(fn ($row) => ['id' => $row->id, 'request' => json_decode($row->request, true), 'response' => json_decode($row->response, true), 'created_at' => $row->created_at])->all();
    }

    public function hints(User $user, Lab $lab, bool $unlock = false)
    {
        if ($unlock) {
            $next = $lab->hints()->whereNotIn('id', DB::table('lab_hint_usage')->where('user_id', $user->id)->pluck('lab_hint_id'))->first();
            if ($next) {
                DB::table('lab_hint_usage')->insertOrIgnore(['user_id' => $user->id, 'lab_hint_id' => $next->id, 'created_at' => now()]);
            }
        }

        return $lab->hints()->whereIn('id', DB::table('lab_hint_usage')->where('user_id', $user->id)->pluck('lab_hint_id'))->get(['level', 'body']);
    }

    public function catalog(User $user)
    {
        $progress = LabProgress::where('user_id', $user->id)->get()->keyBy('lab_id');
        $sessions = LabSession::where('user_id', $user->id)->get()->keyBy('lab_id');

        return Lab::with('category', 'lesson:id,slug,title')->orderBy('code')->get()->map(function ($l) use ($progress, $sessions) {
            $s = $sessions->get($l->id);
            $p = $progress->get($l->id);

            return ['id' => $l->id, 'slug' => $l->slug, 'code' => $l->code, 'title' => $l->title, 'category' => $l->category->name, 'difficulty' => $l->difficulty, 'minutes' => $l->minutes, 'points' => $l->points, 'objectives' => $l->objectives, 'lesson' => $l->lesson->only('id', 'slug', 'title'), 'status' => $p ? 'solved' : ($s ? 'in_progress' : 'not_started'), 'solved_at' => $p?->solved_at?->toIso8601String(), 'earned_xp' => $p?->points_awarded ?? 0, 'available' => $l->enabled && (bool) config('labs.enabled')];
        });
    }
}
