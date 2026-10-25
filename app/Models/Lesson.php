<?php

namespace App\Models;

use App\Models\Concerns\VisibleInCatalog;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use VisibleInCatalog;

    protected $guarded = ['id'];

    protected $hidden = ['source_snapshot'];

    protected function casts(): array
    {
        return ['enrichment' => 'array', 'source_snapshot' => 'array'];
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function sources()
    {
        return $this->hasMany(LessonSource::class)->where('catalog_active', true);
    }

    public function prerequisites()
    {
        return $this->belongsToMany(self::class, 'lesson_prerequisites', 'lesson_id', 'prerequisite_id');
    }

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class)->where('catalog_active', true);
    }

    public function labs()
    {
        return $this->hasMany(LabSpec::class);
    }
}
