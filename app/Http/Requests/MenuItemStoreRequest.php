<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MenuItemStoreRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_available' => $this->boolean('is_available'),
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $menuItem = $this->route('menu_item') ?? $this->route('menuItem');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('menu_items', 'name')->ignore($menuItem?->id ?? $menuItem),
            ],
            'menu_category_id' => 'required|exists:menu_categories,id',
            'price' => 'required|numeric|min:0',
            'is_available' => 'required|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];
    }
}