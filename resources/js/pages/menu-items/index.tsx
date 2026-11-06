import Layout from "@/layouts/app-layout";
import { useEffect, useState, type ReactElement } from "react";
import { router } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ChevronLeft,
    ChevronRight,
    ImageOff,
    MoreHorizontal,
    Plus,
    UtensilsCrossed,
} from "lucide-react";
import {
    MenuItemFormDialog,
    type MenuCategoryOption,
    type MenuItem,
} from "./menu-item-form-dialog";
import { menuImageUrl } from "@/lib/menu-image";
import { DeleteMenuItemDialog } from "./delete-menu-item-dialog";

interface Paginated<T> {
    data: T[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    menuItems: Paginated<MenuItem>;
    menuCategories: MenuCategoryOption[];
}

const STATUS_STYLES = {
    available: "border-transparent bg-emerald-600 text-primary-foreground hover:bg-emerald-600",
    unavailable: "border-transparent bg-red-600 text-primary-foreground hover:bg-red-600",
};

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

export default function MenuItemsPage({ menuItems, menuCategories }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<MenuItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const off1 = router.on("start", () => setLoading(true));
        const off2 = router.on("finish", () => setLoading(false));
        return () => {
            off1();
            off2();
        };
    }, []);

    useEffect(() => {
        if (menuItems.data.length === 0 && menuItems.prev_page_url) {
            router.get(menuItems.prev_page_url, {}, { replace: true, preserveScroll: true });
        }
    }, [menuItems]);

    function openCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(item: MenuItem) {
        setEditing(item);
        setFormOpen(true);
    }

    function goTo(url: string | null) {
        if (url) router.get(url, {}, { preserveState: true, preserveScroll: true });
    }

    return (
        <div className="grid gap-4">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-semibold">Menu Items</h1>
                    <p className="text-sm text-muted-foreground">
                        {menuItems.total} {menuItems.total === 1 ? "item" : "items"}
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Add Item
                </Button>
            </div>

            <div className={`rounded-md border transition-opacity ${loading ? "opacity-60" : ""}`}>
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="hidden w-16 sm:table-cell">No.</TableHead>
                            <TableHead className="w-20">Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Category</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-20 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {menuItems.data.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={7} className="h-40">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <UtensilsCrossed className="h-8 w-8" />
                                        <span className="text-sm">No menu items yet.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            menuItems.data.map((item, i) => {
                                const src = menuImageUrl(item.image);
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                                            {(menuItems.from ?? 1) + i}
                                        </TableCell>
                                        <TableCell>
                                            {src ? (
                                                <img
                                                    src={src}
                                                    alt={item.name}
                                                    className="h-10 w-10 rounded-md border object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                                                    <ImageOff className="h-4 w-4" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {item.name}
                                            <div className="text-xs font-normal text-muted-foreground md:hidden">
                                                {item.menu_category?.name ?? "—"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden text-muted-foreground md:table-cell">
                                            {item.menu_category?.name ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {peso.format(Number(item.price))}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    item.is_available
                                                        ? STATUS_STYLES.available
                                                        : STATUS_STYLES.unavailable
                                                }
                                            >
                                                {item.is_available ? "Available" : "Unavailable"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openEdit(item)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => setDeleteTarget(item)}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                    {menuItems.total === 0
                        ? "0 results"
                        : `Showing ${menuItems.from}–${menuItems.to} of ${menuItems.total}`}
                </span>
                <div className="flex items-center gap-2">
                    <span className="mr-2">
                        Page {menuItems.current_page} of {menuItems.last_page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!menuItems.prev_page_url}
                        onClick={() => goTo(menuItems.prev_page_url)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!menuItems.next_page_url}
                        onClick={() => goTo(menuItems.next_page_url)}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <MenuItemFormDialog
                key={editing?.id ?? "new"}
                open={formOpen}
                onOpenChange={setFormOpen}
                editing={editing}
                categories={menuCategories}
            />

            <DeleteMenuItemDialog
                target={deleteTarget}
                onOpenChange={(v) => {
                    if (!v) setDeleteTarget(null);
                }}
            />
        </div>
    );
}

MenuItemsPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;