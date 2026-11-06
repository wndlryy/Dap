<?php

namespace App\Exports;

use App\Models\Item;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class ItemsExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    protected string $search;
    protected string $category;

    public function __construct(string $search = '', string $category = '')
    {
        $this->search = $search;
        $this->category = $category;
    }

    public function query()
    {
        return Item::query()
            ->with('category')
            ->when($this->search, fn ($query) =>
                $query->where('name', 'like', "%{$this->search}%")
            )
            ->when($this->category && $this->category !== 'all', fn ($query) =>
                $query->where('category_id', $this->category)
            )
            ->latest();
    }

    public function headings(): array
    {
        return ['ID', 'Category', 'Name', 'Unit', 'Unit Price', 'Current Stock', 'Reorder Level'];
    }

    /**
     * @param Item $item
     */
    public function map($item): array
    {
        return [
            $item->id,
            $item->category->name ?? '—',
            $item->name,
            $item->unit,
            $item->unit_price,
            $item->current_stock,
            $item->reorder_level,
        ];
    }
}