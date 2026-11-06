import { useForm } from "@inertiajs/react";
import { useState, type FormEvent } from "react";
import { Banknote, Loader2, Smartphone, Wallet, type LucideIcon } from "lucide-react";
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
import { methodLabel, peso, personName, type PayableOrder } from "@/lib/payments";

interface PayDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: PayableOrder | null;
    methods: string[];
}

interface FormData {
    order_id: number;
    payment_method: string;
    reference_number: string;
}

const NUM =
    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const METHOD_ICONS: Record<string, LucideIcon> = {
    cash: Banknote,
    gcash: Smartphone,
};

const ALLOWED_METHODS = ["cash", "gcash"];

const SELECTED =
    "border-transparent bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground";

const QUICK_AMOUNTS = [100, 200, 500, 1000];

export function PayDialog({ open, onOpenChange, order, methods }: PayDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Take Payment {order ? `· Order #${order.id}` : ""}</DialogTitle>
                    <DialogDescription>Confirm the amount and how the customer is paying.</DialogDescription>
                </DialogHeader>
                {order && (
                    <PayForm
                        key={order.id}
                        order={order}
                        methods={methods}
                        onDone={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function PayForm({
    order,
    methods: allMethods,
    onDone,
}: {
    order: PayableOrder;
    methods: string[];
    onDone: () => void;
}) {
    const methods = allMethods.filter((m) => ALLOWED_METHODS.includes(m));

    const form = useForm<FormData>({
        order_id: order.id,
        payment_method: methods[0] ?? "cash",
        reference_number: "",
    });
    const [received, setReceived] = useState("");

    const total = Number(order.total);
    const totalCents = Math.round(total * 100);
    const receivedCents = Math.round((parseFloat(received) || 0) * 100);
    const isCash = form.data.payment_method === "cash";
    const short = receivedCents > 0 && receivedCents < totalCents;
    const changeCents = Math.max(0, receivedCents - totalCents);
    const quick = QUICK_AMOUNTS.filter((v) => v * 100 > totalCents);

    const canSubmit = isCash ? receivedCents >= totalCents : form.data.reference_number.trim() !== "";

    function submit(e: FormEvent) {
        e.preventDefault();
        form.transform((d) => ({
            ...d,
            reference_number: d.payment_method === "cash" ? null : d.reference_number.trim(),
        }));
        form.post("/payments", {
            preserveScroll: true,
            onSuccess: onDone,
        });
    }

    return (
        <form onSubmit={submit} className="grid gap-4">
            {form.errors.order_id && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {form.errors.order_id}
                </div>
            )}

            <div className="rounded-lg border">
                <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground">
                    <span>Waiter: {personName(order.user)}</span>
                    <span>{order.items.length} {order.items.length === 1 ? "item" : "items"}</span>
                </div>
                <ul className="max-h-40 divide-y overflow-y-auto text-sm">
                    {order.items.map((line) => (
                        <li key={line.id} className="flex items-start justify-between gap-3 px-3 py-2">
                            <div className="min-w-0">
                                <span className="font-medium tabular-nums">{line.quantity}×</span>{" "}
                                {line.menu_item?.name ?? "Removed item"}
                                {line.notes && (
                                    <p className="text-xs italic text-muted-foreground">{line.notes}</p>
                                )}
                            </div>
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                                {peso.format(Number(line.price_at_time) * line.quantity)}
                            </span>
                        </li>
                    ))}
                </ul>
                <div className="flex items-center justify-between border-t bg-muted/40 px-3 py-3">
                    <span className="text-sm text-muted-foreground">Total due</span>
                    <span className="text-2xl font-semibold tabular-nums">{peso.format(total)}</span>
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Payment method</Label>
                <div className="grid grid-cols-2 gap-2">
                    {methods.map((m) => {
                        const Icon = METHOD_ICONS[m] ?? Wallet;
                        const selected = form.data.payment_method === m;
                        return (
                            <Button
                                key={m}
                                type="button"
                                variant="outline"
                                aria-pressed={selected}
                                className={`h-auto flex-col gap-1 py-2.5 ${selected ? SELECTED : ""}`}
                                onClick={() => form.setData("payment_method", m)}
                            >
                                <Icon className="h-4 w-4" />
                                {methodLabel(m)}
                            </Button>
                        );
                    })}
                </div>
                {form.errors.payment_method && (
                    <p className="text-sm text-destructive">{form.errors.payment_method}</p>
                )}
            </div>

            {isCash ? (
                <div className="grid gap-2">
                    <Label htmlFor="received">Amount received</Label>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            ₱
                        </span>
                        <Input
                            id="received"
                            type="number"
                            min={0}
                            step="0.01"
                            inputMode="decimal"
                            autoFocus
                            className={NUM}
                            style={{ paddingLeft: "1.75rem" }}
                            placeholder="0.00"
                            value={received}
                            onChange={(e) => setReceived(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setReceived(String(total))}
                        >
                            Exact
                        </Button>
                        {quick.map((v) => (
                            <Button
                                key={v}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setReceived(String(v))}
                            >
                                {peso.format(v)}
                            </Button>
                        ))}
                    </div>
                    <div
                        className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                            short ? "border-destructive/40 bg-destructive/5" : "bg-muted/30"
                        }`}
                    >
                        <span className="text-muted-foreground">{short ? "Short by" : "Change"}</span>
                        <span className={`text-base font-semibold tabular-nums ${short ? "text-destructive" : ""}`}>
                            {peso.format((short ? totalCents - receivedCents : changeCents) / 100)}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="grid gap-2">
                    <Label htmlFor="reference_number">Reference number</Label>
                    <Input
                        id="reference_number"
                        autoFocus
                        placeholder="Transaction or reference no."
                        aria-invalid={!!form.errors.reference_number}
                        value={form.data.reference_number}
                        onChange={(e) => form.setData("reference_number", e.target.value)}
                    />
                    {form.errors.reference_number && (
                        <p className="text-sm text-destructive">{form.errors.reference_number}</p>
                    )}
                </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={onDone}>
                    Cancel
                </Button>
                <Button type="submit" disabled={form.processing || !canSubmit}>
                    {form.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm payment · {peso.format(total)}
                </Button>
            </DialogFooter>
        </form>
    );
}