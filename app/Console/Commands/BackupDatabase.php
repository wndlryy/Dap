<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup';
    protected $description = 'Create a database backup';

    public function handle(): int
    {
        $db = config('database.connections.' . config('database.default'));

        Storage::disk('local')->makeDirectory('backups');
        $file = 'backups/backup-' . now()->format('Y-m-d_H-i-s') . '.sql';
        $path = Storage::disk('local')->path($file);

        $systemRoot = getenv('SystemRoot') ?: ($_SERVER['SystemRoot'] ?? 'C:\\Windows');

        $process = new Process([
            config('dbbackup.mysqldump_path'),
            '--protocol=tcp',
            '--host=' . $db['host'],
            '--port=' . $db['port'],
            '--user=' . $db['username'],
            '--single-transaction',
            '--routines',
            '--result-file=' . $path,
            $db['database'],
        ], null, [
            'MYSQL_PWD' => (string) $db['password'],
            'SystemRoot' => $systemRoot,
            'windir' => $systemRoot,
        ]);

        $process->setTimeout(300);
        $process->run();

        if (! $process->isSuccessful() || ! file_exists($path) || filesize($path) === 0) {
            @unlink($path);
            $this->error($process->getErrorOutput());
            return self::FAILURE;
        }

        collect(Storage::disk('local')->files('backups'))
            ->sortDesc()
            ->slice(config('dbbackup.keep'))
            ->each(fn ($f) => Storage::disk('local')->delete($f));

        $this->info("Backup saved: $file");
        return self::SUCCESS;
    }
}