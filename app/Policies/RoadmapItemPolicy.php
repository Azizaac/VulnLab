<?php

namespace App\Policies;

use App\Models\RoadmapItem;
use App\Models\User;

class RoadmapItemPolicy
{
    public function update(User $user, RoadmapItem $item): bool
    {
        return $item->day->plan->user_id === $user->id;
    }
}
