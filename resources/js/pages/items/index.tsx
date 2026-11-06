import Layout from "@/layouts/app-layout";
import type { ReactElement } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getColumns, type Item } from "./columns";
import { ItemFormDialog } from "./item-form-dialog";
import { ItemExportDialog } from "./item-export-dialog";
import { DeleteItemDialog } from "./delete-item-dialog";
import { Plus, FileDown } from "lucide-react";

interface Category {
    id: number;
    name: string;
}

interface PaginatedItems {
    data: Item[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Filters {
    search: string;
    category: string;
}

interface ItemPageProps {
    items: PaginatedItems;
    categories: Category[];
    filters: Filters;
}

export default function ItemPage({ items, categories, filters }: ItemPageProps) {
    const [open, setOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [editing, setEditing] = useState<Item | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

    function openCreate() {
        setEditing(null);
        setOpen(true);
    }

    function openEdit(item: Item) {
        setEditing(item);
        setOpen(true);
    }

    const columns = getColumns({
        onEdit: openEdit,
        onDeleteRequest: setDeleteTarget,
    });

    return (
        <div className="grid gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Items</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setExportOpen(true)}>
                        <FileDown className="h-4 w-4" />
                        Export
                    </Button>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Add Items
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={items.data}
                filterPlaceholder="Filter items..."
            />

            <ItemFormDialog
                key={editing?.id ?? "new"}
                open={open}
                onOpenChange={setOpen}
                editing={editing}
                categories={categories}
            />

            <ItemExportDialog
                open={exportOpen}
                onOpenChange={setExportOpen}
                categories={categories}
                defaultSearch={filters.search}
                defaultCategory={filters.category}
            />

            <DeleteItemDialog
                target={deleteTarget}
                onOpenChange={(v: boolean) => {
                    if (!v) setDeleteTarget(null);
                }}
            />
        </div>
    );
}

ItemPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;