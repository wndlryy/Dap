<?php

namespace App\Http\Controllers;

use App\Http\Requests\MenuItemStoreRequest;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MenuItemController extends Controller
{
    public function index()
    {
        $menuItems = MenuItem::with('menuCategory')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('menu-items/index', [
            'menuItems' => $menuItems,
            'menuCategories' => MenuCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(MenuItemStoreRequest $request)
    {
        MenuItem::create($this->payload($request));

        return redirect()->back();
    }

    public function update(MenuItemStoreRequest $request, MenuItem $menuItem)
    {
        $data = $this->payload($request);

        if (isset($data['image']) && $menuItem->image) {
            Storage::disk('public')->delete($menuItem->image);
        }

        $menuItem->update($data);

        return redirect()->back();
    }

    public function destroy(MenuItem $menuItem)
    {
        if ($menuItem->image) {
            Storage::disk('public')->delete($menuItem->image);
        }

        $menuItem->delete();

        return redirect()->back();
    }

    private function payload(MenuItemStoreRequest $request): array
    {
        $data = $request->validated();
        unset($data['image']);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('menu-items', 'public');
        }

        return $data;
    }
}