<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ItemStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isUpdate = $this->route('item') !== null;

        return [
            'category_id' => ['required', 'exists:categories,id'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('items', 'name')
                    ->ignore($this->route('item'))
                    ->where(
                        fn($query) => $query
                            ->where('category_id', $this->category_id)
                            ->whereRaw('LOWER(name) = ?', [strtolower($this->name ?? '')])
                    ),
            ],
            'unit' => ['required', 'string', 'max:255'],
            'unit_price' => $isUpdate
                ? ['prohibited']
                : ['required', 'numeric', 'min:0', 'regex:/^\d+(\.\d{1,2})?$/'],
            'current_stock' => $isUpdate
                ? ['prohibited']
                : ['required', 'integer', 'min:0'],
            'reorder_level' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'An item with the same name already exists in this category.',
            'unit_price.prohibited' => 'Unit price can only be changed via a stock movement or price adjustment.',
            'current_stock.prohibited' => 'Current stock can only be changed via Stock Movements.',
        ];
    }
}