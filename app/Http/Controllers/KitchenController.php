<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KitchenController extends Controller
{
    private const NEXT_STATUS = [
        'pending' => 'preparing',
        'preparing' => 'ready',
        'ready' => 'served',
    ];

    public function index()
    {
        $orders = Order::query()
            ->with(['user', 'items.menuItem'])
            ->whereIn('kitchen_status', array_keys(self::NEXT_STATUS))
            ->oldest()
            ->limit(100)
            ->get();

        return Inertia::render('kitchen/index', [
            'orders' => $orders,
        ]);
    }

    public function advance(Request $request, Order $order)
    {
        $next = self::NEXT_STATUS[$order->kitchen_status] ?? null;

        if ($next && $order->kitchen_status === $request->string('from')->toString()) {
            $order->update(['kitchen_status' => $next]);
        }

        return redirect()->back();
    }
}