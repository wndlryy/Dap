import Layout from "@/layouts/app-layout";
import type { ReactElement } from "react";
import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { getColumns, recordLabel, type TrashedRecord } from "./columns";

type TrashType = "categories" | "items" | "menu-categories" | "menu-items" | "users";

interface TrashPageProps {
    trashed: Record<TrashType, TrashedRecord[]>;
}

const typeLabels: Record<TrashType, string> = {
    categories: "Categories",
    items: "Items",
    "menu-categories": "Menu Categories",
    "menu-items": "Menu Items",
    users: "Users",
};

const typeOrder: TrashType[] = ["categories", "items", "menu-categories", "menu-items", "users"];

export default function TrashPage({ trashed }: TrashPageProps) {
    const [pendingRestore, setPendingRestore] = useState<{ type: TrashType; record: TrashedRecord } | null>(null);
    const [pendingDelete, setPendingDelete] = useState<{ type: TrashType; record: TrashedRecord } | null>(null);
    const [busy, setBusy] = useState(false);

    function confirmRestore() {
        if (!pendingRestore) return;
        const label = recordLabel(pendingRestore.record);
        setBusy(true);
        router.patch(
            route("trash.restore", { type: pendingRestore.type, id: pendingRestore.record.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`"${label}" restored successfully`);
                },
                onError: () => {
                    toast.error(`Failed to restore "${label}"`);
                },
                onFinish: () => {
                    setBusy(false);
                    setPendingRestore(null);
                },
            }
        );
    }

    function confirmForceDelete() {
        if (!pendingDelete) return;
        const label = recordLabel(pendingDelete.record);
        setBusy(true);
        router.delete(
            route("trash.force-delete", { type: pendingDelete.type, id: pendingDelete.record.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`"${label}" permanently deleted`);
                },
                onError: () => {
                    toast.error(`Failed to delete "${label}"`);
                },
                onFinish: () => {
                    setBusy(false);
                    setPendingDelete(null);
                },
            }
        );
    }

    return (
        <div className="grid gap-4">
            <h1 className="text-xl font-semibold">Trash</h1>

            <Tabs defaultValue={typeOrder[0]}>
                <TabsList>
                    {typeOrder.map((type) => (
                        <TabsTrigger key={type} value={type}>
                            {typeLabels[type]}
                            <span className="ml-1.5 text-xs text-muted-foreground">
                                ({trashed[type]?.length ?? 0})
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {typeOrder.map((type) => {
                    const columns = getColumns({
                        onRestoreRequest: (record) => setPendingRestore({ type, record }),
                        onDeleteRequest: (record) => setPendingDelete({ type, record }),
                    });

                    return (
                        <TabsContent key={type} value={type}>
                            <DataTable
                                columns={columns}
                                data={trashed[type] ?? []}
                                filterPlaceholder={`Filter ${typeLabels[type].toLowerCase()}...`}
                            />
                        </TabsContent>
                    );
                })}
            </Tabs>

            <Dialog open={!!pendingRestore} onOpenChange={(v) => !busy && !v && setPendingRestore(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Restore this record?</DialogTitle>
                        <DialogDescription>
                            <span className="font-medium text-foreground">
                                {pendingRestore ? recordLabel(pendingRestore.record) : ""}
                            </span>{" "}
                            will be restored and become active again.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendingRestore(null)} disabled={busy}>
                            Cancel
                        </Button>
                        <Button onClick={confirmRestore} disabled={busy}>
                            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                            Restore
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!pendingDelete} onOpenChange={(v) => !busy && !v && setPendingDelete(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Permanently delete this record?</DialogTitle>
                        <DialogDescription>
                            <span className="font-medium text-foreground">
                                {pendingDelete ? recordLabel(pendingDelete.record) : ""}
                            </span>{" "}
                            will be permanently deleted. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={busy}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmForceDelete} disabled={busy}>
                            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

TrashPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;