<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportEvidence extends Model
{
    protected $table = 'report_evidence';

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $hidden = ['path', 'disk'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime', 'size' => 'integer'];
    }
}
