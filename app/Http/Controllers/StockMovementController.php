<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockMovementBatchRequest;
use App\Http\Requests\StoreStockMovementRequest;
use App\Models\Item;
use App\Models\StockMovement;
use App\Services\StockMovementService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockMovementController extends Controller
{
    public function __construct(private StockMovementService $stockMovements)
    {
    }

    public function index(Request $request)
    {
        $search = $request->string('search')->trim()->toString();
        $year = $request->string('year')->trim()->toString();
        $month = $request->string('month')->trim()->toString();
        $day = $request->string('day')->trim()->toString();

        $movements = StockMovement::query()
            ->with(['item' => fn($q) => $q->withTrashed(), 'user'])
            ->when($search, fn($q) => $q->whereHas(
                'item',
                fn($iq) => $iq->withTrashed()->where('name', 'like', "%{$search}%")
            ))
            ->when($year !== '' && $year !== 'all', fn($q) => $q->whereYear('moved_at', $year))
            ->when($month !== '' && $month !== 'all', fn($q) => $q->whereMonth('moved_at', (int) $month + 1))
            ->when($day !== '' && $day !== 'all', fn($q) => $q->whereDay('moved_at', $day))
            ->orderByDesc('moved_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('stock-movements/index', [
            'movements' => $movements,
            'items' => Item::query()
                ->orderBy('name')
                ->get(['id', 'name', 'unit', 'current_stock', 'unit_price']),
            'reasons' => $this->reasonOptions(),
            'filters' => [
                'search' => $search,
                'year' => $year ?: 'all',
                'month' => $month ?: 'all',
                'day' => $day ?: 'all',
            ],
            'filterOptions' => $this->dateFilterOptions($year, $month),
        ]);
    }

    private function reasonOptions()
    {
        return StockMovement::query()
            ->whereNotNull('reason')
            ->where('reason', '!=', '')
            ->select('reason as name', 'type')
            ->distinct()
            ->orderBy('name')
            ->get();
    }

    private function dateFilterOptions(string $year, string $month): array
    {
        $years = StockMovement::query()
            ->selectRaw('DISTINCT YEAR(moved_at) as year')
            ->orderByDesc('year')
            ->pluck('year')
            ->map(fn($y) => (int) $y)
            ->values();

        $months = collect();
        if ($year !== '' && $year !== 'all') {
            $months = StockMovement::query()
                ->whereYear('moved_at', $year)
                ->selectRaw('DISTINCT MONTH(moved_at) as month')
                ->orderBy('month')
                ->pluck('month')
                ->map(fn($m) => ((int) $m) - 1)
                ->values();
        }

        $days = collect();
        if ($year !== '' && $year !== 'all' && $month !== '' && $month !== 'all') {
            $days = StockMovement::query()
                ->whereYear('moved_at', $year)
                ->whereMonth('moved_at', (int) $month + 1)
                ->selectRaw('DISTINCT DAY(moved_at) as day')
                ->orderBy('day')
                ->pluck('day')
                ->map(fn($d) => (int) $d)
                ->values();
        }

        return [
            'years' => $years,
            'months' => $months,
            'days' => $days,
        ];
    }

    public function store(StoreStockMovementRequest $request)
    {
        $this->stockMovements->store($request->validated(), $request->user()->id);

        return back();
    }

    public function storeBatch(StoreStockMovementBatchRequest $request)
    {
        $this->stockMovements->storeBatch($request->validated(), $request->user()->id);

        return back();
    }
}