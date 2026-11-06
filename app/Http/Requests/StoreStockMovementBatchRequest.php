<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesStockMovementLines;
use Illuminate\Foundation\Http\FormRequest;

class StoreStockMovementBatchRequest extends FormRequest
{
    use ValidatesStockMovementLines;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $movements = collect($this->input('movements', []))
            ->map(fn ($line) => [
                ...$line,
                'unit_price' => $this->nullifyBlankUnitPrice($line['unit_price'] ?? null),
            ])
            ->all();

        $this->merge(['movements' => $movements]);
    }

    public function rules(): array
    {
        return [
            'moved_at' => ['required', 'date'],
            'movements' => ['required', 'array', 'min:1'],
            ...$this->prefixRules($this->lineRules(requireReason: true), 'movements.*.'),
        ];
    }

    public function messages(): array
    {
        return [
            'moved_at.required' => 'Please choose a date and time.',
            'moved_at.date' => 'That date and time is invalid.',
            'movements.required' => 'Add at least one movement line.',
            'movements.min' => 'Add at least one movement line.',
            ...$this->prefixMessages(
                $this->lineMessages(requireReason: true),
                'movements.*.',
                ' for line #:position.'
            ),
        ];
    }
}