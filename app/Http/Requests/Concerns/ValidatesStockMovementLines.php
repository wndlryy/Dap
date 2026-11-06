<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Validation\Rule;


trait ValidatesStockMovementLines
{
    /**
     * @param bool $requireReason 
     *                       
     */
    protected function lineRules(bool $requireReason = false): array
    {
        return [
            'item_id' => ['required', Rule::exists('items', 'id')->whereNull('deleted_at')],
            'type' => ['required', 'in:in,out'],
            'quantity' => ['required', 'integer', 'min:1'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'reason' => [$requireReason ? 'required' : 'nullable', 'string', 'max:255'],
        ];
    }

    protected function lineMessages(bool $requireReason = false): array
    {
        $messages = [
            'item_id.required' => 'Please select an item.',
            'item_id.exists' => 'The selected item is invalid or has been removed.',
            'type.required' => 'Please choose Stock In or Stock Out.',
            'type.in' => 'Invalid movement type.',
            'quantity.required' => 'Please enter a quantity.',
            'quantity.integer' => 'Quantity must be a whole number.',
            'quantity.min' => 'Quantity must be at least 1.',
            'unit_price.numeric' => 'Unit price must be a number.',
            'unit_price.min' => 'Unit price cannot be negative.',
        ];

        if ($requireReason) {
            $messages['reason.required'] = 'Please provide a reason.';
        }

        return $messages;
    }


    protected function prefixRules(array $rules, string $prefix): array
    {
        $out = [];
        foreach ($rules as $key => $rule) {
            $out["{$prefix}{$key}"] = $rule;
        }
        return $out;
    }

 
    protected function prefixMessages(array $messages, string $prefix, string $suffix): array
    {
        $out = [];
        foreach ($messages as $key => $message) {
            $out["{$prefix}{$key}"] = rtrim($message, '.') . $suffix;
        }
        return $out;
    }


    protected function nullifyBlankUnitPrice(?string $value): ?string
    {
        return $value === '' ? null : $value;
    }
}