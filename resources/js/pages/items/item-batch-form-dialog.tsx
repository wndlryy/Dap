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

interface Category {
    id: number;
    name: string;
}

interface BatchItemRow {
    name: string;
    unit: string;
    unit_price: string;
    current_stock: string;
    reorder_level: string;
}

interface FormData {
    category_id: string;
    items: BatchItemRow[];
}

interface ItemBatchFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
}

const NUM =
    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function emptyRow(): BatchItemRow {
    return {
        name: "",
        unit: "",
        unit_price: "",
        current_stock: "",
        reorder_level: "",
    };
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export function ItemBatchFormDialog({
    open,
    onOpenChange,
    categories,
}: ItemBatchFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
            >
                <DialogHeader className="p-4 pb-3 md:p-6 md:pb-4">
                    <DialogTitle>Add Multiple Items</DialogTitle>
                    <DialogDescription>
                        Add several items to one category at once.
                    </DialogDescription>
                </DialogHeader>
                <ItemBatchForm
                    categories={categories}
                    onDone={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

function ItemBatchForm({
    categories,
    onDone,
}: {
    categories: Category[];
    onDone: () => void;
}) {
    const form = useForm<FormData>({
        category_id: "",
        items: [emptyRow()],
    });

    const addRef = useRef<HTMLButtonElement>(null);

    const errors = form.errors as Record<string, string | undefined>;
    const rowError = (i: number, field: keyof BatchItemRow) => errors[`items.${i}.${field}`];
    const rows = form.data.items;

    const totalValue = rows.reduce((sum, row) => {
        const price = parseFloat(row.unit_price) || 0;
        const stock = parseFloat(row.current_stock) || 0;
        return sum + price * stock;
    }, 0);

    function updateRow(index: number, field: keyof BatchItemRow, value: string) {
        form.setData(
            "items",
            rows.map((r, i) => (i === index ? { ...r, [field]: value } : r))
        );
    }

    function addRow() {
        form.setData("items", [...rows, emptyRow()]);
        setTimeout(() => {
            addRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }, 50);
    }

    function removeRow(index: number) {
        if (rows.length === 1) return;
        form.setData(
            "items",
            rows.filter((_, i) => i !== index)
        );
    }

    function onFormKeyDown(e: KeyboardEvent<HTMLFormElement>) {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
            e.preventDefault();
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const count = rows.length;
        form.post("/items/batch", {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    `${count} ${count === 1 ? "item" : "items"} added successfully`
                );
                onDone();
            },
            onError: () => {
                toast.error("Failed to add items. Please check the form.");
            },
        });
    }

    return (
        <form onSubmit={handleSubmit} onKeyDown={onFormKeyDown} className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-col gap-2 border-y bg-muted/30 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 md:px-6">
                <Label htmlFor="category_id" className="text-sm">
                    Category
                </Label>
                <Select
                    value={form.data.category_id}
                    onValueChange={(value: string) => form.setData("category_id", value)}
                >
                    <SelectTrigger
                        id="category_id"
                        className="w-full sm:w-64"
                        aria-invalid={!!errors.category_id}
                    >
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.category_id && (
                    <span className="text-xs text-destructive">{errors.category_id}</span>
                )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {errors.items && (
                    <div className="mx-4 mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive md:mx-6">
                        {errors.items}
                    </div>
                )}

                <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-start md:overflow-x-auto md:px-6">
                    {rows.map((row, i) => (
                        <div key={i} className="grid w-full gap-3 rounded-lg border p-3 md:w-56 md:shrink-0">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Item {i + 1}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={rows.length === 1}
                                    onClick={() => removeRow(i)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove item</span>
                                </Button>
                            </div>

                            <Field label="Name" error={rowError(i, "name")}>
                                <Input
                                    placeholder="Item name"
                                    aria-invalid={!!rowError(i, "name")}
                                    value={row.name}
                                    onChange={(e) => updateRow(i, "name", e.target.value)}
                                />
                            </Field>

                            <Field label="Unit" error={rowError(i, "unit")}>
                                <Input
                                    placeholder="pcs"
                                    aria-invalid={!!rowError(i, "unit")}
                                    value={row.unit}
                                    onChange={(e) => updateRow(i, "unit", e.target.value)}
                                />
                            </Field>

                            <Field label="Price" error={rowError(i, "unit_price")}>
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    inputMode="decimal"
                                    className={NUM}
                                    placeholder="0.00"
                                    aria-invalid={!!rowError(i, "unit_price")}
                                    value={row.unit_price}
                                    onChange={(e) => updateRow(i, "unit_price", e.target.value)}
                                />
                            </Field>

                            <Field label="Stock" error={rowError(i, "current_stock")}>
                                <Input
                                    type="number"
                                    min={0}
                                    inputMode="numeric"
                                    className={NUM}
                                    placeholder="0"
                                    aria-invalid={!!rowError(i, "current_stock")}
                                    value={row.current_stock}
                                    onChange={(e) => updateRow(i, "current_stock", e.target.value)}
                                />
                            </Field>

                            <Field label="Reorder level" error={rowError(i, "reorder_level")}>
                                <Input
                                    type="number"
                                    min={0}
                                    inputMode="numeric"
                                    className={NUM}
                                    placeholder="0"
                                    aria-invalid={!!rowError(i, "reorder_level")}
                                    value={row.reorder_level}
                                    onChange={(e) => updateRow(i, "reorder_level", e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && i === rows.length - 1) addRow();
                                    }}
                                />
                            </Field>
                        </div>
                    ))}

                    <Button
                        ref={addRef}
                        type="button"
                        variant="outline"
                        className="w-full border-dashed md:h-auto md:w-28 md:shrink-0 md:flex-col md:gap-1 md:self-stretch"
                        onClick={addRow}
                    >
                        <Plus className="h-5 w-5" />
                        Add item
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-4">
                <div className="flex items-center justify-between gap-4 text-sm sm:justify-start">
                    <span className="text-muted-foreground">
                        {rows.length} {rows.length === 1 ? "item" : "items"}
                    </span>
                    <span className="font-medium">
                        Total value: ₱
                        {totalValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                    <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={onDone}>
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1 sm:flex-none" disabled={form.processing}>
                        {form.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        {form.processing
                            ? "Adding..."
                            : `Add ${rows.length} ${rows.length === 1 ? "Item" : "Items"}`}
                    </Button>
                </div>
            </div>
        </form>
    );
}