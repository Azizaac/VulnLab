<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TaskProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['in_progress', 'completed'])],
            'user_id' => ['prohibited'],
            'xp_awarded' => ['prohibited'],
            'completed_at' => ['prohibited'],
        ];
    }
}
