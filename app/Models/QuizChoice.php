<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizChoice extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $hidden = ['is_correct', 'source_key'];

    protected function casts(): array
    {
        return ['is_correct' => 'boolean'];
    }
}
