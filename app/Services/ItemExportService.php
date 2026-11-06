<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Item;
use App\Models\StockMovement;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ItemExportService
{
    public function getEndingInventoryItems(string $search, string $category, Carbon $periodEnd): Collection
    {
        $items = Item::query()
            ->with(['category' => fn($q) => $q->withTrashed()])
            ->when($search, fn($q) => $q->where('name', 'like', "%{$search}%"))
            ->when($category && $category !== 'all', fn($q) => $q->where('category_id', $category))
            ->orderBy('name')
            ->get();

        return $this->applyEndingStock($items, $periodEnd);
    }

    public function categoryName(string $category): string
    {
        if (!$category || $category === 'all') {
            return 'All Categories';
        }

        return Category::withTrashed()->find($category)?->name ?? 'Unknown Category';
    }

    public function resolvePeriod(string $type, array $validated): array
    {
        if ($type === 'day') {
            $pickedDate = Carbon::parse($validated['date']);
            $periodStart = $pickedDate->copy()->startOfDay();
            $periodEnd = $pickedDate->copy()->endOfDay();

            return [
                'periodStart' => $periodStart,
                'periodEnd' => $periodEnd,
                'reportTitle' => 'DAILY ENDING INVENTORY REPORT',
                'downloadName' => "daily-inventory-{$periodStart->format('Y-m-d')}.pdf",
            ];
        }

        if ($type === 'week') {
            $pickedDate = Carbon::parse($validated['date']);
            $periodStart = $pickedDate->copy()->startOfWeek(Carbon::MONDAY);
            $periodEnd = $pickedDate->copy()->endOfWeek(Carbon::SUNDAY);

            return [
                'periodStart' => $periodStart,
                'periodEnd' => $periodEnd,
                'reportTitle' => 'WEEKLY ENDING INVENTORY REPORT',
                'downloadName' => "weekly-inventory-{$periodStart->format('Y-m-d')}.pdf",
            ];
        }

        $periodEnd = Carbon::createFromFormat('Y-m', $validated['month'])->endOfMonth();
        $periodStart = $periodEnd->copy()->startOfMonth();

        return [
            'periodStart' => $periodStart,
            'periodEnd' => $periodEnd,
            'reportTitle' => 'MONTHLY ENDING INVENTORY REPORT',
            'downloadName' => "ending-inventory-{$validated['month']}.pdf",
        ];
    }

    public function formatPeriod(Carbon $periodStart, Carbon $periodEnd): array
    {
        $sameDay = $periodStart->isSameDay($periodEnd);
        $sameMonth = $periodStart->isSameMonth($periodEnd);

        return [
            'periodStart' => $sameDay
                ? $periodStart->format('F j, Y')
                : ($sameMonth ? $periodStart->format('F j') : $periodStart->format('F j, Y')),
            'periodEnd' => $sameDay
                ? $periodStart->format('F j, Y')
                : ($sameMonth ? $periodEnd->format('j, Y') : $periodEnd->format('F j, Y')),
        ];
    }

    private function applyEndingStock(Collection $items, Carbon $periodEnd): Collection
    {
        $itemIds = $items->pluck('id');

        $movementSums = StockMovement::whereIn('item_id', $itemIds)
            ->where('moved_at', '<=', $periodEnd)
            ->selectRaw('item_id, type, SUM(quantity) as qty')
            ->groupBy('item_id', 'type')
            ->get()
            ->groupBy('item_id');

        $latestAverageCosts = StockMovement::whereIn('item_id', $itemIds)
            ->where('moved_at', '<=', $periodEnd)
            ->whereNotNull('average_cost_snapshot')
            ->orderBy('item_id')
            ->orderByDesc('id')
            ->get(['item_id', 'average_cost_snapshot'])
            ->groupBy('item_id')
            ->map(fn($rows) => $rows->first()->average_cost_snapshot);

        return $items->map(function ($item) use ($movementSums, $latestAverageCosts) {
            $itemSums = $movementSums->get($item->id, collect());

            $inflow = optional($itemSums->firstWhere('type', 'in'))->qty ?? 0;
            $outflow = optional($itemSums->firstWhere('type', 'out'))->qty ?? 0;

            $item->ending_stock = $inflow - $outflow;
            $item->average_cost_as_of_period = $latestAverageCosts->get($item->id) ?? $item->unit_price;

            return $item;
        });
    }
}