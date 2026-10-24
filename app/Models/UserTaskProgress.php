<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserTaskProgress extends Model
{
    protected $table = 'user_task_progress';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['completed_at' => 'datetime'];
    }
}
