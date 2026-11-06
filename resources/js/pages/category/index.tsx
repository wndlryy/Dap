import Layout from "@/layouts/app-layout";
import type { ReactElement } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getColumns, type Category } from "./columns";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { Plus } from "lucide-react";

interface CategoryPageProps {
    categories: Category[];
}

export default function CategoryPage({ categories }: CategoryPageProps) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

    function openCreate() {
        setEditing(null);
        setOpen(true);
    }

    function openEdit(category: Category) {
        setEditing(category);
        setOpen(true);
    }

    const columns = getColumns({
        onEdit: openEdit,
        onDeleteRequest: setDeleteTarget,
    });

    return (
        <div className="grid gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Categories</h1>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Add Category
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={categories}
                filterPlaceholder="Filter categories..."
            />

            <CategoryFormDialog
                key={editing?.id ?? "new"}
                open={open}
                onOpenChange={setOpen}
                editing={editing}
            />

            <DeleteCategoryDialog
                target={deleteTarget}
                onOpenChange={(v) => {
                    if (!v) setDeleteTarget(null);
                }}
            />
        </div>
    );
}

CategoryPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;
