import Layout from "@/layouts/app-layout";
import { useMemo, useState, type ReactElement } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowDownUp,
    ArrowUpRight,
    CheckCircle2,
    ChefHat,
    ChevronLeft,
    ChevronRight,
    Clock3,
    CreditCard,
    Plus,
    ReceiptText,
    ShoppingBag,
    UserRound,
    UtensilsCrossed,
} from "lucide-react";
import {
    KITCHEN_LABELS,
    KITCHEN_STATUSES,
    KITCHEN_STYLES,
    PAYMENT_LABELS,
    PAYMENT_STYLES,
    type MenuItem,
    type Order,
} from "@/lib/orders";
import { OrderStatusDialog } from "./order-status-dialog";

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

interface Filters {
    kitchen_status: string;
    payment_status: string;
}

interface Props {
    orders: Paginated<Order>;
    filters: Filters;
    menuItems: MenuItem[];
}

const peso = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
});
const timeFmt = new Intl.DateTimeFormat("en-PH", { timeStyle: "short" });
const dayFmt = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });
const NO_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

function timeAgo(date: Date) {
    const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return dayFmt.format(date);
}

function customerOf(order: Order) {
    return order.user?.name ?? order.user?.username ?? "Walk-in customer";
}

function SummaryCard({
    label,
    value,
    note,
    icon: Icon,
    iconClass,
}: {
    label: string;
    value: string | number;
    note: string;
    icon: typeof ShoppingBag;
    iconClass: string;
}) {
    return (
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{value}</p>
                </div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{note}</p>
        </div>
    );
}

function OrderTicket({ order, onOpen }: { order: Order; onOpen: () => void }) {
    const created = new Date(order.created_at);
    const stage = KITCHEN_STATUSES.indexOf(
        order.kitchen_status as (typeof KITCHEN_STATUSES)[number],
    );
    const itemCount = order.items_count ?? 0;
    const normalizedStatus = String(order.kitchen_status).toLowerCase();
    const isCancelled = normalizedStatus === "cancelled" || normalizedStatus === "canceled";
    const isServed = normalizedStatus === "served";

    return (
        <li className="min-w-0">
            <button
                type="button"
                onClick={onOpen}
                className="group flex h-full w-full flex-col rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.99] sm:p-5"
                aria-label={`Open order ${order.id} for ${customerOf(order)}`}
            >
                <div className="flex w-full items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                            <ReceiptText className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Order</p>
                            <p className="mt-0.5 text-lg font-bold tracking-tight tabular-nums">#{order.id}</p>
                        </div>
                    </div>
                    <Badge className={`${KITCHEN_STYLES[order.kitchen_status]} max-w-[48%] shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold`}>
                        {KITCHEN_LABELS[order.kitchen_status] ?? order.kitchen_status}
                    </Badge>
                </div>

                {isCancelled ? (
                    <div className="mt-5" role="img" aria-label="Order cancelled">
                        <div className="mb-2 text-[11px] text-red-600 dark:text-red-400">Cancelled</div>
                        <div className="h-1.5 w-full rounded-full bg-red-500" />
                    </div>
                ) : isServed ? (
                    <div className="mt-5" role="img" aria-label="Order served">
                        <div className="mb-2 text-[11px] text-emerald-600 dark:text-emerald-400">Served</div>
                        <div className="h-1.5 w-full rounded-full bg-emerald-500" />
                    </div>
                ) : stage >= 0 ? (
                    <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Kitchen progress</span>
                            <span>{stage + 1} of {KITCHEN_STATUSES.length}</span>
                        </div>
                        <div className="flex gap-1.5" role="img" aria-label={`Kitchen stage ${stage + 1} of ${KITCHEN_STATUSES.length}`}>
                            {KITCHEN_STATUSES.map((status, index) => (
                                <span
                                    key={status}
                                    className={`h-1.5 flex-1 rounded-full ${index <= stage ? "bg-emerald-500" : "bg-muted"}`}
                                />
                            ))}
                        </div>
                    </div>
                ) : null}

                <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                        <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate font-medium">{customerOf(order)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                        </span>
                        <span className="flex items-center gap-1.5" title={`${dayFmt.format(created)}, ${timeFmt.format(created)}`}>
                            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                            {timeAgo(created)}
                        </span>
                    </div>
                </div>

                <div className="mt-5 flex items-end justify-between gap-3 border-t border-border/70 pt-4">
                    <div className="min-w-0">
                        <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Payment</p>
                        <Badge className={`${PAYMENT_STYLES[order.payment_status]} rounded-full px-2.5 py-1 text-[11px] font-semibold`}>
                            {PAYMENT_LABELS[order.payment_status] ?? order.payment_status}
                        </Badge>
                    </div>
                    <div className="text-right">
                        <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Order total</p>
                        <p className="text-lg font-bold tracking-tight tabular-nums">{peso.format(Number(order.total))}</p>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-1 text-xs font-semibold text-primary opacity-80 transition group-hover:opacity-100">
                    View order <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
            </button>
        </li>
    );
}

export default function OrdersPage({ orders, filters, menuItems }: Props) {
    const { auth } = usePage().props as { auth: { user?: { name?: string | null } } };
    const userName = auth.user?.name ?? "there";
    const [selected, setSelected] = useState(filters.kitchen_status || "all");
    const [sort, setSort] = useState<"asc" | "desc">("desc");
    const [editing, setEditing] = useState<Order | null>(null);
    const [statusOpen, setStatusOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const hasFilters = filters.kitchen_status !== "all" || filters.payment_status !== "all";
    const pageStats = useMemo(() => {
        const data = orders.data;
        return {
            total: data.length,
            inProgress: data.filter((order) =>
                !["completed", "cancelled", "served"].includes(String(order.kitchen_status).toLowerCase()),
            ).length,
            completed: data.filter((order) =>
                ["completed", "served"].includes(String(order.kitchen_status).toLowerCase()),
            ).length,
            unpaid: data.filter((order) => {
                const status = String(order.payment_status).toLowerCase();
                return status.includes("unpaid") || status.includes("pending") || status.includes("unpaid");
            }).length,
        };
    }, [orders.data]);

    const request = (url: string, data: Record<string, string | undefined> = {}) =>
        router.get(url, data, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });

    function setKitchen(status: string) {
        setSelected(status);
        request("/orders", {
            kitchen_status: status === "all" ? undefined : status,
            payment_status: filters.payment_status === "all" ? undefined : filters.payment_status,
            sort,
        });
    }

    function setPayment(status: string) {
        request("/orders", {
            kitchen_status: filters.kitchen_status === "all" ? undefined : filters.kitchen_status,
            payment_status: status === "all" ? undefined : status,
            sort,
        });
    }

    function toggleSort() {
        const next = sort === "desc" ? "asc" : "desc";
        setSort(next);
        request("/orders", {
            kitchen_status: filters.kitchen_status === "all" ? undefined : filters.kitchen_status,
            payment_status: filters.payment_status === "all" ? undefined : filters.payment_status,
            sort: next,
        });
    }

    function resetFilters() {
        setSelected("all");
        request("/orders", { sort });
    }

    function openOrder(order: Order) {
        setEditing(order);
        setStatusOpen(true);
    }

    const paymentOptions = Object.entries(PAYMENT_LABELS);

    return (
        <div className="min-h-full bg-muted/20">
            <div className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 transition-opacity ${loading ? "opacity-100" : "opacity-0"}`}>
                <div className="h-full w-1/3 animate-pulse bg-primary" />
            </div>

            <main className="mx-auto grid w-full max-w-360 gap-6 px-4 pb-10 pt-5 sm:px-6 lg:gap-8 lg:px-8 lg:pt-8">
                <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Restaurant operations
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting()}, {userName}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                            Here’s what’s happening with your orders. Keep service moving smoothly.
                        </p>
                    </div>
                    <Button asChild size="lg" className="h-11 rounded-xl px-5 shadow-sm">
                        <Link href="/orders/create">
                            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> New order
                        </Link>
                    </Button>
                </header>

                <section aria-label="Order overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard label="Orders on this page" value={pageStats.total} note={`${orders.total} orders across all pages`} icon={ReceiptText} iconClass="bg-slate-500/10 text-slate-600 dark:text-slate-300" />
                    <SummaryCard label="In the kitchen" value={pageStats.inProgress} note="Not yet completed or served" icon={ChefHat} iconClass="bg-orange-500/10 text-orange-700 dark:text-orange-300" />
                    <SummaryCard label="Completed" value={pageStats.completed} note="Completed or served orders" icon={CheckCircle2} iconClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" />
                    <SummaryCard label="Payment attention" value={pageStats.unpaid} note="Pending or unpaid on this page" icon={CreditCard} iconClass="bg-amber-500/10 text-amber-700 dark:text-amber-300" />
                </section>

                <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-border/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-lg font-bold tracking-tight">Order management</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Select an order to view details or update its status.</p>
                        </div>
                        <Button type="button" variant="outline" className="h-10 w-full rounded-xl sm:w-auto" onClick={toggleSort} aria-label="Sort by date">
                            <ArrowDownUp className="mr-2 h-4 w-4" aria-hidden="true" />
                            {sort === "desc" ? "Newest first" : "Oldest first"}
                        </Button>
                    </div>

                    <div className="space-y-4 p-4 sm:p-5">
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Kitchen status</p>
                            <Tabs value={selected} onValueChange={setKitchen}>
                                <TabsList aria-label="Filter by kitchen status" className={`h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted/70 p-1 ${NO_SCROLLBAR}`}>
                                    <TabsTrigger value="all" className="shrink-0 rounded-lg px-3 py-2 text-sm">All orders</TabsTrigger>
                                    {KITCHEN_STATUSES.map((status) => (
                                        <TabsTrigger key={status} value={status} className="shrink-0 rounded-lg px-3 py-2 text-sm">
                                            {KITCHEN_LABELS[status] ?? status}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>

                        {paymentOptions.length > 0 && (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Payment</span>
                                <div className="flex flex-wrap gap-2">
                                    <Button type="button" size="sm" variant={filters.payment_status === "all" ? "default" : "outline"} className="h-8 rounded-full px-3" onClick={() => setPayment("all")}>All payments</Button>
                                    {paymentOptions.map(([status, label]) => (
                                        <Button key={status} type="button" size="sm" variant={filters.payment_status === status ? "default" : "outline"} className="h-8 rounded-full px-3" onClick={() => setPayment(status)}>
                                            {label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`border-t border-border/70 p-4 transition-opacity sm:p-5 ${loading ? "opacity-60" : "opacity-100"}`} aria-busy={loading}>
                        {orders.data.length === 0 ? (
                            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border px-5 py-10 text-center">
                                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                    <UtensilsCrossed className="h-6 w-6" aria-hidden="true" />
                                </span>
                                <h3 className="mt-4 text-base font-semibold">{hasFilters ? "No orders match these filters" : "Your orders will appear here"}</h3>
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    {hasFilters ? "Try changing your kitchen or payment filters to find the order you need." : "Create your first order to start tracking kitchen progress and payments."}
                                </p>
                                {hasFilters ? (
                                    <Button variant="outline" className="mt-4 rounded-xl" onClick={resetFilters}>Clear filters</Button>
                                ) : (
                                    <Button asChild className="mt-4 rounded-xl"><Link href="/orders/create"><Plus className="mr-2 h-4 w-4" />Create first order</Link></Button>
                                )}
                            </div>
                        ) : (
                            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Orders">
                                {orders.data.map((order) => (
                                    <OrderTicket key={order.id} order={order} onOpen={() => openOrder(order)} />
                                ))}
                            </ul>
                        )}
                    </div>

                    {orders.last_page > 1 && (
                        <footer className="flex flex-col gap-3 border-t border-border/70 bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-semibold text-foreground tabular-nums">{orders.from ?? 0}–{orders.to ?? 0}</span> of <span className="font-semibold text-foreground tabular-nums">{orders.total}</span> orders
                            </p>
                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <span className="text-sm text-muted-foreground">Page <span className="font-semibold text-foreground">{orders.current_page}</span> of {orders.last_page}</span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" aria-label="Previous page" disabled={!orders.prev_page_url} onClick={() => orders.prev_page_url && request(orders.prev_page_url, { sort })}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" aria-label="Next page" disabled={!orders.next_page_url} onClick={() => orders.next_page_url && request(orders.next_page_url, { sort })}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </footer>
                    )}
                </section>

                <p className="text-center text-xs text-muted-foreground">Tip: select any order card to review details and update its status.</p>
            </main>

            <OrderStatusDialog
                key={editing?.id ?? "none"}
                open={statusOpen}
                onOpenChange={setStatusOpen}
                order={editing}
                menuItems={menuItems}
            />
        </div>
    );
}

OrdersPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;
