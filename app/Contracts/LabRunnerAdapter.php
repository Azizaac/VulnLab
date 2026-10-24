<?php

namespace App\Contracts;

use App\Models\LabSession;

interface LabRunnerAdapter
{
    public function provision(LabSession $session): array;

    public function request(LabSession $session, array $request): array;

    public function evidence(LabSession $session): array;

    public function stop(LabSession $session): array;
}
