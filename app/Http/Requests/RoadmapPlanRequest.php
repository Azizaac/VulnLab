<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RoadmapPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'starts_on' => ['required', 'date_format:Y-m-d', 'after_or_equal:2000-01-01', 'before_or_equal:2099-09-30'],
            'timezone' => ['required', 'timezone:all'],
            'daily_goal_minutes' => ['required', 'integer', 'in:120'],
            'user_id' => ['prohibited'], 'status' => ['prohibited'],
        ];
    }
}
