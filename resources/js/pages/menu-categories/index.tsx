import Layout from "@/layouts/app-layout";
import { useEffect, useState, type ReactElement } from "react";
import { router } from "@inertiajs/react";
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
import { ChevronLeft, ChevronRight, FolderOpen, MoreHorizontal, Plus } from "lucide-react";
import { MenuCategoryFormDialog, type MenuCategory } from "./menu-category-form-dialog";
import { DeleteMenuCategoryDialog } from "./delete-menu-category-dialog";

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
    menuCategories: Paginated<MenuCategory>;
}

const dateFmt = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" });

export default function MenuCategoriesPage({ menuCategories }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<MenuCategory | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<MenuCategory | null>(null);
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
        if (menuCategories.data.length === 0 && menuCategories.prev_page_url) {
            router.get(menuCategories.prev_page_url, {}, { replace: true, preserveScroll: true });
        }
    }, [menuCategories]);

    function openCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(category: MenuCategory) {
        setEditing(category);
        setFormOpen(true);
    }

    function goTo(url: string | null) {
        if (url) router.get(url, {}, { preserveState: true, preserveScroll: true });
    }

    return (
        <div className="grid gap-4">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-semibold">Menu Categories</h1>
                    <p className="text-sm text-muted-foreground">
                        {menuCategories.total} {menuCategories.total === 1 ? "category" : "categories"}
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Add Category
                </Button>
            </div>

            <div className={`rounded-md border transition-opacity ${loading ? "opacity-60" : ""}`}>
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-16">No.</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden sm:table-cell">Created</TableHead>
                            <TableHead className="w-20 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {menuCategories.data.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={4} className="h-40">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <FolderOpen className="h-8 w-8" />
                                        <span className="text-sm">No menu categories yet.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            menuCategories.data.map((category, i) => (
                                <TableRow key={category.id}>
                                    <TableCell className="text-muted-foreground">
                                        {(menuCategories.from ?? 1) + i}
                                    </TableCell>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                                        {category.created_at ? dateFmt.format(new Date(category.created_at)) : "—"}
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
                                                <DropdownMenuItem onClick={() => openEdit(category)}>
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => setDeleteTarget(category)}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                    {menuCategories.total === 0
                        ? "0 results"
                        : `Showing ${menuCategories.from}–${menuCategories.to} of ${menuCategories.total}`}
                </span>
                <div className="flex items-center gap-2">
                    <span className="mr-2">
                        Page {menuCategories.current_page} of {menuCategories.last_page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!menuCategories.prev_page_url}
                        onClick={() => goTo(menuCategories.prev_page_url)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!menuCategories.next_page_url}
                        onClick={() => goTo(menuCategories.next_page_url)}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <MenuCategoryFormDialog
                key={editing?.id ?? "new"}
                open={formOpen}
                onOpenChange={setFormOpen}
                editing={editing}
            />

            <DeleteMenuCategoryDialog
                target={deleteTarget}
                onOpenChange={(v) => {
                    if (!v) setDeleteTarget(null);
                }}
            />
        </div>
    );
}

MenuCategoriesPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;