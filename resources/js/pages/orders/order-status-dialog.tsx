import { useForm } from "@inertiajs/react";
import { Loader2, Lock, Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    KITCHEN_LABELS,
    KITCHEN_STYLES,
    type KitchenStatus,
    type MenuItem,
    type Order,
} from "@/lib/orders";

interface OrderStatusDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order | null;
    menuItems?: MenuItem[];
}

const SERVED: KitchenStatus = "served";
const READY: KitchenStatus = "ready";
const CANCELLED: KitchenStatus = "cancelled";
const PREPARING: KitchenStatus = "preparing";
const PENDING: KitchenStatus = "pending";

const STAGES: KitchenStatus[] = [PENDING, PREPARING, READY, SERVED];

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

export function OrderStatusDialog({ open, onOpenChange, order, menuItems = [] }: OrderStatusDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto rounded-2xl sm:max-w-sm">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-base">Order {order ? `#${order.id}` : ""}</DialogTitle>
                    <DialogDescription className="text-xs">
                        Mark as served once ready. Payment is recorded at the cashier.
                    </DialogDescription>
                </DialogHeader>
                {order && (
                    <div className="grid gap-3">
                        <Stepper status={order.kitchen_status} />

                        {order.kitchen_status === PENDING ? (
                            <ItemsEditor order={order} menuItems={menuItems} />
                        ) : (
                            <ItemsReadOnly order={order} />
                        )}

                        <OrderStatusForm
                            key={order.id}
                            order={order}
                            onDone={() => onOpenChange(false)}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Stepper({ status }: { status: KitchenStatus }) {
    if (status === CANCELLED) {
        return (
            <div className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-xs font-medium text-destructive">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                Cancelled
            </div>
        );
    }

    const currentIndex = STAGES.indexOf(status);

    return (
        <div className="flex items-start">
            {STAGES.map((stage, i) => {
                const done = i < currentIndex;
                const current = i === currentIndex;
                return (
                    <div key={stage} className="flex flex-1 flex-col items-center">
                        <div className="relative flex w-full items-center">
                            {i > 0 && (
                                <span
                                    className={`absolute right-1/2 h-0.5 w-full ${
                                        done || current ? "bg-emerald-500" : "bg-border"
                                    }`}
                                />
                            )}
                            <span
                                className={`relative z-10 mx-auto h-2.5 w-2.5 rounded-full ${
                                    done
                                        ? "bg-emerald-500"
                                        : current
                                          ? "bg-amber-500 ring-2 ring-amber-200"
                                          : "bg-border"
                                }`}
                            />
                        </div>
                        <span
                            className={`mt-1 text-[10px] font-medium ${
                                current ? "text-foreground" : "text-muted-foreground"
                            }`}
                        >
                            {KITCHEN_LABELS[stage]}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function LockedNote({ status }: { status: KitchenStatus }) {
    return (
        <div className="flex items-start gap-2 rounded-lg bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
                {status === CANCELLED
                    ? "Order was cancelled — items can't be changed."
                    : `Items are locked — order is ${KITCHEN_LABELS[status].toLowerCase()}.`}
            </span>
        </div>
    );
}

function ItemsReadOnly({ order }: { order: Order }) {
    const items = order.items ?? [];
    const total = items.reduce((sum, i) => sum + i.quantity * (i.menu_item?.price ?? 0), 0);

    return (
        <div className="grid gap-2 rounded-lg border border-border p-2.5">
            <Label className="text-xs">Items</Label>
            <LockedNote status={order.kitchen_status} />

            {items.map((line) => (
                <div key={line.menu_item_id} className="flex items-center justify-between gap-2 border-b border-dashed border-border/70 py-1 last:border-0">
                    <div className="min-w-0">
                        <div className="truncate text-xs font-medium">{line.menu_item?.name ?? "Unknown item"}</div>
                        <div className="text-[10px] text-muted-foreground">
                            {peso.format(line.menu_item?.price ?? 0)} each
                        </div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">×{line.quantity}</div>
                </div>
            ))}

            <div className="flex items-center justify-between border-t border-border pt-1.5">
                <span className="text-xs font-semibold">Total {peso.format(total)}</span>
            </div>
        </div>
    );
}

interface EditableLine {
    menu_item_id: number;
    quantity: number;
    notes: string | null;
}

function ItemsEditor({ order, menuItems = [] }: { order: Order; menuItems?: MenuItem[] }) {
    const [lines, setLines] = useState<EditableLine[]>(
        (order.items ?? []).map((i) => ({
            menu_item_id: i.menu_item_id,
            quantity: i.quantity,
            notes: i.notes,
        }))
    );
    const [addingId, setAddingId] = useState<string>("");

    const form = useForm<{ items: EditableLine[] }>({ items: lines });

    const menuById = new Map<number, { id: number; name: string; price: number }>();
    (order.items ?? []).forEach((i) => {
        if (i.menu_item) menuById.set(i.menu_item_id, i.menu_item);
    });
    menuItems.forEach((m) => menuById.set(m.id, m));

    const availableToAdd = menuItems.filter((m) => !lines.some((l) => l.menu_item_id === m.id));
    const total = lines.reduce((sum, l) => sum + l.quantity * (menuById.get(l.menu_item_id)?.price ?? 0), 0);
    const dirty = JSON.stringify(lines) !== JSON.stringify(
        (order.items ?? []).map((i) => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, notes: i.notes }))
    );

    function setQuantity(id: number, quantity: number) {
        setLines((prev) =>
            prev.map((l) => (l.menu_item_id === id ? { ...l, quantity: Math.max(1, quantity) } : l))
        );
    }

    function removeItem(id: number) {
        setLines((prev) => prev.filter((l) => l.menu_item_id !== id));
    }

    function addItem(id: string) {
        if (!id) return;
        setLines((prev) => [...prev, { menu_item_id: Number(id), quantity: 1, notes: null }]);
        setAddingId("");
    }

    function save() {
        form.transform(() => ({ items: lines }));
        form.put(`/orders/${order.id}/items`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Order #${order.id} items updated`);
            },
            onError: () => {
                toast.error("Failed to update order items. Please check the form.");
            },
        });
    }

    return (
        <div className="grid gap-2 rounded-lg border border-border p-2.5">
            <Label className="text-xs">Items</Label>

            {lines.length === 0 && (
                <p className="text-xs text-muted-foreground">No items. Add at least one below.</p>
            )}

            {lines.map((line) => {
                const item = menuById.get(line.menu_item_id);
                return (
                    <div key={line.menu_item_id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <div className="truncate text-xs font-medium">{item?.name ?? "Unknown item"}</div>
                            <div className="text-[10px] text-muted-foreground">
                                {peso.format(item?.price ?? 0)} each
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 rounded-full"
                                disabled={line.quantity <= 1}
                                onClick={() => setQuantity(line.menu_item_id, line.quantity - 1)}
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-5 text-center text-xs tabular-nums">{line.quantity}</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 rounded-full"
                                onClick={() => setQuantity(line.menu_item_id, line.quantity + 1)}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => removeItem(line.menu_item_id)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                );
            })}

            {availableToAdd.length > 0 && (
                <Select value={addingId} onValueChange={addItem}>
                    <SelectTrigger className="h-8 rounded-full text-xs">
                        <SelectValue placeholder="Add an item" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableToAdd.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                                {m.name} — {peso.format(m.price)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {form.errors.items && <p className="text-xs text-destructive">{form.errors.items}</p>}

            <div className="flex items-center justify-between border-t border-border pt-1.5">
                <span className="text-xs font-semibold">Total {peso.format(total)}</span>
                <Button
                    type="button"
                    size="sm"
                    className="h-7 rounded-full px-3 text-xs"
                    disabled={form.processing || !dirty || lines.length === 0}
                    onClick={save}
                >
                    {form.processing && <Loader2 className="h-3 w-3 animate-spin" />}
                    Save
                </Button>
            </div>
        </div>
    );
}

function OrderStatusForm({ order, onDone }: { order: Order; onDone: () => void }) {
    const form = useForm<{ kitchen_status: KitchenStatus }>({
        kitchen_status: order.kitchen_status,
    });
    const [target, setTarget] = useState<KitchenStatus | null>(null);
    const [confirmingCancel, setConfirmingCancel] = useState(false);
    const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
        };
    }, []);

    const alreadyServed = order.kitchen_status === SERVED;
    const alreadyCancelled = order.kitchen_status === CANCELLED;
    const canServe = order.kitchen_status === READY;
    const canCancel = order.kitchen_status === PENDING;

    function updateStatus(status: KitchenStatus) {
        form.transform(() => ({ kitchen_status: status }));
        form.put(`/orders/${order.id}`, {
            preserveScroll: true,
            onStart: () => setTarget(status),
            onFinish: () => setTarget(null),
            onSuccess: () => {
                toast.success(
                    status === CANCELLED
                        ? `Order #${order.id} cancelled`
                        : `Order #${order.id} marked as served`
                );
                onDone();
            },
            onError: () => {
                toast.error(
                    status === CANCELLED
                        ? "Failed to cancel order"
                        : "Failed to mark order as served"
                );
            },
        });
    }

    function handleCancelClick() {
        if (!canCancel) return;
        if (!confirmingCancel) {
            setConfirmingCancel(true);
            confirmTimeout.current = setTimeout(() => setConfirmingCancel(false), 2500);
            return;
        }
        if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
        setConfirmingCancel(false);
        updateStatus(CANCELLED);
    }

    return (
        <div className="grid gap-3">
            <div className="grid gap-1.5">
                <Label className="text-xs">Current status</Label>
                <div>
                    <Badge className={`${KITCHEN_STYLES[order.kitchen_status]} text-[10px]`}>
                        {KITCHEN_LABELS[order.kitchen_status]}
                    </Badge>
                </div>
                {!alreadyServed && !canServe && !alreadyCancelled && (
                    <p className="text-xs text-muted-foreground">
                        Can only be marked served once the kitchen sets it to &ldquo;Ready&rdquo;.
                    </p>
                )}
                {form.errors.kitchen_status && (
                    <p className="text-xs text-destructive">{form.errors.kitchen_status}</p>
                )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={form.processing || !canCancel}
                    onClick={handleCancelClick}
                >
                    {form.processing && target === CANCELLED && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    {alreadyCancelled
                        ? "Already cancelled"
                        : !canCancel
                          ? `Cannot cancel while ${KITCHEN_LABELS[order.kitchen_status].toLowerCase()}`
                          : confirmingCancel
                            ? "Tap again to confirm"
                            : "Cancel order"}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={form.processing || alreadyServed || !canServe}
                    onClick={() => updateStatus(SERVED)}
                >
                    {form.processing && target === SERVED && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    {alreadyServed
                        ? "Already served"
                        : canServe
                          ? "Mark as served"
                          : "Not ready yet"}
                </Button>
            </DialogFooter>
        </div>
    );
}