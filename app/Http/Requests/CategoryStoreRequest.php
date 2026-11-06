<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

class CategoryStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    if (Category::withTrashed()->whereRaw('LOWER(name) = ?', [strtolower($value)])->exists()) {
                        $fail('A category with this name already exists.');
                    }
                },
            ],
        ];
    }



    public function messages(): array
    {
        return [
            'name.unique' => 'A category with this name already exists.',
        ];
    }
}
