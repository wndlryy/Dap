<?php

namespace App\Http\Controllers;

use App\Http\Requests\CategoryStoreRequest;
use App\Models\Category;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::all();
        return Inertia::render('category/index', [
            'categories' => $categories,
        ]);
    }

    public function store(CategoryStoreRequest $request)
    {


        Category::create($request->validated());
        return redirect()->back();
    }

    public function update(CategoryStoreRequest $request, Category $category)
    {
        $category->update($request->validated());
        return redirect()->back();
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return redirect()->back();
    }
}
