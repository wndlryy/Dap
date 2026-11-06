<?php

namespace App\Http\Controllers;

use App\Http\Requests\ItemBatchStoreRequest;
use App\Http\Requests\ItemStoreRequest;
use App\Models\Category;
use App\Models\Item;
use App\Services\ItemExportService;
use App\Services\ItemService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemController extends Controller
{
    public function __construct(
        private ItemService $itemService,
        private ItemExportService $itemExportService,
    ) {
    }

    public function index(Request $request)
    {
        $search = $request->string('search')->trim()->toString();
        $category = $request->string('category')->trim()->toString();

        return Inertia::render('items/index', [
            'items' => $this->itemService->paginatedIndex($search, $category),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'category' => $category ?: 'all',
            ],
        ]);
    }

    public function store(ItemStoreRequest $request)
    {
        $this->itemService->create($request->validated());

        return back();
    }

    public function update(ItemStoreRequest $request, Item $item)
    {
        $this->itemService->update($item, $request->validated());

        return back();
    }

    public function destroy(Item $item)
    {
        $item->delete();

        return back();
    }

    public function batchStore(ItemBatchStoreRequest $request)
    {
        $validated = $request->validated();

        $this->itemService->batchCreate($validated['category_id'], $validated['items']);

        return back();
    }

    public function search(Request $request)
    {
        return $this->itemService->search($request->string('q')->trim()->toString());
    }

    public function export(Request $request)
    {
        set_time_limit(120);
        ini_set('memory_limit', '512M');

        $type = $request->string('type')->toString() ?: 'month';

        if (!in_array($type, ['day', 'week', 'month'], true)) {
            abort(422, 'Invalid report type.');
        }

        $rules = $type === 'month'
            ? ['month' => ['required', 'date_format:Y-m']]
            : ['date' => ['required', 'date']];

        $validated = $request->validate($rules);

        $search = trim($request->string('search')->toString());
        $category = trim($request->string('category')->toString());

        [
            'periodStart' => $periodStart,
            'periodEnd' => $periodEnd,
            'reportTitle' => $reportTitle,
            'downloadName' => $downloadName,
        ] = $this->itemExportService->resolvePeriod($type, $validated);

        $items = $this->itemExportService->getEndingInventoryItems($search, $category, $periodEnd);
        $totalValue = $items->sum(fn($item) => $item->ending_stock * $item->average_cost_as_of_period);
        $categoryName = $this->itemExportService->categoryName($category);
        $formattedPeriod = $this->itemExportService->formatPeriod($periodStart, $periodEnd);

        $pdf = Pdf::loadView('exports.items', [
            'items' => $items,
            'periodStart' => $formattedPeriod['periodStart'],
            'periodEnd' => $formattedPeriod['periodEnd'],
            'totalValue' => $totalValue,
            'categoryName' => $categoryName,
            'reportTitle' => $reportTitle,
        ]);

        return $pdf->download($downloadName);
    }
}