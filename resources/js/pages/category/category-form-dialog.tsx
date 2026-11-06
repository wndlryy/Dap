import type { FormEvent } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { Category } from "./columns";

interface CategoryFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: Category | null;
}

export function CategoryFormDialog({
    open,
    onOpenChange,
    editing,
}: CategoryFormDialogProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: editing?.name ?? "",
    });

    const isEmpty = data.name.trim() === "";
    const isUnchanged = editing
        ? data.name.trim() === editing.name.trim()
        : false;
    const isSubmitDisabled = processing || isEmpty || isUnchanged;

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/categories/${editing.id}`, {
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                    toast.success("Category updated successfully.");
                },
                onError: (errors) => {
                    toast.error(errors.name ?? "Failed to update category.");
                },
            });
        } else {
            post("/categories", {
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                    toast.success("Category created successfully.");
                },
                onError: (errors) => {
                    toast.error(errors.name ?? "Failed to create category.");
                },
            });
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                onOpenChange(v);
                if (!v) reset();
            }}
        >
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Edit Category" : "Add Category"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            autoFocus
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitDisabled}>
                            {processing
                                ? editing
                                    ? "Updating..."
                                    : "Adding..."
                                : editing
                                  ? "Update Category"
                                  : "Add Category"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
