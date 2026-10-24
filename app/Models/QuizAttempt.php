<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['feedback' => 'array', 'passed' => 'boolean', 'created_at' => 'datetime'];
    }
}
