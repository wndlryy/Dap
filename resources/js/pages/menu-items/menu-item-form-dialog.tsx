import { useForm } from "@inertiajs/react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

import { menuImageUrl } from "@/lib/menu-image";

export interface MenuCategoryOption {
    id: number;
    name: string;
}

export interface MenuItem {
    id: number;
    name: string;
    menu_category_id: number;
    price: number | string;
    is_available: boolean;
    image: string | null;
    menu_category?: MenuCategoryOption | null;
}

interface FormData {
    name: string;
    menu_category_id: string;
    price: string;
    is_available: boolean;
    image: File | null;
}

interface MenuItemFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: MenuItem | null;
    categories: MenuCategoryOption[];
}

const NUM =
    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const AVAILABILITY_STYLES = {
    yes: "border-transparent bg-emerald-600 text-primary-foreground hover:bg-emerald-600 hover:text-primary-foreground",
    no: "border-transparent bg-red-600 text-primary-foreground hover:bg-red-600 hover:text-primary-foreground",
};

export function MenuItemFormDialog({ open, onOpenChange, editing, categories }: MenuItemFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
                    <DialogDescription>
                        {editing ? "Update the details of this item." : "Add a new item to your menu."}
                    </DialogDescription>
                </DialogHeader>
                <MenuItemForm
                    editing={editing}
                    categories={categories}
                    onDone={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

function MenuItemForm({
    editing,
    categories,
    onDone,
}: {
    editing: MenuItem | null;
    categories: MenuCategoryOption[];
    onDone: () => void;
}) {
    const form = useForm<FormData>({
        name: editing?.name ?? "",
        menu_category_id: editing ? String(editing.menu_category_id) : "",
        price: editing ? String(editing.price) : "",
        is_available: editing?.is_available ?? true,
        image: null,
    });

    const fileRef = useRef<HTMLInputElement>(null);
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const preview = objectUrl ?? menuImageUrl(editing?.image);

    useEffect(() => {
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [objectUrl]);

    function onFile(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        form.setData("image", file);
        setObjectUrl(file ? URL.createObjectURL(file) : null);
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        form.transform((d) => (editing ? { ...d, _method: "put" } : d));
        form.post(editing ? `/menu-items/${editing.id}` : "/menu-items", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    editing ? "Menu item updated successfully" : "Menu item added successfully"
                );
                onDone();
            },
            onError: () => {
                toast.error(
                    editing
                        ? "Failed to update menu item. Please check the form."
                        : "Failed to add menu item. Please check the form."
                );
            },
        });
    }

    return (
        <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-2">
                <Label>Image</Label>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/50"
                >
                    {preview ? (
                        <>
                            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                            <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                                Click to change
                            </span>
                        </>
                    ) : (
                        <span className="flex flex-col items-center gap-1 text-sm">
                            <ImagePlus className="h-6 w-6" />
                            Choose an image
                        </span>
                    )}
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={onFile}
                />
                {form.errors.image ? (
                    <p className="text-sm text-destructive">{form.errors.image}</p>
                ) : (
                    <p className="text-xs text-muted-foreground">JPG, PNG or GIF, up to 2 MB.</p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    placeholder="e.g. Iced Coffee"
                    aria-invalid={!!form.errors.name}
                    value={form.data.name}
                    onChange={(e) => form.setData("name", e.target.value)}
                />
                {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid content-start gap-2">
                    <Label htmlFor="menu_category_id">Category</Label>
                    <Select
                        value={form.data.menu_category_id}
                        onValueChange={(v) => form.setData("menu_category_id", v)}
                    >
                        <SelectTrigger
                            id="menu_category_id"
                            className="w-full"
                            aria-invalid={!!form.errors.menu_category_id}
                        >
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {form.errors.menu_category_id && (
                        <p className="text-sm text-destructive">{form.errors.menu_category_id}</p>
                    )}
                    {categories.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            No categories yet. Add one in Menu Categories first.
                        </p>
                    )}
                </div>

                <div className="grid content-start gap-2">
                    <Label htmlFor="price">Price</Label>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            ₱
                        </span>
                        <Input
                            id="price"
                            type="number"
                            min={0}
                            step="0.01"
                            inputMode="decimal"
                            className={NUM}
                            style={{ paddingLeft: "1.75rem" }}
                            placeholder="0.00"
                            aria-invalid={!!form.errors.price}
                            value={form.data.price}
                            onChange={(e) => form.setData("price", e.target.value)}
                        />
                    </div>
                    {form.errors.price && <p className="text-sm text-destructive">{form.errors.price}</p>}
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Availability</Label>
                <div className="grid grid-cols-2 gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        className={form.data.is_available ? AVAILABILITY_STYLES.yes : ""}
                        onClick={() => form.setData("is_available", true)}
                    >
                        Available
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className={!form.data.is_available ? AVAILABILITY_STYLES.no : ""}
                        onClick={() => form.setData("is_available", false)}
                    >
                        Unavailable
                    </Button>
                </div>
                {form.errors.is_available && (
                    <p className="text-sm text-destructive">{form.errors.is_available}</p>
                )}
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