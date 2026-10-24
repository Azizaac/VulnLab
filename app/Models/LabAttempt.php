<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabAttempt extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['success' => 'boolean', 'created_at' => 'datetime'];
    }
}
