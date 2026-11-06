import Layout from "@/layouts/app-layout";
import { useState, type ReactElement } from "react";
import { router } from "@inertiajs/react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Label,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from "recharts";
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Banknote,
    Boxes,
    PackageX,
    Receipt,
    TriangleAlert,
    Wallet,
    type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { KITCHEN_LABELS, type KitchenStatus } from "@/lib/orders";

type Range = "today" | "7d" | "30d";

interface Props {
    filters: { range: Range };
    stats: {
        revenue: number;
        orders: number;
        average_order: number;
        unpaid: number;
    };
    charts: {
        sales_by_day: { date: string; label: string; total: number }[];
        orders_by_status: { status: KitchenStatus; total: number }[];
        top_items: { id: number; name: string; quantity: number; revenue: number }[];
        payment_methods: { method: string; count: number; total: number }[];
    };
    inventory: {
        total: number;
        low: number;
        out_of_stock: number;
        stock_value: number;
        low_stock: {
            id: number;
            name: string;
            unit: string;
            current_stock: number;
            reorder_level: number;
            category: string | null;
        }[];
        movements: {
            id: number;
            type: "in" | "out";
            quantity: number;
            reason: string | null;
            moved_at: string;
            item: string;
            unit: string;
        }[];
    };
}

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const pesoShort = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    notation: "compact",
    maximumFractionDigits: 1,
});
const timeFmt = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const RANGES: { key: Range; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "7d", label: "Last 7 days" },
    { key: "30d", label: "Last 30 days" },
];

const RANGE_TEXT: Record<Range, string> = {
    today: "today",
    "7d": "the last 7 days",
    "30d": "the last 30 days",
};

const salesConfig = {
    total: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

const statusConfig = {
    total: { label: "Orders" },
    pending: { label: KITCHEN_LABELS.pending, color: "var(--muted-foreground)" },
    preparing: { label: KITCHEN_LABELS.preparing, color: "var(--color-amber-500)" },
    ready: { label: KITCHEN_LABELS.ready, color: "var(--primary)" },
    served: { label: KITCHEN_LABELS.served, color: "var(--color-emerald-500)" },
    cancelled: { label: KITCHEN_LABELS.cancelled, color: "var(--destructive)" },
} satisfies ChartConfig;

const itemsConfig = {
    quantity: { label: "Sold", color: "var(--chart-1)" },
} satisfies ChartConfig;

const paymentConfig = {
    total: { label: "Amount" },
    cash: { label: "Cash", color: "var(--chart-1)" },
    gcash: { label: "GCash", color: "var(--chart-2)" },
} satisfies ChartConfig;

function pesoRow(config: ChartConfig) {
    // eslint-disable-next-line react/display-name
    return (value: unknown, name: unknown) => (
        <div className="flex w-full items-center justify-between gap-4">
            <span className="text-muted-foreground">{config[String(name)]?.label ?? String(name)}</span>
            <span className="font-mono font-medium tabular-nums">{peso.format(Number(value))}</span>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    hint,
    tone = "default",
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    hint?: string;
    tone?: "default" | "warn" | "danger";
}) {
    return (
        <Card className="gap-3 bg-linear-to-t from-primary/5 to-card shadow-xs">
            <CardHeader className="gap-1">
                <div className="flex items-center justify-between gap-2">
                    <CardDescription>{label}</CardDescription>
                    <Badge
                        variant="outline"
                        className={cn(
                            "h-7 w-7 justify-center rounded-lg p-0",
                            tone === "warn" && "border-amber-500/30 text-amber-600",
                            tone === "danger" && "border-destructive/30 text-destructive"
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                    </Badge>
                </div>
                <CardTitle className="text-2xl font-semibold tabular-nums sm:text-3xl">{value}</CardTitle>
            </CardHeader>
            {hint && <CardFooter className="text-sm text-muted-foreground">{hint}</CardFooter>}
        </Card>
    );
}

function Empty({ text }: { text: string }) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{text}</p>;
}

function Meter({ value, className }: { value: number; className?: string }) {
    return (
        <div className="h-2 overflow-hidden rounded-full bg-primary/15">
            <div
                className={cn("h-full rounded-full bg-primary transition-all", className)}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}

export default function DashboardPage({ filters, stats, charts, inventory }: Props) {
    const [loading, setLoading] = useState(false);

    function changeRange(range: string) {
        router.get(
            "/admin/dashboard",
            { range },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            }
        );
    }

    const sales = charts.sales_by_day;
    const periodTotal = sales.reduce((sum, d) => sum + d.total, 0);

    const statusData = charts.orders_by_status.map((s) => ({
        status: s.status,
        label: KITCHEN_LABELS[s.status],
        total: s.total,
        fill: `var(--color-${s.status})`,
    }));

    const itemsData = charts.top_items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        revenue: i.revenue,
    }));

    const paymentData = charts.payment_methods.map((p) => ({
        method: p.method,
        total: p.total,
        count: p.count,
        fill: `var(--color-${p.method})`,
    }));
    const paymentTotal = paymentData.reduce((sum, p) => sum + p.total, 0);

    const salesTooltip = (
        <ChartTooltipContent indicator="line" formatter={pesoRow(salesConfig)} />
    );

    return (
        <div className={cn("mx-auto grid w-full max-w-7xl gap-6 px-3 transition-opacity sm:px-4", loading && "opacity-60")}>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Sales, orders and stock at a glance.</p>
                </div>
                <Tabs value={filters.range} onValueChange={changeRange}>
                    <TabsList aria-label="Date range">
                        {RANGES.map((r) => (
                            <TabsTrigger key={r.key} value={r.key} className="px-3 text-sm">
                                {r.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Wallet} label="Revenue" value={peso.format(stats.revenue)} hint="Payments received" />
                <StatCard icon={Receipt} label="Orders" value={String(stats.orders)} hint="Excluding cancelled" />
                <StatCard icon={Banknote} label="Average order" value={peso.format(stats.average_order)} hint="Per order" />
                <StatCard
                    icon={TriangleAlert}
                    label="Unpaid"
                    value={peso.format(stats.unpaid)}
                    hint="Open orders awaiting payment"
                    tone={stats.unpaid > 0 ? "warn" : "default"}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="shadow-xs lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Sales</CardTitle>
                        <CardDescription>
                            {peso.format(periodTotal)} received {RANGE_TEXT[filters.range]}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {periodTotal === 0 ? (
                            <Empty text="No payments in this period." />
                        ) : sales.length < 2 ? (
                            <ChartContainer config={salesConfig} className="aspect-auto h-64 w-full">
                                <BarChart data={sales} margin={{ left: 4, right: 4 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                                    <ChartTooltip cursor={false} content={salesTooltip} />
                                    <Bar dataKey="total" fill="var(--color-total)" radius={8} maxBarSize={80} />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <ChartContainer config={salesConfig} className="aspect-auto h-64 w-full">
                                <AreaChart data={sales} margin={{ left: 4, right: 4 }}>
                                    <defs>
                                        <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        minTickGap={24}
                                    />
                                    <ChartTooltip cursor={false} content={salesTooltip} />
                                    <Area
                                        dataKey="total"
                                        type="monotone"
                                        fill="url(#fillSales)"
                                        stroke="var(--color-total)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-xs">
                    <CardHeader>
                        <CardTitle>Orders by status</CardTitle>
                        <CardDescription>Kitchen progress for {RANGE_TEXT[filters.range]}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={statusConfig} className="aspect-auto h-64 w-full">
                            <BarChart data={statusData} layout="vertical" margin={{ left: 0, right: 16 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis
                                    dataKey="label"
                                    type="category"
                                    tickLine={false}
                                    axisLine={false}
                                    width={78}
                                />
                                <XAxis type="number" hide allowDecimals={false} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="status" />} />
                                <Bar dataKey="total" radius={6} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="shadow-xs lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Top menu items</CardTitle>
                        <CardDescription>Best sellers by quantity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {itemsData.length === 0 ? (
                            <Empty text="No orders in this period." />
                        ) : (
                            <ChartContainer config={itemsConfig} className="aspect-auto h-64 w-full">
                                <BarChart data={itemsData} layout="vertical" margin={{ left: 0, right: 16 }}>
                                    <CartesianGrid horizontal={false} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tickLine={false}
                                        axisLine={false}
                                        width={120}
                                        tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
                                    />
                                    <XAxis type="number" hide allowDecimals={false} />
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent
                                                hideLabel
                                                formatter={(value, _name, item) => (
                                                    <div className="grid w-full gap-1">
                                                        <span className="font-medium">{item.payload.name}</span>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-muted-foreground">Sold</span>
                                                            <span className="font-mono font-medium tabular-nums">
                                                                {String(value)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-muted-foreground">Revenue</span>
                                                            <span className="font-mono font-medium tabular-nums">
                                                                {peso.format(item.payload.revenue)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            />
                                        }
                                    />
                                    <Bar dataKey="quantity" fill="var(--color-quantity)" radius={6} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-xs">
                    <CardHeader>
                        <CardTitle>Payment methods</CardTitle>
                        <CardDescription>Share of revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paymentData.length === 0 ? (
                            <Empty text="No payments yet." />
                        ) : (
                            <ChartContainer config={paymentConfig} className="mx-auto aspect-square h-64">
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel formatter={pesoRow(paymentConfig)} />}
                                    />
                                    <Pie
                                        data={paymentData}
                                        dataKey="total"
                                        nameKey="method"
                                        innerRadius={58}
                                        strokeWidth={4}
                                    >
                                        <Label
                                            content={({ viewBox }) => {
                                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                    return (
                                                        <text
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                        >
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                className="fill-foreground text-xl font-bold"
                                                            >
                                                                {pesoShort.format(paymentTotal)}
                                                            </tspan>
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={(viewBox.cy ?? 0) + 20}
                                                                className="fill-muted-foreground text-xs"
                                                            >
                                                                Total
                                                            </tspan>
                                                        </text>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </Pie>
                                    <ChartLegend content={<ChartLegendContent nameKey="method" />} />
                                </PieChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">Inventory</h2>
                <Separator className="flex-1" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Boxes} label="Inventory items" value={String(inventory.total)} hint="Active items" />
                <StatCard
                    icon={TriangleAlert}
                    label="Low stock"
                    value={String(inventory.low)}
                    hint="At or below reorder level"
                    tone={inventory.low > 0 ? "warn" : "default"}
                />
                <StatCard
                    icon={PackageX}
                    label="Out of stock"
                    value={String(inventory.out_of_stock)}
                    hint="Needs immediate restock"
                    tone={inventory.out_of_stock > 0 ? "danger" : "default"}
                />
                <StatCard icon={Wallet} label="Stock value" value={peso.format(inventory.stock_value)} hint="At average cost" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="shadow-xs">
                    <CardHeader>
                        <CardTitle>Needs restocking</CardTitle>
                        <CardDescription>Items at or below their reorder level</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {inventory.low_stock.length === 0 ? (
                            <Empty text="All items are above their reorder level." />
                        ) : (
                            <ul className="divide-y">
                                {inventory.low_stock.map((item) => {
                                    const out = item.current_stock <= 0;
                                    const pct =
                                        item.reorder_level > 0 ? (item.current_stock / item.reorder_level) * 100 : 0;
                                    return (
                                        <li key={item.id} className="grid gap-2 py-3 first:pt-0 last:pb-0">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium">{item.name}</div>
                                                    {item.category && (
                                                        <div className="text-xs text-muted-foreground">{item.category}</div>
                                                    )}
                                                </div>
                                                <div className="flex shrink-0 flex-col items-end gap-1">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "tabular-nums",
                                                            out
                                                                ? "border-destructive/30 text-destructive"
                                                                : "border-amber-500/30 text-amber-600"
                                                        )}
                                                    >
                                                        {item.current_stock} {item.unit}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        reorder at {item.reorder_level}
                                                    </span>
                                                </div>
                                            </div>
                                            <Meter value={pct} className={out ? "bg-destructive" : "bg-amber-500"} />
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-xs">
                    <CardHeader>
                        <CardTitle>Recent stock movements</CardTitle>
                        <CardDescription>Latest items moved in and out</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {inventory.movements.length === 0 ? (
                            <Empty text="No stock movements yet." />
                        ) : (
                            <ul className="divide-y">
                                {inventory.movements.map((m) => (
                                    <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "h-9 w-9 shrink-0 justify-center rounded-lg p-0",
                                                m.type === "in"
                                                    ? "border-emerald-500/30 text-emerald-600"
                                                    : "border-destructive/30 text-destructive"
                                            )}
                                        >
                                            {m.type === "in" ? (
                                                <ArrowDownToLine className="h-4 w-4" />
                                            ) : (
                                                <ArrowUpFromLine className="h-4 w-4" />
                                            )}
                                        </Badge>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">{m.item}</div>
                                            <div className="truncate text-xs text-muted-foreground">
                                                {m.reason ?? (m.type === "in" ? "Stock in" : "Stock out")} ·{" "}
                                                {timeFmt.format(new Date(m.moved_at))}
                                            </div>
                                        </div>
                                        <span
                                            className={cn(
                                                "shrink-0 text-sm font-semibold tabular-nums",
                                                m.type === "in" ? "text-emerald-600" : "text-destructive"
                                            )}
                                        >
                                            {m.type === "in" ? "+" : "−"}
                                            {m.quantity} {m.unit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

DashboardPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;