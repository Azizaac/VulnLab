<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabProgress extends Model
{
    protected $table = 'lab_progress';

    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['solved_at' => 'datetime'];
    }
}
