<?php

namespace App\Services;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    private const STATUSES = ['pending', 'preparing', 'ready', 'served', 'cancelled'];

    public function stats(string $range): array
    {
        $start = $this->start($range);

        $orders = DB::table('orders')
            ->whereNull('deleted_at')
            ->where('created_at', '>=', $start)
            ->where('kitchen_status', '!=', 'cancelled');

        $orderCount = (clone $orders)->count();
        $orderTotal = (float) (clone $orders)->sum('total');
        $unpaid = (float) (clone $orders)->where('payment_status', 'unpaid')->sum('total');
        $revenue = (float) DB::table('payments')->where('processed_at', '>=', $start)->sum('amount');

        return [
            'revenue' => $revenue,
            'orders' => $orderCount,
            'average_order' => $orderCount > 0 ? round($orderTotal / $orderCount, 2) : 0,
            'unpaid' => $unpaid,
        ];
    }

    public function charts(string $range): array
    {
        $start = $this->start($range);

        return [
            'sales_by_day' => $this->salesByDay($start),
            'orders_by_status' => $this->ordersByStatus($start),
            'top_items' => $this->topItems($start),
            'payment_methods' => $this->paymentMethods($start),
        ];
    }

    public function inventory(): array
    {
        $items = DB::table('items')->whereNull('deleted_at');

        $summary = (clone $items)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('COALESCE(SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END), 0) as out_of_stock')
            ->selectRaw('COALESCE(SUM(CASE WHEN current_stock > 0 AND current_stock <= reorder_level THEN 1 ELSE 0 END), 0) as low')
            ->selectRaw('COALESCE(SUM(current_stock * COALESCE(average_cost, unit_price)), 0) as stock_value')
            ->first();

        $lowStock = DB::table('items')
            ->leftJoin('categories', 'categories.id', '=', 'items.category_id')
            ->whereNull('items.deleted_at')
            ->whereColumn('items.current_stock', '<=', 'items.reorder_level')
            ->orderBy('items.current_stock')
            ->limit(8)
            ->get([
                'items.id',
                'items.name',
                'items.unit',
                'items.current_stock',
                'items.reorder_level',
                'categories.name as category',
            ])
            ->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'unit' => $r->unit,
                'current_stock' => (int) $r->current_stock,
                'reorder_level' => (int) $r->reorder_level,
                'category' => $r->category,
            ])
            ->all();

        $movements = DB::table('stock_movements')
            ->join('items', 'items.id', '=', 'stock_movements.item_id')
            ->orderByDesc('stock_movements.moved_at')
            ->limit(6)
            ->get([
                'stock_movements.id',
                'stock_movements.type',
                'stock_movements.quantity',
                'stock_movements.reason',
                'stock_movements.moved_at',
                'items.name as item',
                'items.unit',
            ])
            ->map(fn ($r) => [
                'id' => $r->id,
                'type' => $r->type,
                'quantity' => (int) $r->quantity,
                'reason' => $r->reason,
                'moved_at' => Carbon::parse($r->moved_at)->toIso8601String(),
                'item' => $r->item,
                'unit' => $r->unit,
            ])
            ->all();

        return [
            'total' => (int) $summary->total,
            'low' => (int) $summary->low,
            'out_of_stock' => (int) $summary->out_of_stock,
            'stock_value' => (float) $summary->stock_value,
            'low_stock' => $lowStock,
            'movements' => $movements,
        ];
    }

    private function start(string $range): Carbon
    {
        return match ($range) {
            'today' => now()->startOfDay(),
            '30d' => now()->subDays(29)->startOfDay(),
            default => now()->subDays(6)->startOfDay(),
        };
    }

    private function salesByDay(Carbon $start): array
    {
        $totals = DB::table('payments')
            ->where('processed_at', '>=', $start)
            ->get(['processed_at', 'amount'])
            ->groupBy(fn ($p) => Carbon::parse($p->processed_at)->toDateString())
            ->map(fn ($group) => (float) $group->sum('amount'));

        return collect(CarbonPeriod::create($start->toDateString(), now()->toDateString()))
            ->map(fn ($day) => [
                'date' => $day->toDateString(),
                'label' => $day->format('M j'),
                'total' => $totals->get($day->toDateString(), 0.0),
            ])
            ->values()
            ->all();
    }

    private function ordersByStatus(Carbon $start): array
    {
        $counts = DB::table('orders')
            ->whereNull('deleted_at')
            ->where('created_at', '>=', $start)
            ->selectRaw('kitchen_status, COUNT(*) as total')
            ->groupBy('kitchen_status')
            ->pluck('total', 'kitchen_status');

        return collect(self::STATUSES)
            ->map(fn ($status) => ['status' => $status, 'total' => (int) $counts->get($status, 0)])
            ->all();
    }

    private function topItems(Carbon $start): array
    {
        return DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
            ->whereNull('orders.deleted_at')
            ->where('orders.kitchen_status', '!=', 'cancelled')
            ->where('orders.created_at', '>=', $start)
            ->groupBy('menu_items.id', 'menu_items.name')
            ->selectRaw('menu_items.id, menu_items.name, SUM(order_items.quantity) as quantity, SUM(order_items.quantity * order_items.price_at_time) as revenue')
            ->orderByDesc('quantity')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'quantity' => (int) $r->quantity,
                'revenue' => (float) $r->revenue,
            ])
            ->all();
    }

    private function paymentMethods(Carbon $start): array
    {
        return DB::table('payments')
            ->where('processed_at', '>=', $start)
            ->groupBy('payment_method')
            ->selectRaw('payment_method, COUNT(*) as count, SUM(amount) as total')
            ->get()
            ->map(fn ($r) => [
                'method' => $r->payment_method,
                'count' => (int) $r->count,
                'total' => (float) $r->total,
            ])
            ->all();
    }
}