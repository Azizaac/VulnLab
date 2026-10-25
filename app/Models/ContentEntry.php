<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentEntry extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['is_archived' => 'boolean', 'is_managed' => 'boolean'];
    }

    public function revisions()
    {
        return $this->hasMany(ContentRevision::class)->orderByDesc('number');
    }

    public function published()
    {
        return $this->belongsTo(ContentRevision::class, 'published_revision_id');
    }
}
