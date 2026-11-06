import Layout from "@/layouts/app-layout";
import { Head, router, usePage } from "@inertiajs/react";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { DatabaseBackup, Download } from "lucide-react";

type Backup = { name: string; size: string; date: string };

type Flash = {
    success?: string;
    error?: string;
};

const columns: ColumnDef<Backup>[] = [
    { accessorKey: "date", header: "Date" },
    { accessorKey: "name", header: "File" },
    { accessorKey: "size", header: "Size" },
    {
        id: "actions",
        header: "",
        cell: ({ row }) => (
            <div className="flex justify-end">
                <Button asChild variant="outline" size="sm">
                    <a href={`/backups/${row.original.name}`}>
                        <Download className="h-4 w-4" />
                        Download
                    </a>
                </Button>
            </div>
        ),
    },
];

export default function BackupsIndex({ backups }: { backups: Backup[] }) {
    const { flash } = usePage().props as { flash?: Flash };
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
    }, [flash?.success]);

    useEffect(() => {
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error]);

    function backupNow() {
        setBusy(true);
        router.post("/backups", {}, { onFinish: () => setBusy(false) });
    }

    return (
        <div className="grid gap-4">
            <Head title="Backups" />

            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Database Backups</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        A backup is made automatically every day at 6:00 PM. Please copy the latest
                        backup to a USB drive at least once a week.
                    </p>
                </div>
                <Button onClick={backupNow} disabled={busy}>
                    <DatabaseBackup className="h-4 w-4" />
                    {busy ? "Backing up..." : "Back up now"}
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={backups}
                filterPlaceholder="Filter backups..."
            />
        </div>
    );
}

BackupsIndex.layout = (page: ReactElement) => <Layout>{page}</Layout>;