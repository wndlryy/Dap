<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesStockMovementLines;
use Illuminate\Foundation\Http\FormRequest;

class StoreStockMovementRequest extends FormRequest
{
    use ValidatesStockMovementLines;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'unit_price' => $this->nullifyBlankUnitPrice($this->input('unit_price')),
        ]);
    }

    public function rules(): array
    {
        return [
            ...$this->lineRules(),
            'moved_at' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return $this->lineMessages();
    }
}