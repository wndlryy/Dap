<?php

namespace App\Services;

use App\Models\Item;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;


class StockMovementService
{
    public function store(array $data, int $userId): void
    {
        DB::transaction(function () use ($data, $userId) {
            $this->applyMovement($data, $userId, $data['moved_at'] ?? now());
        });
    }

    public function storeBatch(array $data, int $userId): void
    {
        $sortedMovements = collect($data['movements'])
            ->sortBy('item_id')
            ->values()
            ->all();

        DB::transaction(function () use ($sortedMovements, $data, $userId) {
            foreach ($sortedMovements as $line) {
                $this->applyMovement($line, $userId, $data['moved_at']);
            }
        });
    }


    private function applyMovement(array $data, int $userId, string|\DateTimeInterface $movedAt): void
    {
        $item = Item::lockForUpdate()->findOrFail($data['item_id']);
        $quantity = $data['quantity'];

        if ($data['type'] === 'out' && $quantity > $item->current_stock) {
            throw ValidationException::withMessages([
                'quantity' => "Only {$item->current_stock} {$item->unit} in stock.",
            ]);
        }

        if ($data['type'] === 'in') {
            [$unitPrice, $averageCost] = $this->recalculateIncomingPricing(
                $item,
                $quantity,
                $data['unit_price'] ?? $item->unit_price
            );
            $item->unit_price = $unitPrice;
            $item->average_cost = $averageCost;
            $snapshotPrice = $unitPrice;
            $averageSnapshot = $averageCost;
        } else {
            $snapshotPrice = $item->average_cost ?? $item->unit_price;
            $averageSnapshot = $snapshotPrice;
        }

        StockMovement::create([
            'item_id' => $item->id,
            'type' => $data['type'],
            'quantity' => $quantity,
            'unit_price' => $snapshotPrice,
            'average_cost_snapshot' => $averageSnapshot,
            'reason' => $data['reason'] ?? null,
            'user_id' => $userId,
            'moved_at' => $movedAt,
        ]);

        $item->current_stock += $data['type'] === 'in' ? $quantity : -$quantity;
        $item->save();
    }


    private function recalculateIncomingPricing(Item $item, int $quantity, float $incomingPrice): array
    {
        $currentQty = $item->current_stock;
        $currentAvg = $item->average_cost ?? $item->unit_price;

        $averageCost = $currentQty > 0
            ? round((($currentQty * $currentAvg) + ($quantity * $incomingPrice)) / ($currentQty + $quantity), 2)
            : round($incomingPrice, 2);

        return [round($incomingPrice, 2), $averageCost];
    }
}
