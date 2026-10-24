<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoadmapPlan extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['starts_on' => 'date'];
    }

    public function days(): HasMany
    {
        return $this->hasMany(RoadmapDay::class, 'plan_id')->orderBy('day_number');
    }
}
