<?php

namespace App\Policies;

use App\Models\LabSession;
use App\Models\User;

class LabSessionPolicy
{
    public function access(User $user, LabSession $session): bool
    {
        return $user->id === $session->user_id;
    }
}
