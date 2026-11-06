<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'username' => trans('auth.failed'),
            ]);
        }

        $request->session()->regenerate();

        return redirect($this->redirectPath());
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }

    protected function redirectPath(): string
    {
        return match (strtolower(trim((string) Auth::user()->role))) {
            'admin' => route('admin.dashboard'),
            'user' => route('items.index'),
            'waiter' => route('orders.index'),
            'cashier' => route('cashier.index'),
            'kitchen-staff', 'kitchen_staff' => route('kitchen.index'),
            default => route('home'),
        };
    }
}