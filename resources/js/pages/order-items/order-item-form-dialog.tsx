import { useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { KITCHEN_LABELS } from "@/lib/orders";
import type { MenuItemOption, OrderItem, OrderOption } from "@/lib/order-items";

interface OrderItemFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: OrderItem | null;
    orders: OrderOption[];
    menuItems: MenuItemOption[];
}

interface FormData {
    order_id: string;
    menu_item_id: string;
    quantity: string;
    notes: string;
}

const NUM =
    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

export function OrderItemFormDialog({
    open,
    onOpenChange,
    editing,
    orders,
    menuItems,
}: OrderItemFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit Order Item" : "Add Order Item"}</DialogTitle>
                    <DialogDescription>
                        {editing
                            ? "Update this line. The order total is recalculated automatically."
                            : "Add a menu item to an open order. The price is taken from the menu."}
                    </DialogDescription>
                </DialogHeader>
                <OrderItemForm
                    editing={editing}
                    orders={orders}
                    menuItems={menuItems}
                    onDone={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

function OrderItemForm({
    editing,
    orders,
    menuItems,
    onDone,
}: {
    editing: OrderItem | null;
    orders: OrderOption[];
    menuItems: MenuItemOption[];
    onDone: () => void;
}) {
    const form = useForm<FormData>({
        order_id: editing ? String(editing.order_id) : "",
        menu_item_id: editing ? String(editing.menu_item_id) : "",
        quantity: editing ? String(editing.quantity) : "1",
        notes: editing?.notes ?? "",
    });

    const currentOrder = editing?.order;
    const orderOptions =
        currentOrder && !orders.some((o) => o.id === currentOrder.id) ? [...orders, currentOrder] : orders;

    const currentMenu = editing?.menu_item;
    const menuOptions =
        currentMenu && !menuItems.some((m) => m.id === currentMenu.id) ? [...menuItems, currentMenu] : menuItems;

    const selectedMenu = menuOptions.find((m) => String(m.id) === form.data.menu_item_id);
    const qty = parseInt(form.data.quantity, 10) || 0;

    const unitPrice =
        editing && String(editing.menu_item_id) === form.data.menu_item_id
            ? Number(editing.price_at_time)
            : selectedMenu
              ? Number(selectedMenu.price)
              : null;

    function setQty(n: number) {
        form.setData("quantity", String(Math.max(1, n)));
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        form.transform((d) => ({
            order_id: d.order_id === "" ? null : Number(d.order_id),
            menu_item_id: d.menu_item_id === "" ? null : Number(d.menu_item_id),
            quantity: d.quantity === "" ? null : Number(d.quantity),
            notes: d.notes.trim(),
        }));

        const options = { preserveScroll: true, onSuccess: onDone };

        if (editing) {
            form.put(`/order-items/${editing.id}`, options);
        } else {
            form.post("/order-items", options);
        }
    }

    return (
        <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="order_id">Order</Label>
                <Select value={form.data.order_id} onValueChange={(v) => form.setData("order_id", v)}>
                    <SelectTrigger
                        id="order_id"
                        className="w-full"
                        aria-invalid={!!form.errors.order_id}
                    >
                        <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent>
                        {orderOptions.map((o) => (
                            <SelectItem key={o.id} value={String(o.id)}>
                                #{o.id} · {KITCHEN_LABELS[o.kitchen_status]} · {peso.format(Number(o.total))}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {form.errors.order_id && <p className="text-sm text-destructive">{form.errors.order_id}</p>}
                {orderOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground">No open orders. Create an order first.</p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="menu_item_id">Menu item</Label>
                <Select
                    value={form.data.menu_item_id}
                    onValueChange={(v) => form.setData("menu_item_id", v)}
                >
                    <SelectTrigger
                        id="menu_item_id"
                        className="w-full"
                        aria-invalid={!!form.errors.menu_item_id}
                    >
                        <SelectValue placeholder="Select a menu item" />
                    </SelectTrigger>
                    <SelectContent>
                        {menuOptions.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                                {m.name}
                                <span className="ml-2 text-xs text-muted-foreground">
                                    {peso.format(Number(m.price))}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {form.errors.menu_item_id && (
                    <p className="text-sm text-destructive">{form.errors.menu_item_id}</p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={qty <= 1}
                        onClick={() => setQty(qty - 1)}
                    >
                        <Minus className="h-4 w-4" />
                        <span className="sr-only">Decrease</span>
                    </Button>
                    <Input
                        id="quantity"
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        className={`${NUM} text-center`}
                        aria-invalid={!!form.errors.quantity}
                        value={form.data.quantity}
                        onChange={(e) => form.setData("quantity", e.target.value)}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => setQty(qty + 1)}>
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Increase</span>
                    </Button>
                </div>
                {form.errors.quantity && <p className="text-sm text-destructive">{form.errors.quantity}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                    id="notes"
                    placeholder="Optional, e.g. no ice"
                    aria-invalid={!!form.errors.notes}
                    value={form.data.notes}
                    onChange={(e) => form.setData("notes", e.target.value)}
                />
                {form.errors.notes && <p className="text-sm text-destructive">{form.errors.notes}</p>}
            </div>

            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                    {unitPrice !== null ? `${peso.format(unitPrice)} each` : "Select a menu item"}
                </span>
                <span className="font-medium tabular-nums">
                    {unitPrice !== null ? peso.format(unitPrice * qty) : "—"}
                </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={onDone}>
                    Cancel
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editing ? "Save changes" : "Add item"}
                </Button>
            </DialogFooter>
        </form>
    );
}