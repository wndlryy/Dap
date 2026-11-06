import { useForm } from "@inertiajs/react";
import { useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
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
import type { Item } from "./columns";

interface Category {
    id: number;
    name: string;
}

interface ItemRow {
    name: string;
    unit: string;
    unit_price: string;
    current_stock: string;
    reorder_level: string;
}

interface FormData {
    category_id: string;
    items: ItemRow[];
}

interface ItemFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: Item | null;
    categories: Category[];
}

const NUM =
    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function emptyRow(): ItemRow {
    return { name: "", unit: "", unit_price: "", current_stock: "", reorder_level: "" };
}

function Field({
    label,
    error,
    hint,
    children,
}: {
    label: string;
    error?: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export function ItemFormDialog({ open, onOpenChange, editing, categories }: ItemFormDialogProps) {
    const isEdit = !!editing;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className={`flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 ${
                    isEdit ? "sm:max-w-md" : "sm:max-w-5xl"
                }`}
            >
                <DialogHeader className="p-4 pb-3 md:p-6 md:pb-4">
                    <DialogTitle>{isEdit ? "Edit Item" : "Add Items"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update this item's details."
                            : "Add one or more items to a category. Use “Add item” for more rows."}
                    </DialogDescription>
                </DialogHeader>
                <ItemForm
                    editing={editing}
                    categories={categories}
                    onDone={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

function ItemForm({
    editing,
    categories,
    onDone,
}: {
    editing: Item | null;
    categories: Category[];
    onDone: () => void;
}) {
    const isEdit = !!editing;

    const form = useForm<FormData>({
        category_id: editing?.category_id ? String(editing.category_id) : "",
        items: [
            editing
                ? {
                      name: editing.name ?? "",
                      unit: editing.unit ?? "",
                      unit_price: String(editing.unit_price ?? ""),
                      current_stock:
                          editing.current_stock !== undefined ? String(editing.current_stock) : "",
                      reorder_level:
                          editing.reorder_level !== undefined ? String(editing.reorder_level) : "",
                  }
                : emptyRow(),
        ],
    });

    const addRef = useRef<HTMLButtonElement>(null);

    const [initial] = useState(() => ({
        category_id: editing?.category_id ? String(editing.category_id) : "",
        name: editing?.name ?? "",
        unit: editing?.unit ?? "",
        reorder_level: editing?.reorder_level !== undefined ? String(editing.reorder_level) : "",
    }));

    const errors = form.errors as Record<string, string | undefined>;
    const rowError = (i: number, field: keyof ItemRow) =>
        isEdit ? errors[field] : errors[`items.${i}.${field}`];
    const rows = form.data.items;

    const totalValue = rows.reduce((sum, row) => {
        const price = parseFloat(row.unit_price) || 0;
        const stock = parseFloat(row.current_stock) || 0;
        return sum + price * stock;
    }, 0);

    const isDirty =
        !isEdit ||
        form.data.category_id !== initial.category_id ||
        rows[0].name !== initial.name ||
        rows[0].unit !== initial.unit ||
        rows[0].reorder_level !== initial.reorder_level;

    function updateRow(index: number, field: keyof ItemRow, value: string) {
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
        if (!isEdit && e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
            e.preventDefault();
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (editing) {
            form.transform((data) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { unit_price, current_stock, ...rest } = data.items[0];
                return { category_id: data.category_id, ...rest };
            });
            form.put(`/items/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Item updated successfully");
                    onDone();
                },
                onError: () => {
                    toast.error("Failed to update item. Please check the form.");
                },
            });
            return;
        }

        const count = rows.length;
        form.transform((data) => data);
        form.post("/items/batch", {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${count} ${count === 1 ? "item" : "items"} added successfully`);
                onDone();
            },
            onError: () => {
                toast.error("Failed to add items. Please check the form.");
            },
        });
    }

    const lockedHint = "Changed via Stock Movements, not here.";

    return (
        <form
            onSubmit={handleSubmit}
            onKeyDown={onFormKeyDown}
            noValidate
            className="flex min-h-0 flex-1 flex-col"
        >
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

                <div
                    className={`flex flex-col gap-3 px-4 py-4 md:px-6 ${
                        isEdit ? "" : "md:flex-row md:items-start md:overflow-x-auto"
                    }`}
                >
                    {rows.map((row, i) => (
                        <div
                            key={i}
                            className={`grid w-full gap-3 rounded-lg border p-3 ${
                                isEdit ? "" : "md:w-56 md:shrink-0"
                            }`}
                        >
                            {!isEdit && (
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
                            )}

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

                            <Field
                                label="Price"
                                error={rowError(i, "unit_price")}
                                hint={isEdit ? lockedHint : undefined}
                            >
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    inputMode="decimal"
                                    className={`${NUM} ${isEdit ? "cursor-not-allowed bg-muted" : ""}`}
                                    placeholder="0.00"
                                    disabled={isEdit}
                                    aria-invalid={!!rowError(i, "unit_price")}
                                    value={row.unit_price}
                                    onChange={(e) => updateRow(i, "unit_price", e.target.value)}
                                />
                            </Field>

                            <Field
                                label="Stock"
                                error={rowError(i, "current_stock")}
                                hint={isEdit ? lockedHint : undefined}
                            >
                                <Input
                                    type="number"
                                    min={0}
                                    inputMode="numeric"
                                    className={`${NUM} ${isEdit ? "cursor-not-allowed bg-muted" : ""}`}
                                    placeholder="0"
                                    disabled={isEdit}
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
                                        if (!isEdit && e.key === "Enter" && i === rows.length - 1) addRow();
                                    }}
                                />
                            </Field>
                        </div>
                    ))}

                    {!isEdit && (
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
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-4">
                {isEdit ? (
                    <div />
                ) : (
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
                )}
                <div className="flex w-full gap-2 sm:w-auto">
                    <Button
                        type="submit"
                        className="flex-1 sm:flex-none"
                        disabled={form.processing || !isDirty}
                    >
                        {form.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isEdit
                            ? form.processing
                                ? "Saving..."
                                : "Save Changes"
                            : form.processing
                              ? "Adding..."
                              : `Add ${rows.length} ${rows.length === 1 ? "Item" : "Items"}`}
                    </Button>
                </div>
            </div>
        </form>
    );
}