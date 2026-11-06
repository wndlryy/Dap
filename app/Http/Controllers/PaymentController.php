<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentStoreRequest;
use App\Models\Order;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PaymentController extends Controller
{
    private const PERIODS = ['daily', 'weekly', 'monthly'];

    public function index(Request $request)
    {
        $period = in_array($request->query('period'), self::PERIODS, true)
            ? $request->query('period')
            : 'daily';

        $anchor = $this->anchorDate($request->query('date'));

        [$from, $to] = match ($period) {
            'daily' => [$anchor->copy()->startOfDay(), $anchor->copy()->endOfDay()],
            'weekly' => [$anchor->copy()->startOfWeek(), $anchor->copy()->endOfWeek()],
            'monthly' => [$anchor->copy()->startOfMonth(), $anchor->copy()->endOfMonth()],
        };

        $label = match ($period) {
            'daily' => $from->format('M j, Y'),
            'weekly' => $from->year === $to->year
                ? $from->format('M j') . ' – ' . $to->format('M j, Y')
                : $from->format('M j, Y') . ' – ' . $to->format('M j, Y'),
            'monthly' => $from->format('F Y'),
        };

        $open = Order::query()
            ->where('payment_status', 'unpaid')
            ->where('kitchen_status', '!=', 'cancelled');

        $paid = Payment::query()->whereBetween('processed_at', [$from, $to]);

        return Inertia::render('cashier/index', [
            'orders' => (clone $open)
                ->with(['user', 'items.menuItem'])
                ->oldest()
                ->limit(100)
                ->get(),
            'payments' => (clone $paid)
                ->with(['processedBy', 'order.user', 'order.items.menuItem'])
                ->latest('processed_at')
                ->limit(500)
                ->get(),
            'summary' => [
                'to_collect_count' => (clone $open)->count(),
                'to_collect_total' => (float) (clone $open)->sum('total'),
                'collected_count' => (clone $paid)->count(),
                'collected_total' => (float) (clone $paid)->sum('amount'),
                'cash_total' => (float) (clone $paid)->where('payment_method', 'cash')->sum('amount'),
            ],
            'methods' => Payment::METHODS,
            'filter' => [
                'period' => $period,
                'date' => $anchor->toDateString(),
                'label' => $label,
                'is_current' => now()->between($from, $to),
            ],
        ]);
    }

    public function store(PaymentStoreRequest $request)
    {
        DB::transaction(function () use ($request) {
            $data = $request->validated();

            $order = Order::query()->lockForUpdate()->findOrFail($data['order_id']);

            if ($order->kitchen_status === 'cancelled') {
                throw ValidationException::withMessages([
                    'order_id' => 'A cancelled order cannot be paid.',
                ]);
            }

            if ($order->payment_status === 'paid' || $order->payments()->exists()) {
                throw ValidationException::withMessages([
                    'order_id' => 'This order has already been paid.',
                ]);
            }

            Payment::create([
                'order_id' => $order->id,
                'payment_method' => $data['payment_method'],
                'amount' => $order->total,
                'reference_number' => $data['payment_method'] === 'cash' ? null : $data['reference_number'],
                'user_id' => $request->user()->id,
                'processed_at' => now(),
            ]);

            $order->update(['payment_status' => 'paid']);
        });

        return redirect()->back();
    }

    private function anchorDate(?string $value): Carbon
    {
        if (! $value || ! Carbon::hasFormat($value, 'Y-m-d')) {
            return now();
        }

        $date = Carbon::createFromFormat('Y-m-d', $value)->startOfDay();

        return $date->isFuture() ? now() : $date;
    }
}