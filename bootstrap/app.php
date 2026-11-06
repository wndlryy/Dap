<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'role' => EnsureRole::class,
        ]);

        $middleware->redirectGuestsTo(fn () => route('home'));

        $middleware->redirectUsersTo(fn () => match (strtolower(trim((string) auth()->user()?->role))) {
            'admin' => route('admin.dashboard'),
            'user' => route('items.index'),
            'waiter' => route('orders.index'),
            'cashier' => route('cashier.index'),
            'kitchen-staff', 'kitchen_staff' => route('kitchen.index'),
            default => route('items.index'),
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson() && ! $request->header('X-Inertia'),
        );

        $exceptions->render(function (\Illuminate\Session\TokenMismatchException $e, Request $request) {
            return redirect()->route('home')->with('error', 'Your session expired. Please log in again.');
        });

        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            $status = $response->getStatusCode();

            if (! in_array($status, [403, 404, 500, 503])) {
                return $response;
            }

            if (app()->hasDebugModeEnabled() && in_array($status, [500, 503])) {
                return $response;
            }

            if ($request->is('api/*')) {
                return $response;
            }

            return Inertia::render('error', ['status' => $status])
                ->toResponse($request)
                ->setStatusCode($status);
        });
    })->create();