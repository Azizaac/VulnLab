<?php

namespace App\Services;

use App\Contracts\LabRunnerAdapter;
use App\Models\LabSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class LabResetService
{
    public function __construct(private LabService $service, private LabRunnerAdapter $runner) {}

    public function reset(LabSession $s, int $generation): LabSession
    {
        $s = DB::transaction(function () use ($s, $generation) {
            User::whereKey($s->user_id)->lockForUpdate()->firstOrFail();
            $s = LabSession::whereKey($s->id)->lockForUpdate()->firstOrFail();
            Gate::authorize('access', $s);
            $this->service->enabled($s->lab);
            abort_if($s->generation !== $generation, 409, 'Sesi sudah berubah. Muat ulang.');
            $this->service->rotate($s, $s->generation + 1);

            return $s;
        });

        return $this->service->provision($s);
    }

    public function stop(LabSession $s, int $generation): void
    {
        DB::transaction(function () use ($s, $generation) {
            $s = LabSession::whereKey($s->id)->lockForUpdate()->firstOrFail();
            $this->service->active($s, $generation);
            $this->runner->stop($s);
            $s->update(['status' => 'stopped']);
        });
    }
}
