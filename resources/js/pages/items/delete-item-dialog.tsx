import { useState } from "react";
import { router } from "@inertiajs/react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Item } from "./columns";

interface DeleteItemDialogProps {
    target: Item | null;
    onOpenChange: (open: boolean) => void;
}

const CONFIRM_TEXT = "CONFIRM";

export function DeleteItemDialog({ target, onOpenChange }: DeleteItemDialogProps) {
    const [confirmText, setConfirmText] = useState("");
    const isConfirmed = confirmText === CONFIRM_TEXT;

    function handleDelete() {
        if (!target || !isConfirmed) return;

        router.delete(`/items/${target.id}`, {
            onSuccess: () => onOpenChange(false),
        });
    }

    return (
        <AlertDialog open={!!target} onOpenChange={onOpenChange}>
            <AlertDialogContent key={target?.id ?? "empty"}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete item?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will delete &quot;{target?.name}&quot;. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid gap-2">
                    <Label htmlFor="confirm-delete">
                        Type <span className="font-semibold">{CONFIRM_TEXT}</span> to confirm
                    </Label>
                    <Input
                        id="confirm-delete"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        autoComplete="off"
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={!isConfirmed}
                        className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}