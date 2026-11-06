<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DashboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'user'], true);
    }

    public function rules(): array
    {
        return [
            'range' => ['nullable', 'in:today,7d,30d'],
        ];
    }

    public function range(): string
    {
        return $this->validated('range') ?? '7d';
    }
}