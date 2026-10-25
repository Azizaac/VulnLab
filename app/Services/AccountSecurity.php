<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AccountSecurity
{
    public function password(Request $request): void
    {
        $request->validate(['current_password' => 'required|string|max:512']);
        if (! Hash::check($request->input('current_password'), $request->user()->password)) {
            throw ValidationException::withMessages(['current_password' => 'Password saat ini tidak cocok.']);
        }
    }

    public function recent(Request $request): void
    {
        if ($request->filled('current_password')) {
            $this->password($request);
            $request->session()->put('account_confirmed_at', now()->timestamp);

            return;
        }
        if ((int) $request->session()->get('account_confirmed_at', 0) < now()->subMinutes(15)->timestamp) {
            throw ValidationException::withMessages(['current_password' => 'Konfirmasi password saat ini untuk tindakan ini.']);
        }
    }

    public function invalidate(User $user, ?Request $preserve = null): void
    {
        $user->forceFill(['auth_epoch' => $user->auth_epoch + 1, 'remember_token' => Str::random(60)])->save();
        DB::table('sessions')->where('user_id', $user->id)->when($preserve, fn ($q) => $q->where('id', '!=', $preserve->session()->getId()))->delete();
        if ($preserve) {
            $preserve->session()->put('auth_epoch', (int) $user->auth_epoch);
            $preserve->session()->forget('account_confirmed_at');
        }
    }

    public function changeRole(User $actor, User $target, string $role, bool $suspended, bool $publish): void
    {
        DB::transaction(function () use ($actor, $target, $role, $suspended, $publish) {
            // Serialize all operator changes on active admin rows to protect the last admin.
            $admins = User::where('role', 'admin')->whereNull('suspended_at')->lockForUpdate()->get();
            $target = User::whereKey($target->id)->lockForUpdate()->firstOrFail();
            if ($target->role === 'admin' && ! $target->suspended_at && ($role !== 'admin' || $suspended) && $admins->count() <= 1) {
                throw ValidationException::withMessages(['role' => 'Minimal satu admin aktif harus tetap tersedia.']);
            }
            if ($actor->id === $target->id && $target->role !== $role && $role === 'admin') {
                abort(403);
            }
            $oldRole = $target->role;
            $target->forceFill(['role' => $role, 'suspended_at' => $suspended ? now() : null, 'permission_grants' => $role === 'reviewer' && $publish ? ['content.publish'] : []])->save();
            $this->invalidate($target);
            StudioAccess::audit($actor, 'user.access_changed', 'user', $target->id, ['from_role' => $oldRole, 'to_role' => $role, 'suspended' => $suspended, 'publish_grant' => $publish && $role === 'reviewer']);
            StudioAccess::notify($target, 'security', 'Izin atau status akun diperbarui oleh administrator.', '/settings/security');
        });
    }
}
