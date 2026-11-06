<?php

namespace App\Observers;

use App\Models\Item;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;

class ItemObserver
{
    public function created(Item $item): void
    {
        if ($item->current_stock <= 0) {
            return;
        }

        StockMovement::create([
            'item_id' => $item->id,
            'type' => 'in',
            'quantity' => $item->current_stock,
            'unit_price' => $item->unit_price,
            'average_cost_snapshot' => $item->average_cost ?? $item->unit_price,
            'reason' => 'Initial Stock',
            'user_id' => Auth::id(),
            'moved_at' => $item->created_at,
        ]);
    }
}
