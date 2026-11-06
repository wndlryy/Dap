<?php

namespace App\Services;

use App\Models\Item;
use Illuminate\Validation\ValidationException;

class ItemService
{
    public function create(array $validated): Item
    {
        $validated['average_cost'] = $validated['unit_price'];

        return Item::create($validated);
    }

    public function update(Item $item, array $validated): Item
    {
        unset($validated['current_stock'], $validated['unit_price']);

        $item->update($validated);

        return $item;
    }

    public function batchCreate(int $categoryId, array $items): void
    {
        $incomingNames = collect($items)->pluck('name')->map(fn($name) => trim($name));

        $duplicatesWithinRequest = $incomingNames
            ->map(fn($name) => strtolower($name))
            ->duplicates()
            ->map(fn($lower) => $incomingNames->first(fn($n) => strtolower($n) === $lower))
            ->values();

        if ($duplicatesWithinRequest->isNotEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'Duplicate item names in this batch: ' . $duplicatesWithinRequest->implode(', '),
            ]);
        }

        $lowerNames = $incomingNames->map(fn($name) => strtolower($name));

        $existingNames = Item::withTrashed()
            ->where('category_id', $categoryId)
            ->get(['name'])
            ->filter(fn($item) => $lowerNames->contains(strtolower($item->name)))
            ->pluck('name');

        if ($existingNames->isNotEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'These items already exist in this category: ' . $existingNames->implode(', '),
            ]);
        }

        foreach ($items as $item) {
            Item::create([
                'category_id' => $categoryId,
                'name' => trim($item['name']),
                'unit' => $item['unit'],
                'unit_price' => $item['unit_price'],
                'average_cost' => $item['unit_price'],
                'current_stock' => $item['current_stock'],
                'reorder_level' => $item['reorder_level'],
            ]);
        }
    }

    public function paginatedIndex(string $search, string $category, int $perPage = 25)
    {
        return Item::query()
            ->with(['category' => fn($q) => $q->withTrashed()])
            ->when($search, fn($query) => $query->where('name', 'like', "%{$search}%"))
            ->when($category && $category !== 'all', fn($query) => $query->where('category_id', $category))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function search(string $search)
    {
        return Item::query()
            ->when($search, fn($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'unit', 'unit_price', 'current_stock', 'reorder_level', 'category_id']);
    }
}