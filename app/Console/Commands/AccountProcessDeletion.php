<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\StudioAccess;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AccountProcessDeletion extends Command
{
    protected $signature = 'account:process-deletion {request : Pending request UUID} {--confirm : Explicit operator confirmation after reviewing the request}';

    protected $description = 'Process exactly one requested account deletion after the seven-day cancellation period';

    public function handle(): int
    {
        if (! $this->option('confirm')) {
            $this->error('Review the pending request and pass --confirm.');

            return self::FAILURE;
        }
        $files = DB::transaction(function () {
            // Consistent user-before-request lock order matches cancellation and new requests.
            $candidate = DB::table('account_data_requests')->where('id', $this->argument('request'))->first();
            if (! $candidate) {
                throw new \RuntimeException('Pending request not found.');
            }
            $admins = User::where('role', 'admin')->whereNull('suspended_at')->lockForUpdate()->get();
            $user = User::whereKey($candidate->user_id)->lockForUpdate()->firstOrFail();
            $request = DB::table('account_data_requests')->where('id', $candidate->id)->lockForUpdate()->first();
            if (! $request || $request->kind !== 'deletion' || $request->status !== 'pending' || now()->lt($request->execute_after)) {
                throw new \RuntimeException('Request is cancelled, invalid, or still inside its grace period.');
            }
            if ($user->role === 'admin' && ! $user->suspended_at && $admins->count() <= 1) {
                throw new \RuntimeException('Transfer the last active admin role before deletion.');
            }
            if (DB::table('lab_sessions')->where('user_id', $user->id)->where('expires_at', '>', now())->whereIn('status', ['starting', 'running', 'solved'])->exists()) {
                throw new \RuntimeException('Stop active lab sessions or wait for their lease to expire before processing.');
            }
            $paths = DB::table('account_data_requests')->where('user_id', $user->id)->whereNotNull('path')->pluck('path')->all();
            $evidencePaths = DB::table('report_evidence')->whereIn('report_id', DB::table('vulnerability_reports')->where('user_id', $user->id)->select('id'))->pluck('path')->all();
            if ($user->avatar_path) {
                $paths[] = $user->avatar_path;
            }
            $paths = [...$paths, ...$evidencePaths];
            DB::table('sessions')->where('user_id', $user->id)->delete();
            StudioAccess::audit(null, 'operator.deletion_processed', 'user', $user->id, ['grace_period_days' => 7]);
            $user->delete();

            return $paths;
        });
        foreach ($files as $path) {
            Storage::disk('local')->delete($path);
        }
        $this->info('Requested account records and private files removed. Published content and anonymized editorial history retained.');

        return self::SUCCESS;
    }
}
