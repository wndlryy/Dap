import { useForm } from "@inertiajs/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "./columns";

interface DeleteUserDialogProps {
    target: User | null;
    onOpenChange: (open: boolean) => void;
}

export function DeleteUserDialog({ target, onOpenChange }: DeleteUserDialogProps) {
    const form = useForm({});

    function handleDelete() {
        if (!target) return;
        form.delete(`/users/${target.id}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    }

    return (
        <Dialog open={!!target} onOpenChange={(v) => !form.processing && onOpenChange(v)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete user?</DialogTitle>
                    <DialogDescription>
                        This will permanently delete{" "}
                        <span className="font-medium text-foreground">{target?.name}</span>. This
                        action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={form.processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={form.processing}
                    >
                        {form.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        {form.processing ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}