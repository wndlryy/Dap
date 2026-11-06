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
import type { OrderItem } from "@/lib/order-items";

interface DeleteOrderItemDialogProps {
    target: OrderItem | null;
    onOpenChange: (open: boolean) => void;
}

export function DeleteOrderItemDialog({ target, onOpenChange }: DeleteOrderItemDialogProps) {
    const [processing, setProcessing] = useState(false);

    function confirm() {
        if (!target) return;
        router.delete(`/order-items/${target.id}`, {
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
                    <DialogTitle>Remove order item?</DialogTitle>
                    <DialogDescription>
                        {target
                            ? `${target.quantity} × ${target.menu_item?.name ?? "item"} will be removed from order #${target.order_id}, and the order total will be updated.`
                            : ""}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" variant="destructive" disabled={processing} onClick={confirm}>
                        {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Remove
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}