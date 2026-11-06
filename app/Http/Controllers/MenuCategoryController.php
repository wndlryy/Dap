<?php

namespace App\Http\Controllers;

use App\Http\Requests\MenuCategoryStoreRequest;
use App\Models\MenuCategory;
use Inertia\Inertia;

class MenuCategoryController extends Controller
{
    public function index()
    {
        $menuCategories = MenuCategory::latest()->paginate(10)->withQueryString();

        return Inertia::render('menu-categories/index', [
            'menuCategories' => $menuCategories
        ]);
    }

    public function store(MenuCategoryStoreRequest $request)
    {
        MenuCategory::create($request->validated());
        return redirect()->back();
    }

    public function update(MenuCategoryStoreRequest $request, MenuCategory $menuCategory)
    {
        $menuCategory->update($request->validated());
        return redirect()->back();
    }

    public function destroy(MenuCategory $menuCategory)
    {
        $menuCategory->delete();
        return redirect()->back();
    }
}