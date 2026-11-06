import { useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export interface MenuCategory {
    id: number;
    name: string;
    created_at?: string | null;
}

interface MenuCategoryFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: MenuCategory | null;
}

export function MenuCategoryFormDialog({
    open,
    onOpenChange,
    editing,
}: MenuCategoryFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="sm:max-w-md"
            >
                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Edit Menu Category" : "Add Menu Category"}
                    </DialogTitle>
                    <DialogDescription>
                        {editing
                            ? "Update the category name."
                            : "Create a new category for your menu."}
                    </DialogDescription>
                </DialogHeader>
                <MenuCategoryForm
                    editing={editing}
                    onDone={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

function MenuCategoryForm({
    editing,
    onDone,
}: {
    editing: MenuCategory | null;
    onDone: () => void;
}) {
    const form = useForm({ name: editing?.name ?? "" });
    const isEdit = !!editing;

    function submit(e: FormEvent) {
        e.preventDefault();

        if (editing) {
            form.put(`/menu-categories/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Category updated successfully");
                    onDone();
                },
                onError: () => {
                    toast.error("Failed to update category. Please check the form.");
                },
            });
        } else {
            form.post("/menu-categories", {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Category added successfully");
                    onDone();
                },
                onError: () => {
                    toast.error("Failed to add category. Please check the form.");
                },
            });
        }
    }

    return (
        <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    autoFocus
                    placeholder="e.g. Beverages"
                    aria-invalid={!!form.errors.name}
                    value={form.data.name}
                    onChange={(e) => form.setData("name", e.target.value)}
                />
                {form.errors.name && (
                    <p className="text-sm text-destructive">
                        {form.errors.name}
                    </p>
                )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
                <Button type="submit" disabled={form.processing || !form.isDirty}>
                    {form.processing && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {isEdit
                        ? form.processing
                            ? "Saving..."
                            : "Save changes"
                        : form.processing
                          ? "Adding..."
                          : "Add Category"}
                </Button>
            </DialogFooter>
        </form>
    );
}