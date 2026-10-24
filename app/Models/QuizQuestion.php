<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizQuestion extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $hidden = ['explanation'];

    public function choices()
    {
        return $this->hasMany(QuizChoice::class);
    }
}
