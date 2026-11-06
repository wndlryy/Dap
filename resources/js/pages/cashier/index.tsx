import Layout from "@/layouts/app-layout";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { router } from "@inertiajs/react";
import { format } from "date-fns";
import {
    Banknote,
    ChevronLeft,
    ChevronRight,
    Printer,
    Receipt,
    Search,
    Wallet,
    type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { KITCHEN_LABELS, KITCHEN_STYLES } from "@/lib/orders";
import {
    methodLabel,
    peso,
    personName,
    type CashierSummary,
    type PayableLine,
    type PayableOrder,
    type PaymentRecord,
} from "@/lib/payments";
import { PayDialog } from "./pay-dialog";
import { ReceiptDialog, type ReceiptData } from "./receipt-dialog";
import { DayDatePicker } from "./day-date-picker";
import { WeekDatePicker } from "./week-date-picker";
import { MonthDatePicker } from "./month-date-picker";

type Period = "daily" | "weekly" | "monthly";

interface PeriodFilter {
    period: Period;
    date: string;
    label: string;
    is_current: boolean;
}

interface Props {
    orders: PayableOrder[];
    payments: PaymentRecord[];
    summary: CashierSummary;
    methods: string[];
    filter: PeriodFilter;
}

type Tab = "collect" | "paid";
type PaymentWithOrder = PaymentRecord & { order?: PayableOrder | null };

const RECAP_LIMIT = 3;
const SNAPSHOT_KEY = "cashier:order-snapshots";
const SNAPSHOT_LIMIT = 200;

const PERIODS: { key: Period; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
];

const CURRENT_LABEL: Record<Period, string> = {
    daily: "Today",
    weekly: "This week",
    monthly: "This month",
};

const PICKERS = {
    daily: DayDatePicker,
    weekly: WeekDatePicker,
    monthly: MonthDatePicker,
};

const dateTimeFmt = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });
const timeFmt = new Intl.DateTimeFormat("en-PH", { timeStyle: "short" });

const itemName = (line: PayableLine) => line.menu_item?.name ?? "Removed item";

const linePrice = (line: PayableLine): number | null => {
    const price = (line as PayableLine & { price_at_time?: string | number | null }).price_at_time;
    return price != null ? Number(price) : null;
};

function parseLocalDate(value: string): Date {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function shiftDate(date: string, period: Period, dir: 1 | -1): string {
    const [y, m, d] = date.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d));
    if (period === "daily") next.setUTCDate(next.getUTCDate() + dir);
    else if (period === "weekly") next.setUTCDate(next.getUTCDate() + dir * 7);
    else next.setUTCMonth(next.getUTCMonth() + dir, 1);
    return next.toISOString().slice(0, 10);
}

function loadSnapshots(): Map<number, PayableOrder> {
    try {
        return new Map(JSON.parse(localStorage.getItem(SNAPSHOT_KEY) ?? "[]"));
    } catch {
        return new Map();
    }
}

function saveSnapshots(map: Map<number, PayableOrder>) {
    while (map.size > SNAPSHOT_LIMIT) map.delete(map.keys().next().value as number);
    try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify([...map]));
    } catch {
        return;
    }
}

function putSnapshot(map: Map<number, PayableOrder>, order: PayableOrder) {
    map.delete(order.id);
    map.set(order.id, order);
}

function useOrderSnapshots(orders: PayableOrder[]) {
    const cache = useRef<Map<number, PayableOrder> | null>(null);
    if (cache.current === null) cache.current = loadSnapshots();

    useEffect(() => {
        const map = cache.current!;
        orders.forEach((o) => putSnapshot(map, o));
        saveSnapshots(map);
    }, [orders]);

    const remember = (order: PayableOrder) => {
        putSnapshot(cache.current!, order);
        saveSnapshots(cache.current!);
    };

    const orderFor = (payment: PaymentWithOrder): PayableOrder | null => {
        const live = payment.order;
        if (live?.items?.length) return live;
        return cache.current?.get(payment.order_id) ?? live ?? null;
    };

    return { orderFor, remember };
}

function toReceipt(payment: PaymentRecord, order: PayableOrder | null): ReceiptData {
    return {
        orderId: payment.order_id,
        orderedAt: order?.created_at ?? null,
        waiter: order?.user ? personName(order.user) : "—",
        items: (order?.items ?? []).map((l) => ({
            id: l.id,
            name: itemName(l),
            quantity: l.quantity,
            price: linePrice(l),
        })),
        total: Number(order?.total ?? payment.amount),
        amountPaid: Number(payment.amount),
        method: payment.payment_method,
        reference: payment.reference_number,
        cashier: personName(payment.processed_by),
        paidAt: payment.processed_at,
    };
}

function Stat({
    icon: Icon,
    label,
    value,
    hint,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    hint: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                </span>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
        </Card>
    );
}

function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm">{text}</span>
        </div>
    );
}

function ItemRecap({ items, limit = RECAP_LIMIT }: { items: PayableLine[]; limit?: number }) {
    const shown = items.slice(0, limit);
    const extra = items.length - shown.length;
    const full = items.map((l) => `${l.quantity}× ${itemName(l)}`).join(", ");

    return (
        <ul title={full} className="grid gap-0.5 text-sm">
            {shown.map((line) => (
                <li key={line.id} className="flex min-w-0 gap-1.5">
                    <span className="shrink-0 font-medium tabular-nums text-muted-foreground">{line.quantity}×</span>
                    <span className="truncate">{itemName(line)}</span>
                </li>
            ))}
            {extra > 0 && <li className="text-xs text-muted-foreground">+{extra} more</li>}
        </ul>
    );
}

function PaidItems({ order, fallbackId }: { order: PayableOrder | null; fallbackId: number }) {
    const items = order?.items ?? [];
    if (items.length === 0) return <span className="font-medium">#{fallbackId}</span>;
    return <ItemRecap items={items} limit={2} />;
}

function PaymentDrawer({
    payment,
    order,
    open,
    onOpenChange,
    onReceipt,
}: {
    payment: PaymentRecord | null;
    order: PayableOrder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onReceipt: (payment: PaymentRecord, order: PayableOrder | null) => void;
}) {
    const items = order?.items ?? [];
    const count = items.reduce((sum, l) => sum + l.quantity, 0);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
                {payment && (
                    <>
                        <SheetHeader className="space-y-1 p-5 pb-4 text-left">
                            <SheetTitle>Payment details</SheetTitle>
                            <SheetDescription>
                                Order #{payment.order_id} · {dateTimeFmt.format(new Date(payment.processed_at))}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="px-5">
                            <div className="rounded-xl border bg-muted/40 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Amount paid
                                    </span>
                                    <Badge variant="outline" className="bg-background">
                                        {methodLabel(payment.payment_method)}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
                                    {peso.format(Number(payment.amount))}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-medium">Items</h3>
                                {items.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        {count} {count === 1 ? "item" : "items"}
                                    </span>
                                )}
                            </div>

                            {items.length === 0 ? (
                                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                    Item details unavailable
                                </p>
                            ) : (
                                <ul className="divide-y rounded-lg border">
                                    {items.map((line) => {
                                        const price = linePrice(line);
                                        return (
                                            <li key={line.id} className="flex items-center gap-3 px-3 py-2.5">
                                                <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-muted px-1.5 text-xs font-semibold tabular-nums">
                                                    {line.quantity}×
                                                </span>
                                                <span
                                                    className={cn(
                                                        "min-w-0 flex-1 truncate text-sm",
                                                        !line.menu_item && "italic text-muted-foreground"
                                                    )}
                                                >
                                                    {itemName(line)}
                                                </span>
                                                {price !== null && (
                                                    <span className="shrink-0 text-sm tabular-nums">
                                                        {peso.format(price * line.quantity)}
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            <Separator className="my-5" />

                            <dl className="grid gap-3 text-sm">
                                {order?.user && (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-muted-foreground">Waiter</dt>
                                        <dd className="font-medium">{personName(order.user)}</dd>
                                    </div>
                                )}
                                <div className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">Cashier</dt>
                                    <dd className="font-medium">{personName(payment.processed_by)}</dd>
                                </div>
                                {payment.reference_number && (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-muted-foreground">Reference</dt>
                                        <dd className="break-all text-right font-medium">{payment.reference_number}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        <SheetFooter className="mt-0 border-t p-5 sm:flex-col sm:space-x-0">
                            <Button size="lg" className="w-full" onClick={() => onReceipt(payment, order)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print receipt
                            </Button>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

export default function CashierPage({ orders, payments, summary, methods, filter }: Props) {
    const [tab, setTab] = useState<Tab>("collect");
    const [search, setSearch] = useState("");
    const [paymentId, setPaymentId] = useState<number | null>(null);
    const [payOpen, setPayOpen] = useState(false);
    const [selected, setSelected] = useState<PayableOrder | null>(null);
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(false);
    const { orderFor, remember } = useOrderSnapshots(orders);

    const detailPayment = payments.find((p) => p.id === paymentId) ?? null;
    const detailOpen = detailPayment !== null;

    useEffect(() => {
        if (payOpen || detailOpen || receipt) return;
        const id = setInterval(() => {
            router.reload({ only: ["orders", "payments", "summary", "filter"] });
        }, 15000);
        return () => clearInterval(id);
    }, [payOpen, detailOpen, receipt]);

    const q = search.trim().toLowerCase().replace(/^#/, "");
    const filtered = orders.filter(
        (o) => q === "" || String(o.id).includes(q) || personName(o.user).toLowerCase().includes(q)
    );

    const Picker = PICKERS[filter.period];

    function applyFilter(period: Period, date?: string) {
        router.get(
            window.location.pathname,
            date ? { period, date } : { period },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only: ["orders", "payments", "summary", "filter"],
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            }
        );
    }

    function openPay(order: PayableOrder) {
        remember(order);
        setSelected(order);
        setPayOpen(true);
    }

    function openReceipt(payment: PaymentRecord, order: PayableOrder | null) {
        setPaymentId(null);
        setReceipt(toReceipt(payment, order));
    }

    return (
        <div className="mx-auto grid w-full max-w-7xl gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Cashier</h1>
                    <p className="text-sm text-muted-foreground">Collect payment for each order.</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={filter.period}
                        onValueChange={(value) =>
                            value && value !== filter.period && applyFilter(value as Period, filter.date)
                        }
                        className="w-full sm:w-auto"
                    >
                        {PERIODS.map((p) => (
                            <ToggleGroupItem key={p.key} value={p.key} className="h-9 flex-1 px-4 sm:flex-none">
                                {p.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>

                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            aria-label="Previous period"
                            onClick={() => applyFilter(filter.period, shiftDate(filter.date, filter.period, -1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0 flex-1 sm:w-60 sm:flex-none">
                            <Picker
                                value={parseLocalDate(filter.date)}
                                onChange={(date) => applyFilter(filter.period, format(date, "yyyy-MM-dd"))}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            aria-label="Next period"
                            disabled={filter.is_current}
                            onClick={() => applyFilter(filter.period, shiftDate(filter.date, filter.period, 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {!filter.is_current && (
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-9"
                            onClick={() => applyFilter(filter.period)}
                        >
                            {CURRENT_LABEL[filter.period]}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                    icon={Receipt}
                    label="To collect"
                    value={peso.format(summary.to_collect_total)}
                    hint={`${summary.to_collect_count} ${summary.to_collect_count === 1 ? "order" : "orders"} waiting`}
                />
                <Stat
                    icon={Wallet}
                    label="Collected"
                    value={peso.format(summary.collected_total)}
                    hint={`${summary.collected_count} ${summary.collected_count === 1 ? "payment" : "payments"} · ${filter.label}`}
                />
                <Stat
                    icon={Banknote}
                    label="Cash"
                    value={peso.format(summary.cash_total)}
                    hint="Cash payments only"
                />
            </div>

            <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
                <Card>
                    <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
                        <div className="grid gap-1">
                            <CardTitle className="text-base">
                                {tab === "collect" ? "Open orders" : "Payment history"}
                            </CardTitle>
                            <CardDescription>
                                {tab === "collect" ? "Orders waiting for payment." : filter.label}
                            </CardDescription>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            {tab === "collect" && (
                                <div className="relative w-full sm:w-64">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="h-9 pl-9"
                                        placeholder="Order number or waiter"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            )}
                            <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                                <TabsTrigger value="collect" className="gap-2">
                                    To collect
                                    <Badge variant="secondary" className="px-1.5 tabular-nums">
                                        {summary.to_collect_count}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="paid" className="gap-2">
                                    Paid
                                    <Badge variant="secondary" className="px-1.5 tabular-nums">
                                        {summary.collected_count}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <TabsContent value="collect" className="m-0 border-t">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="pl-6">Order</TableHead>
                                        <TableHead className="hidden md:table-cell">Waiter</TableHead>
                                        <TableHead className="hidden md:table-cell">Items</TableHead>
                                        <TableHead>Kitchen</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="w-28 pr-6 text-right">
                                            <span className="sr-only">Action</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={6}>
                                                <EmptyState
                                                    icon={Receipt}
                                                    text={q ? "No matching orders." : "Nothing to collect right now."}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filtered.map((order) => (
                                            <TableRow key={order.id} className="align-top">
                                                <TableCell className="whitespace-nowrap pl-6">
                                                    <div className="font-medium">#{order.id}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {dateTimeFmt.format(new Date(order.created_at))}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground md:hidden">
                                                        {personName(order.user)}
                                                    </div>
                                                    <div className="mt-1.5 max-w-40 md:hidden">
                                                        <ItemRecap items={order.items} />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {personName(order.user)}
                                                </TableCell>
                                                <TableCell className="hidden max-w-64 md:table-cell">
                                                    <ItemRecap items={order.items} />
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={KITCHEN_STYLES[order.kitchen_status]}>
                                                        {KITCHEN_LABELS[order.kitchen_status]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-base font-semibold tabular-nums">
                                                    {peso.format(Number(order.total))}
                                                </TableCell>
                                                <TableCell className="pr-6 text-right">
                                                    <Button className="whitespace-nowrap" onClick={() => openPay(order)}>
                                                        <span className="hidden sm:inline">Take payment</span>
                                                        <span className="sm:hidden">Pay</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent
                            value="paid"
                            className={cn("m-0 border-t transition-opacity", loading && "pointer-events-none opacity-60")}
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="pl-6">{filter.period === "daily" ? "Time" : "Date"}</TableHead>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="hidden md:table-cell">Reference</TableHead>
                                        <TableHead className="hidden md:table-cell">Cashier</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="w-10 pr-6">
                                            <span className="sr-only">Details</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={7}>
                                                <EmptyState icon={Wallet} text="No payments recorded for this period." />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        payments.map((payment) => (
                                            <TableRow
                                                key={payment.id}
                                                tabIndex={0}
                                                role="button"
                                                aria-label="View payment details"
                                                className="cursor-pointer align-top focus-visible:bg-muted/60 focus-visible:outline-none"
                                                onClick={() => setPaymentId(payment.id)}
                                                onKeyDown={(e) => {
                                                    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                                                        e.preventDefault();
                                                        setPaymentId(payment.id);
                                                    }
                                                }}
                                            >
                                                <TableCell className="whitespace-nowrap pl-6 text-muted-foreground">
                                                    {(filter.period === "daily" ? timeFmt : dateTimeFmt).format(
                                                        new Date(payment.processed_at)
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-56">
                                                    <PaidItems
                                                        order={orderFor(payment as PaymentWithOrder)}
                                                        fallbackId={payment.order_id}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{methodLabel(payment.payment_method)}</Badge>
                                                </TableCell>
                                                <TableCell className="hidden text-muted-foreground md:table-cell">
                                                    {payment.reference_number ?? "—"}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {personName(payment.processed_by)}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold tabular-nums">
                                                    {peso.format(Number(payment.amount))}
                                                </TableCell>
                                                <TableCell className="w-10 pl-0 pr-6 text-muted-foreground">
                                                    <ChevronRight className="h-4 w-4" />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>

            <PaymentDrawer
                payment={detailPayment}
                order={detailPayment ? orderFor(detailPayment as PaymentWithOrder) : null}
                open={detailOpen}
                onOpenChange={(open) => !open && setPaymentId(null)}
                onReceipt={openReceipt}
            />

            <PayDialog open={payOpen} onOpenChange={setPayOpen} order={selected} methods={methods} />

            <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
        </div>
    );
}

CashierPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;