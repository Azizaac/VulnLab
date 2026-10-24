<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Phase extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    public function weeks(): HasMany
    {
        return $this->hasMany(Week::class)->orderBy('week_number');
    }
}
