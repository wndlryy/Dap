import { useState } from "react";
import { router } from "@inertiajs/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { MenuItem } from "./menu-item-form-dialog";

interface DeleteMenuItemDialogProps {
    target: MenuItem | null;
    onOpenChange: (open: boolean) => void;
}

export function DeleteMenuItemDialog({ target, onOpenChange }: DeleteMenuItemDialogProps) {
    const [processing, setProcessing] = useState(false);

    function confirm() {
        if (!target) return;
        router.delete(`/menu-items/${target.id}`, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                toast.success("Menu item deleted successfully");
                onOpenChange(false);
            },
            onError: () => {
                toast.error("Failed to delete menu item");
            },
        });
    }

    return (
        <Dialog open={!!target} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete menu item?</DialogTitle>
                    <DialogDescription>
                        {target ? `"${target.name}" will be permanently removed. This can't be undone.` : ""}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" variant="destructive" disabled={processing} onClick={confirm}>
                        {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}