<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrderItemsUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->route('order')->kitchen_status === 'pending';
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('menu_items', 'id')->where('is_available', true),
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}