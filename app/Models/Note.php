<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    protected $guarded = ['id', 'user_id'];

    protected function casts(): array
    {
        return ['pinned' => 'boolean'];
    }

    public function tags()
    {
        return $this->hasMany(NoteTag::class)->orderBy('id');
    }
}
