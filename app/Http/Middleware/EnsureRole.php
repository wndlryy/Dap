<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        abort_unless($user, 401);

        $allowed = collect($roles)
            ->flatMap(fn ($role) => explode('|', $role))
            ->map(fn ($role) => trim($role))
            ->filter()
            ->values();

        $userRoles = $this->rolesOf($user);

        abort_unless($allowed->intersect($userRoles)->isNotEmpty(), 403);

        return $next($request);
    }

    private function rolesOf($user)
    {
        $raw = $user->roles ?? $user->role ?? [];

        if (is_string($raw)) {
            return collect([$raw]);
        }

        return collect($raw)->map(function ($role) {
            return is_object($role) ? ($role->name ?? null) : $role;
        })->filter()->values();
    }
}