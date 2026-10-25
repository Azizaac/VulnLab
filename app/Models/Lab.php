<?php

namespace App\Models;

use App\Models\Concerns\VisibleInCatalog;
use Illuminate\Database\Eloquent\Model;

class Lab extends Model
{
    use VisibleInCatalog;

    protected $guarded = ['id'];

    protected $hidden = ['solution_md', 'secure_code'];

    protected function casts(): array
    {
        return ['objectives' => 'array', 'sources' => 'array', 'default_body' => 'array', 'default_headers' => 'array', 'enabled' => 'boolean'];
    }

    public function category()
    {
        return $this->belongsTo(LabCategory::class, 'lab_category_id');
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class)->withoutGlobalScopes();
    }

    public function instructions()
    {
        return $this->hasMany(LabInstruction::class)->orderBy('position');
    }

    public function hints()
    {
        return $this->hasMany(LabHint::class)->orderBy('level');
    }
}
