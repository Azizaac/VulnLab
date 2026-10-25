<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabSession extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $hidden = ['capability', 'flag_secret', 'flag_hash'];

    protected function casts(): array
    {
        return ['capability' => 'encrypted', 'flag_secret' => 'encrypted', 'fixtures' => 'array', 'started_at' => 'datetime', 'expires_at' => 'datetime', 'solved_at' => 'datetime'];
    }

    public function lab()
    {
        return $this->belongsTo(Lab::class)->withoutGlobalScopes();
    }
}
