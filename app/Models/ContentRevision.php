<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentRevision extends Model
{
    protected $attributes = ['lock_version' => 1, 'status' => 'draft'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['data_json' => 'array', 'published_at' => 'datetime', 'lock_version' => 'integer'];
    }

    public function entry()
    {
        return $this->belongsTo(ContentEntry::class, 'content_entry_id');
    }
}
