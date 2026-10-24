<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearningActivityEvent extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['occurred_at' => 'immutable_datetime', 'metadata_json' => 'array'];
    }
}
