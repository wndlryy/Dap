<?php

namespace App\Http\Controllers;

use App\Http\Requests\DashboardRequest;
use App\Services\DashboardService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(DashboardRequest $request, DashboardService $dashboard)
    {
        $range = $request->range();

        return Inertia::render('admin/dashboard', [
            'filters' => ['range' => $range],
            'stats' => $dashboard->stats($range),
            'charts' => $dashboard->charts($range),
            'inventory' => $dashboard->inventory(),
        ]);
    }
}