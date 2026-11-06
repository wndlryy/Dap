<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderItemRequest;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OrderItemController extends Controller
{
    public function index()
    {
        $orderItems = OrderItem::with(['order', 'menuItem'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('order-items/index', [
            'orderItems' => $orderItems,
            'orders' => Order::query()
                ->where('payment_status', 'unpaid')
                ->where('kitchen_status', '!=', 'cancelled')
                ->latest()
                ->limit(100)
                ->get(['id', 'kitchen_status', 'payment_status', 'total']),
            'menuItems' => MenuItem::query()
                ->where('is_available', true)
                ->orderBy('name')
                ->get(['id', 'name', 'price']),
        ]);
    }

    public function store(StoreOrderItemRequest $request)
    {
        DB::transaction(function () use ($request) {
            $data = $request->validated();
            $data['price_at_time'] = MenuItem::findOrFail($data['menu_item_id'])->price;

            $orderItem = OrderItem::create($data);

            $this->syncTotals(Order::findOrFail($orderItem->order_id));
        });

        return redirect()->back();
    }

    public function update(StoreOrderItemRequest $request, OrderItem $orderItem)
    {
        DB::transaction(function () use ($request, $orderItem) {
            $data = $request->validated();
            $previousOrderId = (int) $orderItem->order_id;

            if ((int) $data['menu_item_id'] !== (int) $orderItem->menu_item_id) {
                $data['price_at_time'] = MenuItem::findOrFail($data['menu_item_id'])->price;
            }

            $orderItem->update($data);

            $this->syncTotals(Order::findOrFail($orderItem->order_id));

            if ($previousOrderId !== (int) $orderItem->order_id) {
                $this->syncTotals(Order::findOrFail($previousOrderId));
            }
        });

        return redirect()->back();
    }

    public function destroy(OrderItem $orderItem)
    {
        DB::transaction(function () use ($orderItem) {
            $order = Order::findOrFail($orderItem->order_id);

            $orderItem->delete();

            $this->syncTotals($order);
        });

        return redirect()->back();
    }

    private function syncTotals(Order $order): void
    {
        $order->unsetRelation('items');

        $subTotal = round($order->calculateSubTotal(), 2);

        $order->update([
            'sub_total' => $subTotal,
            'total' => $subTotal,
        ]);
    }
}