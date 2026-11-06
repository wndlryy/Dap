import { useState } from "react";
import { router } from "@inertiajs/react";
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
import type { Order } from "@/lib/orders";

interface DeleteOrderDialogProps {
    target: Order | null;
    onOpenChange: (open: boolean) => void;
}

export function DeleteOrderDialog({ target, onOpenChange }: DeleteOrderDialogProps) {
    const [processing, setProcessing] = useState(false);

    function confirm() {
        if (!target) return;
        router.delete(`/orders/${target.id}`, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    }

    return (
        <Dialog open={!!target} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete order?</DialogTitle>
                    <DialogDescription>
                        {target ? `Order #${target.id} will be permanently removed. This can't be undone.` : ""}
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