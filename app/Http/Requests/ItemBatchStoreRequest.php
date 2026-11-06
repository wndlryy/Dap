<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ItemBatchStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'items' => ['required', 'array', 'min:1'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.unit' => ['required', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.current_stock' => ['required', 'integer', 'min:0'],
            'items.*.reorder_level' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.required' => 'Please select a category.',
            'category_id.exists' => 'That category no longer exists.',
            'items.required' => 'Add at least one item.',
            'items.min' => 'Add at least one item.',
            'items.*.name.required' => 'Item #:position: name is required.',
            'items.*.name.max' => 'Item #:position: name is too long.',
            'items.*.unit.required' => 'Item #:position: unit is required.',
            'items.*.unit.max' => 'Item #:position: unit is too long.',
            'items.*.unit_price.required' => 'Item #:position: unit price is required.',
            'items.*.unit_price.numeric' => 'Item #:position: unit price must be a number.',
            'items.*.unit_price.min' => 'Item #:position: unit price cannot be negative.',
            'items.*.current_stock.required' => 'Item #:position: stock is required.',
            'items.*.current_stock.integer' => 'Item #:position: stock must be a whole number.',
            'items.*.current_stock.min' => 'Item #:position: stock cannot be negative.',
            'items.*.reorder_level.required' => 'Item #:position: reorder level is required.',
            'items.*.reorder_level.integer' => 'Item #:position: reorder level must be a whole number.',
            'items.*.reorder_level.min' => 'Item #:position: reorder level cannot be negative.',
        ];
    }
}