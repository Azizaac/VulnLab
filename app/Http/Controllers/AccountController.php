<?php

namespace App\Http\Controllers;

use App\Services\AccountSecurity;
use App\Services\ProgressService;
use App\Services\ReportRedactor;
use App\Services\StudioAccess;
use App\Support\UtcPayload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function profile(Request $r, ProgressService $progress)
    {
        return Inertia::render('Profile', ['profile' => $this->profileData($r), 'progress' => $progress->overview($r->user()), 'recentActivity' => ($r->user()->account_preferences['show_activity'] ?? true) ? DB::table('learning_activity_events')->where('user_id', $r->user()->id)->latest('occurred_at')->limit(5)->get(['event_type', 'occurred_at'])->map(fn ($row) => UtcPayload::row($row)) : null]);
    }

    private function profileData(Request $r): array
    {
        return [...$r->user()->only('name', 'username', 'bio', 'email', 'timezone', 'locale', 'theme', 'density', 'reduced_motion', 'created_at', 'role'), 'avatar_url' => $r->user()->avatar_path ? '/profile/avatar?v='.$r->user()->updated_at->timestamp : null, 'email_verified' => (bool) $r->user()->email_verified_at];
    }

    public function settings(Request $r, string $section = 'general')
    {
        abort_unless(in_array($section, ['general', 'appearance', 'notifications', 'security', 'privacy', 'data']), 404);

        return Inertia::render('Settings', [
            'section' => $section, 'profile' => $this->profileData($r), 'preferences' => $r->user()->account_preferences ?? [],
            'timezones' => timezone_identifiers_list(),
            'sessions' => DB::table('sessions')->where('user_id', $r->user()->id)->orderByDesc('last_activity')->get()->map(fn ($s) => ['device' => $this->device($s->user_agent ?? ''), 'current' => hash_equals($s->id, $r->session()->getId()), 'last_active' => date(DATE_ATOM, $s->last_activity)]),
            'securityEvents' => DB::table('studio_audit_events')->where(fn ($q) => $q->where('actor_id', $r->user()->id)->orWhere(fn ($q) => $q->where('subject_type', 'user')->where('subject_id', $r->user()->id)))->where('action', 'like', '%.%')->latest('id')->limit(15)->get(['action', 'created_at'])->map(fn ($row) => UtcPayload::row($row)),
            'dataRequests' => DB::table('account_data_requests')->where('user_id', $r->user()->id)->orderByRaw("CASE WHEN kind = 'deletion' AND status = 'pending' THEN 0 ELSE 1 END")->latest('created_at')->limit(10)->get(['id', 'kind', 'status', 'expires_at', 'execute_after', 'created_at'])->map(function ($row) {
                $row->download_url = $row->kind === 'export' && $row->status === 'ready' && now()->lt($row->expires_at) ? URL::temporarySignedRoute('account.export', now()->addHours(1), ['id' => $row->id]) : null;

                return UtcPayload::row($row);
            }),
        ]);
    }

    private function device(string $agent): string
    {
        $browser = str_contains($agent, 'Edg/') ? 'Edge' : (str_contains($agent, 'Firefox/') ? 'Firefox' : (str_contains($agent, 'Chrome/') ? 'Chrome' : (str_contains($agent, 'Safari/') ? 'Safari' : 'Browser')));

        return $browser.' · '.(preg_match('/Android|iPhone|iPad/i', $agent) ? 'Perangkat mobile' : 'Komputer');
    }

    public function save(Request $r, string $section)
    {
        $rules = match ($section) {
            'general' => ['name' => 'required|string|min:2|max:60', 'username' => ['nullable', 'string', 'regex:/^[a-z0-9_]{3,24}$/', Rule::notIn(['admin', 'administrator', 'root', 'support', 'vulnlab', 'studio', 'settings', 'security', 'api', 'system', 'moderator']), Rule::unique('users')->ignore($r->user()->id)], 'bio' => 'nullable|string|max:280', 'timezone' => 'required|timezone:all', 'locale' => 'required|in:id'],
            'appearance' => ['theme' => 'required|in:system,light,dark', 'density' => 'required|in:comfortable,compact', 'reduced_motion' => 'required|boolean'],
            'notifications' => ['content_updates' => 'required|boolean'],
            'privacy' => ['show_activity' => 'required|boolean'],
            default => abort(404),
        };
        $this->only($r, array_keys($rules));
        $data = $r->validate($rules, ['username.regex' => 'Gunakan 3–24 huruf kecil, angka, atau underscore.', 'username.unique' => 'Username sudah digunakan.', 'username.not_in' => 'Username ini dicadangkan.', 'locale.in' => 'Bahasa yang tersedia saat ini adalah Bahasa Indonesia.']);
        if (in_array($section, ['notifications', 'privacy'])) {
            $data = ['account_preferences' => [...($r->user()->account_preferences ?? []), ...$data]];
        }
        $r->user()->forceFill($data)->save();

        return response()->json(['message' => 'Perubahan tersimpan.', 'profile' => $this->profileData($r)]);
    }

    private function only(Request $r, array $keys): void
    {
        if (array_diff(array_keys($r->all()), [...$keys, '_token', '_method'])) {
            throw ValidationException::withMessages(['form' => 'Permintaan memuat field yang tidak diizinkan.']);
        }
    }

    public function avatar(Request $r)
    {
        abort_unless($r->user()->avatar_path && Storage::disk('local')->exists($r->user()->avatar_path), 404);

        return response(Storage::disk('local')->get($r->user()->avatar_path))->header('Content-Type', 'image/png')->header('X-Content-Type-Options', 'nosniff')->header('Cache-Control', 'private, no-cache');
    }

    public function uploadAvatar(Request $r)
    {
        $this->only($r, ['avatar']);
        $r->validate(['avatar' => 'required|file|max:2048|mimetypes:image/jpeg,image/png,image/webp']);
        $bytes = file_get_contents($r->file('avatar')->getRealPath());
        $size = @getimagesizefromstring($bytes);
        if (! $size || ! in_array($size['mime'], ['image/jpeg', 'image/png', 'image/webp']) || $size[0] > 4096 || $size[1] > 4096 || $size[0] * $size[1] > 8000000 || preg_match('/<\?(?:php|=)|<script|<svg|<html/i', $bytes)) {
            throw ValidationException::withMessages(['avatar' => 'Gunakan gambar PNG, JPG, atau WebP asli, maksimal 4096 × 4096 piksel.']);
        }
        abort_unless(function_exists('imagecreatefromstring'), 503, 'Pemroses gambar belum tersedia.');
        $source = @imagecreatefromstring($bytes);
        if (! $source) {
            throw ValidationException::withMessages(['avatar' => 'Gambar tidak dapat dibaca.']);
        }
        $scale = min(1, 512 / max($size[0], $size[1]));
        $normalized = imagescale($source, max(1, (int) ($size[0] * $scale)), max(1, (int) ($size[1] * $scale)));
        ob_start();
        imagepng($normalized);
        $png = ob_get_clean();
        imagedestroy($source);
        imagedestroy($normalized);
        $path = 'avatars/'.$r->user()->id.'/'.Str::uuid().'.png';
        Storage::disk('local')->put($path, $png);
        $old = $r->user()->avatar_path;
        $r->user()->forceFill(['avatar_path' => $path])->save();
        if ($old) {
            Storage::disk('local')->delete($old);
        }

        return response()->json(['avatar_url' => '/profile/avatar?v='.Str::random(8)]);
    }

    public function reauthenticate(Request $r, AccountSecurity $security)
    {
        $security->password($r);
        $r->session()->put('account_confirmed_at', now()->timestamp);

        return response()->json(['message' => 'Identitas dikonfirmasi selama 15 menit.']);
    }

    public function password(Request $r, AccountSecurity $security)
    {
        $this->only($r, ['current_password', 'password', 'password_confirmation']);
        $r->validate(['password' => 'required|string|min:12|max:128|confirmed|different:current_password']);
        $security->password($r);
        DB::transaction(function () use ($r, $security) {
            $r->user()->forceFill(['password' => $r->input('password')])->save();
            $security->invalidate($r->user(), $r);
            StudioAccess::audit($r->user(), 'account.password_changed', 'user', $r->user()->id);
            StudioAccess::notify($r->user(), 'security', 'Password diperbarui dan sesi lain dihentikan.', '/settings/security');
        });

        return response()->json(['message' => 'Password diperbarui. Sesi lain dihentikan.']);
    }

    public function revoke(Request $r, AccountSecurity $security)
    {
        $security->recent($r);
        $security->invalidate($r->user(), $r);
        StudioAccess::audit($r->user(), 'account.sessions_revoked', 'user', $r->user()->id);

        return response()->json(['message' => 'Semua sesi lain dihentikan.']);
    }

    public function export(Request $r, AccountSecurity $security, ReportRedactor $redactor)
    {
        $security->recent($r);
        $data = ['format' => 'VulnLab private export v1', 'exported_at' => now()->toIso8601String(), 'profile' => $this->profileData($r), 'preferences' => $r->user()->account_preferences ?? []];
        $columns = [
            'notes' => ['id', 'title', 'body_md', 'created_at', 'updated_at'],
            'vulnerability_reports' => ['id', 'title', 'status', 'severity', 'body_json', 'created_at', 'updated_at'],
            'lesson_progress' => ['lesson_id', 'read_at', 'quiz_passed_at', 'completed_at'],
            'quiz_attempts' => ['lesson_id', 'score', 'passed', 'created_at'],
            'lab_progress' => ['lab_id', 'solved_at', 'points_awarded'],
            'learning_activity_events' => ['event_type', 'subject_type', 'subject_id', 'occurred_at'],
        ];
        foreach ($columns as $table => $fields) {
            $fields = array_values(array_intersect($fields, Schema::getColumnListing($table)));
            $data[$table] = DB::table($table)->where('user_id', $r->user()->id)->get($fields)->map(fn ($row) => array_map(fn ($value) => is_string($value) ? $redactor->redact($value) : $value, (array) $row))->all();
        }
        $plan = DB::table('roadmap_plans')->where('user_id', $r->user()->id)->first();
        $data['roadmap'] = $plan ? DB::table('roadmap_days')->where('plan_id', $plan->id)->get(['id', 'day_number', 'scheduled_on', 'title'])->map(fn ($day) => [...(array) $day, 'items' => DB::table('roadmap_items')->where('roadmap_day_id', $day->id)->get(['title', 'status', 'completed_at'])]) : [];
        $id = (string) Str::uuid();
        $path = 'account-exports/'.$id.'.json';
        Storage::disk('local')->put($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        DB::table('account_data_requests')->insert(['id' => $id, 'user_id' => $r->user()->id, 'kind' => 'export', 'status' => 'ready', 'path' => $path, 'expires_at' => now()->addDay(), 'created_at' => now(), 'updated_at' => now()]);
        StudioAccess::audit($r->user(), 'account.export_ready', 'user', $r->user()->id);

        return response()->json(['message' => 'Ekspor siap. Tautan pribadi berlaku maksimal 24 jam.', 'download_url' => URL::temporarySignedRoute('account.export', now()->addHour(), ['id' => $id])]);
    }

    public function download(Request $r, string $id)
    {
        $row = DB::table('account_data_requests')->where('id', $id)->where('user_id', $r->user()->id)->where('kind', 'export')->where('status', 'ready')->where('expires_at', '>', now())->first();
        abort_unless($row && Storage::disk('local')->exists($row->path), 404);

        return Storage::disk('local')->download($row->path, 'vulnlab-data.json', ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    public function deleteRequest(Request $r, AccountSecurity $security)
    {
        $security->password($r);
        $r->validate(['confirmation' => 'required|in:DELETE']);
        DB::transaction(function () use ($r) {
            DB::table('users')->where('id', $r->user()->id)->lockForUpdate()->first();
            if (! DB::table('account_data_requests')->where('user_id', $r->user()->id)->where('kind', 'deletion')->where('status', 'pending')->exists()) {
                DB::table('account_data_requests')->insert(['id' => (string) Str::uuid(), 'user_id' => $r->user()->id, 'kind' => 'deletion', 'status' => 'pending', 'execute_after' => now()->addDays(7), 'created_at' => now(), 'updated_at' => now()]);
                StudioAccess::audit($r->user(), 'account.deletion_requested', 'user', $r->user()->id);
            }
        });

        return response()->json(['message' => 'Permintaan dicatat. Kamu dapat membatalkan selama 7 hari sebelum pemrosesan operator.']);
    }

    public function cancelDeletion(Request $r)
    {
        DB::transaction(function () use ($r) {
            DB::table('users')->where('id', $r->user()->id)->lockForUpdate()->first();
            DB::table('account_data_requests')->where('user_id', $r->user()->id)->where('kind', 'deletion')->where('status', 'pending')->update(['status' => 'cancelled', 'updated_at' => now()]);
        });
        StudioAccess::audit($r->user(), 'account.deletion_cancelled', 'user', $r->user()->id);

        return response()->json(['message' => 'Permintaan penghapusan dibatalkan.']);
    }

    public function notifications(Request $r)
    {
        return Inertia::render('Notifications', ['notifications' => DB::table('account_notifications')->where('user_id', $r->user()->id)->latest('id')->paginate(20)->through(fn ($row) => UtcPayload::row($row))]);
    }

    public function readNotification(Request $r, int $id)
    {
        $row = DB::table('account_notifications')->where('user_id', $r->user()->id)->where('id', $id)->first();
        abort_unless($row, 404);
        DB::table('account_notifications')->where('id', $row->id)->update(['read_at' => now()]);

        return back()->with('success', 'Notifikasi ditandai dibaca.');
    }
}
