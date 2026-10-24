<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessonProgress extends Model
{
    protected $table = 'lesson_progress';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime', 'quiz_passed_at' => 'datetime', 'completed_at' => 'datetime'];
    }
}
