import Layout from "@/layouts/app-layout";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { Link, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import {
    ArrowLeft,
    ImageOff,
    LayoutGrid, // NEW: icon for the "All categories" picker button
    Loader2,
    Minus,
    Plus,
    Receipt,
    Search,
    ShoppingBasket,
    StickyNote,
    Trash2,
    X,
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { menuImageUrl } from "@/lib/menu-image";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Category {
    id: number;
    name: string;
}

interface MenuItemCard {
    id: number;
    name: string;
    price: number | string;
    image: string | null;
    menu_category_id: number;
    description?: string | null;
}

interface Waiter {
    id: number;
    name?: string | null;
    username?: string | null;
}

// One row in the order (what gets posted to /orders)
interface Line {
    menu_item_id: number;
    quantity: number;
    notes: string;
}

interface Props {
    categories: Category[];
    menuItems: MenuItemCard[];
    waiter: Waiter;
}

// Philippine peso formatter, reused everywhere prices are shown
const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

/* -------------------------------------------------------------------------- */
/* Small round button used for +/- controls                                   */
/* -------------------------------------------------------------------------- */

function RoundBtn({
    onClick,
    children,
    label,
    filled = false,
    disabled = false,
}: {
    onClick: () => void;
    children: React.ReactNode;
    label: string; // screen-reader label
    filled?: boolean; // filled = primary color, otherwise outlined
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-full transition active:scale-90 disabled:opacity-40 ${
                filled ? "bg-primary text-primary-foreground shadow-sm" : "border border-border bg-card text-foreground"
            }`}
        >
            {children}
            <span className="sr-only">{label}</span>
        </button>
    );
}

/* -------------------------------------------------------------------------- */
/* Order panel (the cart). Rendered in the desktop sidebar AND the mobile     */
/* bottom sheet, so it is its own component.                                  */
/* -------------------------------------------------------------------------- */

interface PanelProps {
    lines: Line[];
    menuById: Map<number, MenuItemCard>;
    errors: Record<string, string | undefined>;
    count: number;
    total: number;
    processing: boolean;
    noteOpen: Set<number>;
    onQty: (id: number, delta: number) => void;
    onNotes: (id: number, notes: string) => void;
    onToggleNote: (id: number) => void;
    onRemove: (id: number) => void;
    onClear: () => void;
    onSubmit: () => void;
}

function OrderPanel(p: PanelProps) {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col px-4">
                {/* Top-level validation error from the server (e.g. "items required") */}
                {p.errors.items && (
                    <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {p.errors.items}
                    </div>
                )}

                {/* Empty state vs. list of order lines */}
                {p.lines.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground">
                        <Receipt className="h-10 w-10 opacity-50" />
                        <span className="text-sm">Tap a dish to start the order.</span>
                    </div>
                ) : (
                    <ul className="min-h-0 flex-1 overflow-y-auto py-2">
                        {p.lines.map((line, index) => {
                            const item = p.menuById.get(line.menu_item_id);
                            if (!item) return null;
                            const price = Number(item.price);

                            // Show the note input if toggled open OR a note already exists
                            const showNote = p.noteOpen.has(line.menu_item_id) || line.notes !== "";

                            // Laravel validation errors come back keyed like "items.0.quantity"
                            const lineError =
                                p.errors[`items.${index}.menu_item_id`] ??
                                p.errors[`items.${index}.quantity`] ??
                                p.errors[`items.${index}.notes`];

                            return (
                                <li key={line.menu_item_id} className="border-b border-dashed border-border py-3 last:border-0">
                                    {/* Row 1: qty badge, name + unit price, line total */}
                                    <div className="flex items-start gap-3">
                                        <span className="mt-0.5 flex h-7 min-w-7 items-center justify-center rounded-md bg-primary/10 px-1.5 text-xs font-bold tabular-nums text-primary">
                                            {line.quantity}×
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-semibold leading-tight">{item.name}</div>
                                            <div className="text-xs tabular-nums text-muted-foreground">
                                                {peso.format(price)} each
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold tabular-nums">
                                            {peso.format(price * line.quantity)}
                                        </span>
                                    </div>

                                    {/* Row 2: -, +, note toggle, remove */}
                                    <div className="mt-2 flex items-center gap-1.5 pl-10">
                                        <RoundBtn onClick={() => p.onQty(line.menu_item_id, -1)} label="Decrease">
                                            {/* At qty 1 the minus becomes a trash icon (it removes the line) */}
                                            {line.quantity <= 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                        </RoundBtn>
                                        <RoundBtn onClick={() => p.onQty(line.menu_item_id, 1)} label="Increase">
                                            <Plus className="h-4 w-4" />
                                        </RoundBtn>
                                        <button
                                            type="button"
                                            onClick={() => p.onToggleNote(line.menu_item_id)}
                                            className="ml-1 inline-flex h-10 touch-manipulation items-center gap-1.5 rounded-full px-3 text-xs font-medium text-primary transition active:bg-primary/10"
                                        >
                                            <StickyNote className="h-3.5 w-3.5" />
                                            {line.notes ? "Edit note" : "Note"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => p.onRemove(line.menu_item_id)}
                                            className="ml-auto flex h-10 w-10 touch-manipulation items-center justify-center rounded-full text-muted-foreground transition hover:text-destructive active:bg-destructive/10"
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Remove</span>
                                        </button>
                                    </div>

                                    {/* Optional per-item note (e.g. "no ice") */}
                                    {showNote && (
                                        <input
                                            placeholder="e.g. no ice, extra spicy"
                                            aria-invalid={!!lineError}
                                            value={line.notes}
                                            onChange={(e) => p.onNotes(line.menu_item_id, e.target.value)}
                                            className="mt-2 ml-10 h-10 w-[calc(100%-2.5rem)] rounded-lg border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                                        />
                                    )}
                                    {lineError && <p className="mt-1 pl-10 text-xs text-destructive">{lineError}</p>}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Footer: total + place order + clear */}
            <div className="border-t border-border p-4">
                <div className="mb-3 flex items-end justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
                        <div className="text-xs text-muted-foreground">
                            {p.count} {p.count === 1 ? "item" : "items"}
                        </div>
                    </div>
                    <div className="text-3xl font-bold tabular-nums tracking-tight">{peso.format(p.total)}</div>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                    <button
                        type="button"
                        disabled={p.lines.length === 0 || p.processing}
                        onClick={p.onSubmit}
                        className="inline-flex h-14 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {p.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Place order
                    </button>
                    <button
                        type="button"
                        disabled={p.lines.length === 0 || p.processing}
                        onClick={p.onClear}
                        className="flex h-14 w-14 touch-manipulation items-center justify-center rounded-2xl border border-border text-muted-foreground transition hover:text-destructive active:bg-destructive/10 disabled:opacity-40"
                    >
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Clear order</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CreateOrderPage({ categories, menuItems, waiter }: Props) {
    // Inertia form: the order lines are the payload posted to /orders
    const form = useForm<{ items: Line[] }>({ items: [] });

    // UI state
    const [category, setCategory] = useState<"all" | number>("all"); // selected category tab
    const [search, setSearch] = useState(""); // dish search text
    const [noteOpen, setNoteOpen] = useState<Set<number>>(new Set()); // which lines have the note input open
    const [cartOpen, setCartOpen] = useState(false); // mobile cart sheet
    const [catsOpen, setCatsOpen] = useState(false); // NEW: "all categories" picker sheet

    // NEW: refs to each tab button so we can scroll the active one into view
    const tabRefs = useRef(new Map<string | number, HTMLButtonElement>());

    const lines = form.data.items;
    const errors = form.errors as Record<string, string | undefined>;
    const waiterName = waiter.name ?? waiter.username ?? "—";

    // Quick lookup: menu item id -> item
    const menuById = new Map(menuItems.map((m) => [m.id, m]));

    // Only show categories that actually have items
    const visibleCategories = categories.filter((c) =>
        menuItems.some((m) => m.menu_category_id === c.id)
    );

    // NEW: single list used by both the tab row and the picker sheet ("All" + real categories)
    const allTabs = [{ id: "all" as const, name: "All" }, ...visibleCategories];

    // Number of items in a category (used for the little count badges)
    const countFor = (id: "all" | number) =>
        id === "all" ? menuItems.length : menuItems.filter((m) => m.menu_category_id === id).length;

    // Filter menu by selected category + search text.
    // Tip: to make search look through the WHOLE menu regardless of category,
    // change the first condition to: (q !== "" || category === "all" || m.menu_category_id === category)
    const q = search.trim().toLowerCase();
    const visibleItems = menuItems.filter(
        (m) =>
            (category === "all" || m.menu_category_id === category) &&
            (q === "" || m.name.toLowerCase().includes(q))
    );

    // Totals for the order
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const total = lines.reduce(
        (sum, l) => sum + Number(menuById.get(l.menu_item_id)?.price ?? 0) * l.quantity,
        0
    );

    // How many of a given dish are already in the order
    const qtyInCart = (id: number) => lines.find((l) => l.menu_item_id === id)?.quantity ?? 0;

    // NEW: whenever the selected category changes (tab click, picker, etc.),
    // scroll its tab into the center of the row so it is never hidden off-screen
    useEffect(() => {
        tabRefs.current.get(category)?.scrollIntoView({
            inline: "center",
            block: "nearest",
            behavior: "smooth",
        });
    }, [category]);

    /* ---- Order line helpers ---- */

    // Add (+1) or subtract (-1) quantity. Lines with qty < 1 are removed. Max 99.
    function changeQty(id: number, delta: number) {
        const existing = lines.find((l) => l.menu_item_id === id);
        if (!existing) {
            if (delta > 0) form.setData("items", [...lines, { menu_item_id: id, quantity: 1, notes: "" }]);
            return;
        }
        form.setData(
            "items",
            lines
                .map((l) =>
                    l.menu_item_id === id ? { ...l, quantity: Math.min(99, l.quantity + delta) } : l
                )
                .filter((l) => l.quantity >= 1)
        );
    }

    // Update the note text of a line
    function setNotes(id: number, notes: string) {
        form.setData(
            "items",
            lines.map((l) => (l.menu_item_id === id ? { ...l, notes } : l))
        );
    }

    // Remove a line completely
    function removeLine(id: number) {
        form.setData(
            "items",
            lines.filter((l) => l.menu_item_id !== id)
        );
    }

    // Show/hide the note input for a line
    function toggleNote(id: number) {
        setNoteOpen((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    // Empty the whole order
    function clearAll() {
        form.setData("items", []);
        setNoteOpen(new Set());
    }

    // Post the order to the server
    function submit() {
        form.post("/orders", {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Order placed successfully");
                setCartOpen(false);
            },
            onError: () => {
                toast.error("Failed to place order. Please check the order.");
            },
        });
    }

    // The cart UI, reused in the desktop sidebar and the mobile sheet
    const panel = (
        <OrderPanel
            lines={lines}
            menuById={menuById}
            errors={errors}
            count={count}
            total={total}
            processing={form.processing}
            noteOpen={noteOpen}
            onQty={changeQty}
            onNotes={setNotes}
            onToggleNote={toggleNote}
            onRemove={removeLine}
            onClear={clearAll}
            onSubmit={submit}
        />
    );

    return (
        // Desktop: menu on the left, cart sidebar (380px) on the right.
        // Mobile: single column with extra bottom padding for the floating cart bar.
        <div className="grid gap-4 pb-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-0">
            <section className="min-w-0">
                {/* Sticky header: back button, search, category tabs */}
                <div className="sticky top-0 z-20 bg-background/90 pb-2 backdrop-blur">
                    <div className="flex items-center gap-2 pt-1">
                        <Link
                            href="/orders"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card transition active:scale-95"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back to orders</span>
                        </Link>
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                placeholder="Search dishes"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-11 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                            />
                        </div>
                    </div>

                    {/* NEW: category row = scrollable tabs + "all categories" button */}
                    <div className="mt-2 flex items-center border-b border-border">
                        <div
                            // Right-edge fade hints that more tabs exist off-screen.
                            // The wheel handler lets desktop mouse users scroll the tabs sideways.
                            className="scrollbar-none flex min-w-0 flex-1 gap-1 overflow-x-auto mask-[linear-gradient(to_right,black_calc(100%-28px),transparent)]"
                            onWheel={(e) => {
                                if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
                            }}
                        >
                            {allTabs.map((c) => {
                                const active = category === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        // Register/unregister this tab so the effect above can scroll to it
                                        ref={(el) => {
                                            if (el) tabRefs.current.set(c.id, el);
                                            else tabRefs.current.delete(c.id);
                                        }}
                                        type="button"
                                        onClick={() => setCategory(c.id)}
                                        className={`-mb-px flex h-11 shrink-0 touch-manipulation items-center gap-1.5 border-b-2 px-3.5 text-sm font-medium transition ${
                                            active
                                                ? "border-primary text-primary"
                                                : "border-transparent text-muted-foreground active:text-foreground"
                                        }`}
                                    >
                                        {c.name}
                                        <span
                                            className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                                                active ? "bg-primary/10" : "bg-muted"
                                            }`}
                                        >
                                            {countFor(c.id)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Opens the grid picker so every category is reachable in one tap */}
                        <button
                            type="button"
                            onClick={() => setCatsOpen(true)}
                            className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center text-muted-foreground active:text-foreground"
                        >
                            <LayoutGrid className="h-5 w-5" />
                            <span className="sr-only">All categories</span>
                        </button>
                    </div>
                </div>

                {/* Menu items grid (or empty state) */}
                {visibleItems.length === 0 ? (
                    <div className="mt-4 flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground">
                        <ShoppingBasket className="h-8 w-8" />
                        <span className="text-sm">No menu items found.</span>
                    </div>
                ) : (
                    <ul className="mt-2 grid gap-2 xl:grid-cols-2">
                        {visibleItems.map((item) => {
                            const src = menuImageUrl(item.image);
                            const inCart = qtyInCart(item.id);
                            return (
                                <li
                                    key={item.id}
                                    // Highlight dishes that are already in the order
                                    className={`flex items-center gap-3 rounded-2xl bg-card p-2.5 transition ${
                                        inCart > 0 ? "ring-2 ring-primary" : "ring-1 ring-border"
                                    }`}
                                >
                                    {/* Tapping the card adds one of this dish */}
                                    <button
                                        type="button"
                                        onClick={() => changeQty(item.id, 1)}
                                        className="flex min-w-0 flex-1 touch-manipulation items-center gap-3 text-left"
                                    >
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                                            {src ? (
                                                <img src={src} alt={item.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <ImageOff className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-sm font-semibold">{item.name}</h3>
                                            {item.description && (
                                                <p className="line-clamp-2 text-xs leading-4 text-muted-foreground">
                                                    {item.description}
                                                </p>
                                            )}
                                            <div className="mt-1 text-sm font-bold tabular-nums text-primary">
                                                {peso.format(Number(item.price))}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Right side: "+" if not in cart, otherwise "- qty +" stepper */}
                                    {inCart > 0 ? (
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <RoundBtn onClick={() => changeQty(item.id, -1)} label="Decrease">
                                                {inCart <= 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                            </RoundBtn>
                                            <span className="min-w-6 text-center text-base font-bold tabular-nums">
                                                {inCart}
                                            </span>
                                            <RoundBtn filled onClick={() => changeQty(item.id, 1)} label="Increase">
                                                <Plus className="h-4 w-4" />
                                            </RoundBtn>
                                        </div>
                                    ) : (
                                        <RoundBtn filled onClick={() => changeQty(item.id, 1)} label={`Add ${item.name}`}>
                                            <Plus className="h-5 w-5" />
                                        </RoundBtn>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Desktop cart sidebar (hidden below lg) */}
            <aside className="sticky top-0 hidden h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border lg:flex">
                <div className="border-b border-border p-4">
                    <h2 className="text-lg font-bold tracking-tight">Current order</h2>
                    <p className="text-xs text-muted-foreground">
                        Waiter: <span className="font-medium text-foreground">{waiterName}</span>
                    </p>
                </div>
                {panel}
            </aside>

            {/* Mobile floating cart bar: slides up once something is in the order */}
            <button
                type="button"
                onClick={() => setCartOpen(true)}
                className={`fixed inset-x-4 bottom-4 z-30 flex h-14 touch-manipulation items-center gap-3 rounded-full bg-primary px-5 text-primary-foreground shadow-xl transition-all duration-200 active:scale-[0.98] lg:hidden ${
                    count > 0 ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
                }`}
            >
                <Receipt className="h-5 w-5" />
                <span className="flex-1 text-left text-sm font-semibold">
                    {count} {count === 1 ? "item" : "items"}
                </span>
                <span className="text-base font-bold tabular-nums">{peso.format(total)}</span>
            </button>

            {/* Mobile cart bottom sheet */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetContent side="bottom" className="flex h-[85dvh] flex-col gap-0 rounded-t-3xl bg-card p-0 lg:hidden">
                    <SheetHeader className="border-b border-border p-4 pr-14 text-left">
                        <SheetTitle className="text-lg font-bold tracking-tight">Current order</SheetTitle>
                        <SheetDescription className="text-sm">
                            Waiter: <span className="font-medium text-foreground">{waiterName}</span>
                        </SheetDescription>
                    </SheetHeader>
                    {panel}
                </SheetContent>
            </Sheet>

            {/* NEW: category picker sheet — grid of every category, handy when there are many */}
            <Sheet open={catsOpen} onOpenChange={setCatsOpen}>
                <SheetContent side="bottom" className="max-h-[70dvh] rounded-t-3xl bg-card">
                    <SheetHeader className="text-left">
                        <SheetTitle>Categories</SheetTitle>
                        <SheetDescription className="sr-only">Pick a category to filter the menu</SheetDescription>
                    </SheetHeader>
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto p-4 pt-0 sm:grid-cols-3">
                        {allTabs.map((c) => {
                            const active = category === c.id;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                        setCategory(c.id);
                                        setCatsOpen(false); // close after choosing
                                    }}
                                    className={`flex h-14 touch-manipulation items-center justify-between gap-2 rounded-xl px-3 text-left text-sm font-medium transition active:scale-[0.98] ${
                                        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                    }`}
                                >
                                    <span className="line-clamp-2">{c.name}</span>
                                    <span className="text-xs tabular-nums opacity-70">{countFor(c.id)}</span>
                                </button>
                            );
                        })}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

// Wrap the page in the app layout
CreateOrderPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;