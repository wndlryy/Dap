<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Item;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SoftDeleteController extends Controller
{
    /**
     * Whitelist of soft-deletable models, keyed by the URL segment used to
     * reference them. Never resolve a class name directly from user input.
     *
     * @var array<string, class-string<Model>>
     */
    protected array $models = [
        'categories' => Category::class,
        'items' => Item::class,
        'menu-categories' => MenuCategory::class,
        'menu-items' => MenuItem::class,
        'users' => User::class,
    ];

    /**
     * List all trashed records, grouped by type.
     */
    public function index()
    {
        $trashed = [];

        foreach ($this->models as $key => $class) {
            $trashed[$key] = $class::onlyTrashed()->latest('deleted_at')->get();
        }

        return Inertia::render('trash/index', [
            'trashed' => $trashed,
        ]);
    }

    /**
     * Restore a soft-deleted record.
     */
    public function restore(string $type, int $id)
    {
        $class = $this->resolveModel($type);

        $model = $class::onlyTrashed()->findOrFail($id);
        $model->restore();

        return redirect()->back();
    }

    /**
     * Permanently delete a soft-deleted record.
     */
    public function forceDelete(string $type, int $id)
    {
        $class = $this->resolveModel($type);

        $model = $class::onlyTrashed()->findOrFail($id);
        $model->forceDelete();

        return redirect()->back();
    }

    /**
     * @return class-string<Model>
     */
    protected function resolveModel(string $type): string
    {
        return $this->models[$type] ?? throw new NotFoundHttpException("Unknown trash type: {$type}");
    }
}