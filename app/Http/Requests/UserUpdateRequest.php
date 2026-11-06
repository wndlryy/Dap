<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // add real authorization logic if needed
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'username')->ignore($this->route('user')),
            ],
            'role' => ['required', 'in:admin,user,cashier,waiter,kitchen-staff'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ];
    }
}