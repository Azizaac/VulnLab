<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class XpTransaction extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['granted_at' => 'immutable_datetime', 'context_json' => 'array', 'amount' => 'integer'];
    }
}
