import { useForm } from "@inertiajs/react";
import { useRef, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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

export type ItemOption = {
    id: number;
    name: string;
    unit?: string | null;
    quantity: number;
    current_stock: number;
    unit_price?: number | string | null;
};

export type ReasonOption = {
    name: string;
    type?: string | null;
};

type MovementType = "in" | "out";

type Line = {
    item_id: string;
    type: MovementType;
    quantity: string;
    unit_price: string;
    reason: string;
};

type FormData = {
    moved_at: string;
    movements: Line[];
};

interface AddMovementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: ItemOption[];
    reasons?: ReasonOption[];
}

const NUM =
    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const TYPE_STYLES: Record<MovementType, string> = {
    in: "border-transparent bg-emerald-600 text-primary-foreground hover:bg-emerald-600 hover:text-primary-foreground",
    out: "border-transparent bg-red-600 text-primary-foreground hover:bg-red-600 hover:text-primary-foreground",
};

const FIELDS = ["type", "item_id", "quantity", "unit_price", "reason"];

function blankLine(type: MovementType = "in"): Line {
    return { item_id: "", type, quantity: "", unit_price: "", reason: "" };
}

function nowLocal() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

function Field({
    label,
    hidden = false,
    children,
}: {
    label: string;
    hidden?: boolean;
    children: ReactNode;
}) {
    return (
        <div className={`grid gap-1.5 ${hidden ? "invisible" : ""}`} aria-hidden={hidden}>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
            {children}
        </div>
    );
}

export function AddMovementDialog({ open, onOpenChange, items, reasons = [] }: AddMovementDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle>Add Movements</DialogTitle>
                    <DialogDescription>
                        Record stock in and stock out for several items at once.
                    </DialogDescription>
                </DialogHeader>
                <MovementForm
                    items={items}
                    reasons={reasons}
                    onDone={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

function MovementForm({
    items,
    reasons,
    onDone,
}: {
    items: ItemOption[];
    reasons: ReasonOption[];
    onDone: () => void;
}) {
    const form = useForm<FormData>({
        moved_at: nowLocal(),
        movements: [blankLine()],
    });

    const scroller = useRef<HTMLDivElement>(null);

    const errors = form.errors as Record<string, string | undefined>;
    const lineError = (i: number, field: string) => errors[`movements.${i}.${field}`];
    const lines = form.data.movements;

    const reasonsFor = (type: MovementType) =>
        reasons.filter((r) => !r.type || r.type === "both" || r.type === type);

    function setLine(i: number, patch: Partial<Line>) {
        form.setData(
            "movements",
            lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l))
        );
    }

    function addLine() {
        form.setData("movements", [...lines, blankLine(lines[lines.length - 1]?.type)]);
        setTimeout(() => {
            scroller.current?.scrollTo({ left: scroller.current.scrollWidth, behavior: "smooth" });
        }, 50);
    }

    function removeLine(i: number) {
        form.setData(
            "movements",
            lines.filter((_, idx) => idx !== i)
        );
    }

    function onFormKeyDown(e: KeyboardEvent<HTMLFormElement>) {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
            e.preventDefault();
        }
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        const count = lines.length;
        form.transform((d) => ({
            moved_at: d.moved_at,
            movements: d.movements.map((l) => ({
                item_id: l.item_id === "" ? null : Number(l.item_id),
                type: l.type,
                quantity: l.quantity === "" ? null : Number(l.quantity),
                unit_price:
                    l.type === "in" && l.unit_price !== "" ? Number(l.unit_price) : null,
                reason: l.reason.trim(),
            })),
        }));
        form.post("/stock-movements/batch", {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    `${count} ${count === 1 ? "movement" : "movements"} saved successfully`
                );
                onDone();
            },
            onError: () => {
                toast.error("Failed to save movements. Please check the form.");
            },
        });
    }

    return (
        <form onSubmit={submit} onKeyDown={onFormKeyDown} className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-3 border-y bg-muted/30 px-6 py-3">
                <Label htmlFor="moved_at" className="text-sm">
                    Date & time
                </Label>
                <Input
                    id="moved_at"
                    type="datetime-local"
                    className="w-56"
                    aria-invalid={!!errors.moved_at}
                    value={form.data.moved_at}
                    onChange={(e) => form.setData("moved_at", e.target.value)}
                />
                {errors.moved_at && <span className="text-xs text-destructive">{errors.moved_at}</span>}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {(errors.quantity || errors.movements) && (
                    <div className="mx-6 mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {errors.quantity ?? errors.movements}
                    </div>
                )}

                <datalist id="reasons-in">
                    {reasonsFor("in").map((r) => (
                        <option key={r.name} value={r.name} />
                    ))}
                </datalist>
                <datalist id="reasons-out">
                    {reasonsFor("out").map((r) => (
                        <option key={r.name} value={r.name} />
                    ))}
                </datalist>

                <div ref={scroller} className="flex items-start gap-3 overflow-x-auto px-6 py-4">
                    {lines.map((line, i) => {
                        const item = items.find((it) => String(it.id) === line.item_id);
                        const isIn = line.type === "in";
                        const rowErrors = FIELDS.map((f) => lineError(i, f)).filter(Boolean);

                        return (
                            <div key={i} className="grid w-56 shrink-0 gap-3 rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Line {i + 1}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={lines.length === 1}
                                        onClick={() => removeLine(i)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Remove line</span>
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-1">
                                    {(["in", "out"] as const).map((t) => (
                                        <Button
                                            key={t}
                                            type="button"
                                            variant="outline"
                                            className={line.type === t ? TYPE_STYLES[t] : ""}
                                            onClick={() =>
                                                setLine(i, {
                                                    type: t,
                                                    unit_price: t === "out" ? "" : line.unit_price,
                                                })
                                            }
                                        >
                                            {t === "in" ? "In" : "Out"}
                                        </Button>
                                    ))}
                                </div>

                                <Field label="Item">
                                    <Select
                                        value={line.item_id}
                                        onValueChange={(v) => setLine(i, { item_id: v })}
                                    >
                                        <SelectTrigger
                                            className="w-full"
                                            aria-invalid={!!lineError(i, "item_id")}
                                        >
                                            <SelectValue placeholder="Select item" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {items.map((it) => (
                                                <SelectItem key={it.id} value={String(it.id)}>
                                                    {it.name}
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        {it.current_stock}
                                                        {it.unit ? ` ${it.unit}` : ""}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="Quantity">
                                    <Input
                                        type="number"
                                        min={1}
                                        step={1}
                                        inputMode="numeric"
                                        className={NUM}
                                        placeholder={String(item?.quantity ?? "0")}
                                        aria-invalid={!!lineError(i, "quantity")}
                                        value={line.quantity}
                                        onChange={(e) => setLine(i, { quantity: e.target.value })}
                                    />
                                </Field>

                                <Field label="Price" hidden={!isIn}>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        inputMode="decimal"
                                        className={NUM}
                                        tabIndex={isIn ? 0 : -1}
                                        title="Blank keeps the current price"
                                        placeholder={
                                            item?.unit_price != null && item.unit_price !== ""
                                                ? Number(item.unit_price).toFixed(2)
                                                : "—"
                                        }
                                        aria-invalid={!!lineError(i, "unit_price")}
                                        value={line.unit_price}
                                        onChange={(e) => setLine(i, { unit_price: e.target.value })}
                                    />
                                </Field>

                                <Field label="Reason">
                                    <Input
                                        list={isIn ? "reasons-in" : "reasons-out"}
                                        placeholder={isIn ? "e.g. Restock" : "e.g. Issued to office"}
                                        aria-invalid={!!lineError(i, "reason")}
                                        value={line.reason}
                                        onChange={(e) => setLine(i, { reason: e.target.value })}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && i === lines.length - 1) addLine();
                                        }}
                                    />
                                </Field>

                                {rowErrors.length > 0 && (
                                    <p className="text-xs text-destructive">{rowErrors.join(" · ")}</p>
                                )}
                            </div>
                        );
                    })}

                    <Button
                        type="button"
                        variant="outline"
                        className="h-auto w-28 shrink-0 self-stretch flex-col gap-1 border-dashed"
                        onClick={addLine}
                    >
                        <Plus className="h-5 w-5" />
                        Add line
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
                <span className="text-sm text-muted-foreground">
                    {lines.length} {lines.length === 1 ? "line" : "lines"}
                </span>
                <div className="flex gap-2">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save {lines.length} {lines.length === 1 ? "movement" : "movements"}
                    </Button>
                </div>
            </div>
        </form>
    );
}