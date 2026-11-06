<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'order_id',
        'payment_method',
        'amount',
        'reference_number',
        'user_id',
        'processed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'processed_at' => 'datetime',
    ];


    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public const METHODS = ['cash', 'gcash'];
}
