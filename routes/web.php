<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\KitchenController;
use App\Http\Controllers\MenuCategoryController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderItemController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SoftDeleteController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return inertia('home');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::post('/login', [LoginController::class, 'login'])->name('login');
});

Route::middleware('auth')->group(function () {

    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

    Route::middleware('role:admin')->group(function () {
        Route::resource('users', UserController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::get('trash', [SoftDeleteController::class, 'index'])->name('trash.index');
        Route::patch('trash/{type}/{id}/restore', [SoftDeleteController::class, 'restore'])->name('trash.restore');
        Route::delete('trash/{type}/{id}', [SoftDeleteController::class, 'forceDelete'])->name('trash.force-delete');

        Route::get('/backups', [BackupController::class, 'index'])->name('backups.index');
        Route::post('/backups', [BackupController::class, 'store'])->name('backups.store');
        Route::get('/backups/{file}', [BackupController::class, 'download'])->name('backups.download');

        Route::resource('menu-categories', MenuCategoryController::class)
            ->only(['store', 'update', 'destroy']);
        Route::resource('menu-items', MenuItemController::class)
            ->only(['store', 'update', 'destroy']);
    });

    Route::middleware('role:admin|user')->group(function () {
        Route::get('admin/dashboard', DashboardController::class)->name('admin.dashboard');

        Route::resource('categories', CategoryController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::get('/items/export', [ItemController::class, 'export'])->name('items.export');
        Route::post('/items/batch', [ItemController::class, 'batchStore'])->name('items.batchStore');
        Route::resource('items', ItemController::class)
            ->only(['index', 'store', 'update', 'destroy']);
    });

    Route::middleware('role:admin|user|kitchen-staff')->group(function () {
        Route::get('/stock-movements', [StockMovementController::class, 'index'])->name('stock-movements.index');
        Route::post('/stock-movements', [StockMovementController::class, 'store'])->name('stock-movements.store');
        Route::post('/stock-movements/batch', [StockMovementController::class, 'storeBatch'])->name('stock-movements.storeBatch');
    });

    Route::middleware('role:admin|waiter')->group(function () {
        Route::get('menu-categories', [MenuCategoryController::class, 'index'])->name('menu-categories.index');
        Route::get('menu-items', [MenuItemController::class, 'index'])->name('menu-items.index');

        Route::get('orders/create', [OrderController::class, 'create'])->name('orders.create');
        Route::put('/orders/{order}/items', [OrderController::class, 'updateItems'])->name('orders.items.update');
        Route::resource('orders', OrderController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::resource('order-items', OrderItemController::class)
            ->only(['index', 'store', 'update', 'destroy']);
    });

    Route::middleware('role:admin|kitchen-staff')->group(function () {
        Route::get('kitchen', [KitchenController::class, 'index'])->name('kitchen.index');
        Route::patch('kitchen/orders/{order}/advance', [KitchenController::class, 'advance'])->name('kitchen.advance');
    });

    Route::middleware('role:admin|cashier')->group(function () {
        Route::get('cashier', [PaymentController::class, 'index'])->name('cashier.index');
        Route::post('payments', [PaymentController::class, 'store'])->name('payments.store');
    });
});