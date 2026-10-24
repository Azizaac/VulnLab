<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => mb_strtolower(trim((string) $this->email))]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'string', 'email', 'max:254', 'unique:users'],
            'password' => ['required', 'confirmed', Password::min(12)],
            'timezone' => ['required', 'timezone:all'],
            'role' => ['prohibited'],
            'starts_on' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:2000-01-01', 'before_or_equal:2099-09-30'],
            'daily_goal_minutes' => ['sometimes', 'integer', 'in:120'],
        ];
    }
}
