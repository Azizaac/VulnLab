<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserTaskProgress;

class UserTaskProgressPolicy
{
    public function update(User $user, UserTaskProgress $progress): bool
    {
        return $user->id === $progress->user_id;
    }
}
