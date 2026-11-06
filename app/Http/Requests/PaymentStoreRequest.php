<?php

namespace App\Http\Requests;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PaymentStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'payment_method' => ['required', Rule::in(Payment::METHODS)],
            'reference_number' => [
                Rule::requiredIf(fn() => $this->input('payment_method') !== 'cash'),
                'nullable',
                'string',
                'max:100',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'reference_number.required' => 'Enter the reference number for this payment.',
        ];
    }
}
