<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = "orders";

    protected $fillable = [
        'user_id',
        'kitchen_status',
        'payment_status',
        'sub_total',
        'total',
    ];

    protected $casts = [
        'sub_total' => 'decimal:2',
        'total' => 'decimal:2',
    ];


    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function calculateSubTotal(): float
    {
        return $this->items->sum(fn($item) => $item->quantity * $item->price_at_time);
    }

    public function payments()
{
    return $this->hasMany(Payment::class, 'order_id');
}
}
