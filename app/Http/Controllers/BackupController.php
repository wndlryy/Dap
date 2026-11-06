<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

class BackupController extends Controller
{
    private function adminOnly(): void
    {
        abort_unless(auth()->user()?->role === 'admin', 403);
    }

    public function index()
    {
        $this->adminOnly();

        $disk = Storage::disk('local');

        $backups = collect($disk->files('backups'))
            ->sortDesc()
            ->values()
            ->map(fn ($f) => [
                'name' => basename($f),
                'size' => round($disk->size($f) / 1024) . ' KB',
                'date' => date('M d, Y h:i A', $disk->lastModified($f)),
            ]);

        return inertia('backups/index', ['backups' => $backups]);
    }

    public function store()
{
    $this->adminOnly();

    $code = Artisan::call('db:backup');
    $ok = $code === 0;

    if (! $ok) {
        \Log::error('Backup failed', ['code' => $code, 'output' => Artisan::output()]);
    }

    return back()->with(
        $ok ? 'success' : 'error',
        $ok ? 'Backup created.' : 'Backup failed. Please contact your technician.'
    );
}

    public function download(string $file)
    {
        $this->adminOnly();

        $file = basename($file); // blocks ../ tricks
        abort_unless(Storage::disk('local')->exists("backups/$file"), 404);

        return Storage::disk('local')->download("backups/$file");
    }
}