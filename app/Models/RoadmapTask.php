<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoadmapTask extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    public function prerequisite(): BelongsTo
    {
        return $this->belongsTo(self::class, 'prerequisite_task_id');
    }
}
