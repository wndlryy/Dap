import Layout from "@/layouts/app-layout";
import { useEffect, useState, type ReactElement } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    BellRing,
    ChefHat,
    ChevronDown,
    ChevronUp,
    ChevronsDownUp,
    ChevronsUpDown,
    Clock,
    Flame,
    Loader2,
    User,
    type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { KITCHEN_LABELS, type KitchenStatus } from "@/lib/orders";

interface KitchenLine {
    id: number;
    quantity: number;
    notes: string | null;
    menu_item?: { id: number; name: string } | null;
}

interface KitchenOrder {
    id: number;
    kitchen_status: KitchenStatus;
    created_at: string;
    user?: { id: number; name?: string | null; username?: string | null } | null;
    items: KitchenLine[];
}

interface Props {
    orders: KitchenOrder[];
}

const ACTIVE: KitchenStatus[] = ["pending", "preparing", "ready"];

const NEXT: Partial<Record<KitchenStatus, { label: string; icon: LucideIcon }>> = {
    pending: { label: "Start preparing", icon: Flame },
    preparing: { label: "Mark ready", icon: BellRing },
};

const BADGE: Record<KitchenStatus, string> = {
    pending: "border-transparent bg-muted text-foreground hover:bg-muted",
    preparing: "border-transparent bg-primary/10 text-primary hover:bg-primary/10",
    ready: "border-transparent bg-primary text-primary-foreground hover:bg-primary",
    served: "border-transparent bg-muted text-muted-foreground hover:bg-muted",
    cancelled: "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/10",
};

const ACCENT: Record<KitchenStatus, string> = {
    pending: "bg-muted-foreground/40",
    preparing: "bg-primary/60",
    ready: "bg-primary",
    served: "bg-muted-foreground/40",
    cancelled: "bg-destructive",
};

const dateTimeFmt = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

function minutesSince(from: string, now: number) {
    return Math.max(0, Math.floor((now - new Date(from).getTime()) / 60000));
}

function elapsedLabel(minutes: number) {
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min ago`;
}

function urgencyText(minutes: number) {
    if (minutes >= 20) return "font-semibold text-destructive";
    if (minutes >= 10) return "font-medium text-foreground";
    return "text-muted-foreground";
}

export default function KitchenPage({ orders }: Props) {
    const [now, setNow] = useState(() => Date.now());
    const [filter, setFilter] = useState<"all" | KitchenStatus>("all");
    const [busyId, setBusyId] = useState<number | null>(null);
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    useEffect(() => {
        const id = setInterval(() => {
            setNow(Date.now());
            router.reload({ only: ["orders"] });
        }, 10000);
        return () => clearInterval(id);
    }, []);

    const tabs: { key: "all" | KitchenStatus; label: string; count: number }[] = [
        { key: "all", label: "All", count: orders.length },
        ...ACTIVE.map((s) => ({
            key: s,
            label: KITCHEN_LABELS[s],
            count: orders.filter((o) => o.kitchen_status === s).length,
        })),
    ];

    const visible = orders.filter((o) => filter === "all" || o.kitchen_status === filter);
    const multiLine = visible.filter((o) => o.items.length > 1);
    const allOpen = multiLine.length > 0 && multiLine.every((o) => expanded.has(o.id));

    function toggle(id: number) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function expandAll() {
        setExpanded(new Set(multiLine.map((o) => o.id)));
    }

    function collapseAll() {
        setExpanded(new Set());
    }

    function advance(order: KitchenOrder) {
        const message =
            order.kitchen_status === "pending"
                ? `Order #${order.id} is now being prepared`
                : `Order #${order.id} is ready`;

        router.patch(
            `/kitchen/orders/${order.id}/advance`,
            { from: order.kitchen_status },
            {
                preserveScroll: true,
                onStart: () => setBusyId(order.id),
                onFinish: () => setBusyId(null),
                onSuccess: () => {
                    toast.success(message);
                },
                onError: () => {
                    toast.error(`Failed to update order #${order.id}`);
                },
            }
        );
    }

    return (
        <div className="mx-auto grid w-full max-w-7xl gap-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Kitchen</h1>
                    <p className="text-sm text-muted-foreground">Prepare and hand off incoming orders.</p>
                </div>
                <Badge variant="outline" className="h-8 gap-2 rounded-full bg-card px-3 font-normal">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>
                    Live · {orders.length} active {orders.length === 1 ? "order" : "orders"}
                </Badge>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Tabs
                    value={filter}
                    onValueChange={(v) => setFilter(v as "all" | KitchenStatus)}
                    className="w-full sm:w-auto"
                >
                    <TabsList className="grid h-auto w-full grid-cols-4 sm:inline-flex sm:w-auto rounded-sm">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.key}
                                value={tab.key}
                                className="min-h-11 flex-col gap-0.5 px-2 sm:min-h-9 sm:flex-row sm:gap-2 sm:px-4 rounded-sm"
                            >
                                {tab.label}
                                <Badge variant="secondary" className="px-1.5 tabular-nums">
                                    {tab.count}
                                </Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {multiLine.length > 0 && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full sm:h-9 sm:w-auto"
                        onClick={allOpen ? collapseAll : expandAll}
                    >
                        {allOpen ? (
                            <ChevronsDownUp className="h-4 w-4" />
                        ) : (
                            <ChevronsUpDown className="h-4 w-4" />
                        )}
                        {allOpen ? "Collapse all" : "Expand all"}
                    </Button>
                )}
            </div>

            {visible.length === 0 ? (
                <Card className="border-dashed shadow-none">
                    <CardContent className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <ChefHat className="h-6 w-6" />
                        </span>
                        <div>
                            <p className="text-lg font-semibold">The pass is clear</p>
                            <p className="text-sm text-muted-foreground">
                                New orders will appear here as they are placed.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[repeat(auto-fill,minmax(19rem,1fr))]">
                    {visible.map((order) => {
                        const minutes = minutesSince(order.created_at, now);
                        const next = NEXT[order.kitchen_status];
                        const busy = busyId === order.id;
                        const waiter = order.user?.name ?? order.user?.username ?? "—";
                        const totalQty = order.items.reduce((sum, l) => sum + l.quantity, 0);
                        const lineCount = order.items.length;
                        const hasMore = lineCount > 1;
                        const open = hasMore && expanded.has(order.id);
                        const shown = open ? order.items : order.items.slice(0, 1);
                        const hiddenNotes = !open && order.items.slice(1).some((l) => l.notes);
                        const late = minutes >= 20;

                        return (
                            <Card
                                key={order.id}
                                className={cn(
                                    "relative gap-0 overflow-hidden py-0 animate-in fade-in-0",
                                    late && "ring-1 ring-destructive/40"
                                )}
                            >
                                <span
                                    aria-hidden
                                    className={cn("absolute inset-x-0 top-0 h-1", ACCENT[order.kitchen_status])}
                                />

                                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-4 pb-3 pt-5">
                                    <div className="grid gap-1">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Order
                                        </p>
                                        <p className="text-2xl font-semibold leading-none tabular-nums tracking-tight">
                                            #{order.id}
                                        </p>
                                    </div>
                                    <div className="grid justify-items-end gap-1.5">
                                        <Badge className={BADGE[order.kitchen_status]}>
                                            {KITCHEN_LABELS[order.kitchen_status]}
                                        </Badge>
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1 text-xs tabular-nums",
                                                urgencyText(minutes)
                                            )}
                                        >
                                            <Clock className="h-3 w-3" />
                                            {elapsedLabel(minutes)}
                                        </span>
                                    </div>
                                </CardHeader>

                                <div className="flex items-center justify-between gap-2 px-4 pb-3 text-xs text-muted-foreground">
                                    <span className="inline-flex min-w-0 items-center gap-1.5">
                                        <User className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate font-medium text-foreground">{waiter}</span>
                                    </span>
                                    <span className="shrink-0">{dateTimeFmt.format(new Date(order.created_at))}</span>
                                </div>

                                <Separator />

                                <CardContent className="p-0">
                                    <ul className="divide-y">
                                        {shown.map((line) => {
                                            const name = line.menu_item?.name ?? "Removed item";
                                            return (
                                                <li key={line.id} className="flex items-start gap-3 px-4 py-3">
                                                    <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 px-2 text-sm font-semibold tabular-nums text-primary">
                                                        {line.quantity}×
                                                    </span>
                                                    <div className="min-w-0 flex-1 pt-1">
                                                        <p
                                                            title={name}
                                                            className={cn(
                                                                "text-sm font-medium leading-snug",
                                                                open ? "wrap-break-word" : "truncate",
                                                                !line.menu_item && "italic text-muted-foreground"
                                                            )}
                                                        >
                                                            {name}
                                                        </p>
                                                        {line.notes && (
                                                            <p className="mt-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                                                {line.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    <div className="flex min-h-11 items-center justify-between gap-2 border-t bg-muted/30 px-4 text-xs text-muted-foreground sm:min-h-10">
                                        <span>
                                            {hasMore
                                                ? open
                                                    ? `All ${lineCount} items shown`
                                                    : `1 of ${lineCount} items shown`
                                                : "1 item"}
                                            {hiddenNotes && <span className="ml-1.5">· notes inside</span>}
                                        </span>
                                        {hasMore && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                aria-expanded={open}
                                                className="-mr-2 h-9 gap-1 px-3 text-primary hover:text-primary sm:h-7 sm:px-2"
                                                onClick={() => toggle(order.id)}
                                            >
                                                {open ? "Show less" : "Show all"}
                                                {open ? (
                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                ) : (
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>

                                <CardFooter className="flex-col items-stretch gap-3 border-t p-3">
                                    <div className="flex items-center justify-between px-1 text-sm">
                                        <span className="text-muted-foreground">Total qty</span>
                                        <span className="font-semibold tabular-nums">{totalQty}</span>
                                    </div>
                                    {next && (
                                        <Button
                                            type="button"
                                            className="h-11 w-full text-base sm:h-9 sm:text-sm"
                                            disabled={busy}
                                            onClick={() => advance(order)}
                                        >
                                            {busy ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <next.icon className="h-4 w-4" />
                                            )}
                                            {next.label}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

KitchenPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;