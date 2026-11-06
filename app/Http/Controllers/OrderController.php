<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrderItemsUpdateRequest;
use App\Http\Requests\OrderStoreRequest;
use App\Http\Requests\OrderUpdateRequest;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class OrderController extends Controller
{
    private const KITCHEN_STATUSES = ['pending', 'preparing', 'ready', 'served', 'cancelled'];

    private const PAYMENT_STATUSES = ['unpaid', 'paid'];

    public function index(Request $request)
    {
        $kitchen = $request->string('kitchen_status')->toString();
        $payment = $request->string('payment_status')->toString();

        $kitchen = in_array($kitchen, self::KITCHEN_STATUSES, true) ? $kitchen : 'all';
        $payment = in_array($payment, self::PAYMENT_STATUSES, true) ? $payment : 'all';

        $orders = Order::with(['user', 'items.menuItem'])
            ->withCount('items')
            ->when($kitchen !== 'all', fn($q) => $q->where('kitchen_status', $kitchen))
            ->when($payment !== 'all', fn($q) => $q->where('payment_status', $payment))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('orders/index', [
            'orders' => $orders,
            'filters' => [
                'kitchen_status' => $kitchen,
                'payment_status' => $payment,
            ],
            'counts' => [
                'total' => Order::count(),
                'kitchen' => $this->countsBy('kitchen_status', self::KITCHEN_STATUSES),
                'payment' => $this->countsBy('payment_status', self::PAYMENT_STATUSES),
            ],
            'menuItems' => MenuItem::query()
                ->where('is_available', true)
                ->orderBy('name')
                ->get(['id', 'name', 'price', 'menu_category_id']),
        ]);
    }

    private function countsBy(string $column, array $statuses): array
    {
        $found = Order::query()
            ->selectRaw("{$column}, count(*) as c")
            ->groupBy($column)
            ->pluck('c', $column)
            ->all();

        return array_merge(array_fill_keys($statuses, 0), $found);
    }

    public function create(Request $request)
    {
        return Inertia::render('orders/create', [
            'categories' => MenuCategory::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'menuItems' => MenuItem::query()
                ->where('is_available', true)
                ->orderBy('name')
                ->get(['id', 'name', 'price', 'image', 'menu_category_id']),
            'waiter' => $request->user()->only(['id', 'name', 'username']),
        ]);
    }

    public function store(OrderStoreRequest $request)
    {
        $lines = collect($request->validated('items'));

        $menuItems = MenuItem::query()
            ->whereIn('id', $lines->pluck('menu_item_id'))
            ->get()
            ->keyBy('id');

        $subTotal = round(
            $lines->sum(fn($line) => $line['quantity'] * $menuItems[$line['menu_item_id']]->price),
            2
        );

        DB::transaction(function () use ($request, $lines, $menuItems, $subTotal) {
            $order = Order::create([
                'user_id' => $request->user()->id,
                'kitchen_status' => 'pending',
                'payment_status' => 'unpaid',
                'sub_total' => $subTotal,
                'total' => $subTotal,
            ]);

            $order->items()->createMany(
                $lines->map(fn($line) => [
                    'menu_item_id' => $line['menu_item_id'],
                    'quantity' => $line['quantity'],
                    'price_at_time' => $menuItems[$line['menu_item_id']]->price,
                    'notes' => $line['notes'] ?? null,
                ])->all()
            );
        });

        return to_route('orders.index');
    }

    public function update(OrderUpdateRequest $request, Order $order)
    {
        if ($order->payment_status === 'paid' && $request->validated('kitchen_status') === 'cancelled') {
            throw ValidationException::withMessages([
                'kitchen_status' => 'A paid order cannot be cancelled.',
            ]);
        }

        $order->update($request->validated());

        return redirect()->back();
    }

    public function destroy(Order $order)
    {
        $order->delete();

        return redirect()->back();
    }

    public function updateItems(OrderItemsUpdateRequest $request, Order $order)
    {
        $lines = collect($request->validated('items'));

        $menuItems = MenuItem::query()
            ->whereIn('id', $lines->pluck('menu_item_id'))
            ->get()
            ->keyBy('id');

        $subTotal = round(
            $lines->sum(fn($line) => $line['quantity'] * $menuItems[$line['menu_item_id']]->price),
            2
        );

        DB::transaction(function () use ($order, $lines, $menuItems, $subTotal) {
            $order->items()->delete();

            $order->items()->createMany(
                $lines->map(fn($line) => [
                    'menu_item_id' => $line['menu_item_id'],
                    'quantity' => $line['quantity'],
                    'price_at_time' => $menuItems[$line['menu_item_id']]->price,
                    'notes' => $line['notes'] ?? null,
                ])->all()
            );

            $order->update(['sub_total' => $subTotal, 'total' => $subTotal]);
        });

        return redirect()->back();
    }
}