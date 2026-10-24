<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportEvaluation extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['scores_json' => 'array', 'feedback_json' => 'array', 'report_version' => 'integer', 'evaluated_at' => 'datetime'];
    }
}
