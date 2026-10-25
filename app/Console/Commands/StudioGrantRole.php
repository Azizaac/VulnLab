<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AccountSecurity;
use App\Services\StudioAccess;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class StudioGrantRole extends Command
{
    protected $signature = 'studio:grant-role {user : Existing user ID or exact email} {role} {--confirm : Explicit operator confirmation}';

    protected $description = 'Protected local operator role bootstrap; never creates a password or public registration privilege';

    public function handle(AccountSecurity $security): int
    {
        if (! $this->option('confirm') || ! in_array($this->argument('role'), StudioAccess::ROLES)) {
            $this->error('Specify an existing user ID, learner/editor/reviewer/admin and --confirm.');

            return self::FAILURE;
        }
        DB::transaction(function () use ($security) {
            $admins = User::where('role', 'admin')->whereNull('suspended_at')->lockForUpdate()->get();
            $query = User::query();
            filter_var($this->argument('user'), FILTER_VALIDATE_EMAIL) ? $query->where('email', $this->argument('user')) : $query->whereKey($this->argument('user'));
            $user = $query->lockForUpdate()->firstOrFail();
            if ($user->role === 'admin' && ! $user->suspended_at && $this->argument('role') !== 'admin' && $admins->count() <= 1) {
                throw new \RuntimeException('Keep at least one active admin.');
            }
            $old = $user->role;
            $user->forceFill(['role' => $this->argument('role'), 'permission_grants' => []])->save();
            $security->invalidate($user);
            StudioAccess::audit(null, 'operator.role_granted', 'user', $user->id, ['from_role' => $old, 'to_role' => $user->role]);
        });
        $this->info('Role updated and prior sessions revoked. No account password was created.');

        return self::SUCCESS;
    }
}
