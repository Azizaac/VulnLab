<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoadmapDay extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['scheduled_on' => 'date', 'source_actions' => 'array'];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(RoadmapPlan::class, 'plan_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RoadmapItem::class)->orderBy('sort_order');
    }
}
