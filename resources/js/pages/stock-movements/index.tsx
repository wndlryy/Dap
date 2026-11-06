import Layout from "@/layouts/app-layout";
import { useEffect, useState, type ReactElement } from "react";
import { router } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowDownRight,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    PackageOpen,
    Plus,
    Search,
    X,
} from "lucide-react";
import { AddMovementDialog, type ItemOption, type ReasonOption } from "./add-dialog";

type Amount = number | string | null | undefined;

interface Movement {
    id: number;
    type: "in" | "out";
    quantity: number;
    unit_price?: Amount;
    total_amount?: Amount;
    reason: string | null;
    moved_at: string;
    item: { id: number; name: string; unit?: string | null; deleted_at?: string | null } | null;
    user: { id: number; name?: string | null; username?: string | null } | null;
}

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
    search: string;
    year: string;
    month: string;
    day: string;
}

interface Props {
    movements: Paginated<Movement>;
    items: ItemOption[];
    reasons?: ReasonOption[];
    filters: Filters;
    filterOptions: { years: number[]; months: number[]; days: number[] };
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const TYPE_STYLES = {
    in: "border-transparent bg-emerald-600 text-primary-foreground hover:bg-emerald-600",
    out: "border-transparent bg-red-600 text-primary-foreground hover:bg-red-600",
};

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const dateFmt = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" });
const timeFmt = new Intl.DateTimeFormat("en-PH", { timeStyle: "short" });

function isBlank(value: Amount) {
    return value === null || value === undefined || value === "";
}

function money(value: Amount) {
    if (isBlank(value)) return "—";
    const n = Number(value);
    return Number.isNaN(n) ? "—" : peso.format(n);
}

function totalOf(m: Movement): Amount {
    if (!isBlank(m.total_amount)) return m.total_amount;
    if (isBlank(m.unit_price)) return null;
    return m.quantity * Number(m.unit_price);
}

function visit(f: Filters) {
    router.get(
        "/stock-movements",
        {
            search: f.search || undefined,
            year: f.year === "all" ? undefined : f.year,
            month: f.month === "all" ? undefined : f.month,
            day: f.day === "all" ? undefined : f.day,
        },
        { preserveState: true, preserveScroll: true, replace: true }
    );
}

export default function StockMovementsPage({
    movements,
    items,
    reasons = [],
    filters,
    filterOptions,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [loading, setLoading] = useState(false);
    const [addOpen, setAddOpen] = useState(false);

    const hasFilters = filters.search !== "" || filters.year !== "all";

    function apply(next: Partial<Filters>) {
        visit({ ...filters, search, ...next });
    }

    useEffect(() => {
        if (search === filters.search) return;
        const t = setTimeout(() => visit({ ...filters, search }), 300);
        return () => clearTimeout(t);
    }, [search, filters]);

    useEffect(() => {
        const off1 = router.on("start", () => setLoading(true));
        const off2 = router.on("finish", () => setLoading(false));
        return () => {
            off1();
            off2();
        };
    }, []);

    function goTo(url: string | null) {
        if (url) router.get(url, {}, { preserveState: true, preserveScroll: true });
    }

    return (
        <div className="grid gap-4">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-semibold">Stock Movements</h1>
                    <p className="text-sm text-muted-foreground">
                        {movements.total} {movements.total === 1 ? "record" : "records"}
                    </p>
                </div>
                <Button onClick={() => setAddOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Movements
                </Button>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
                <div className="relative w-72 max-w-full">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        style={{ paddingLeft: "2.25rem" }}
                        placeholder="Search item..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-3 gap-2 sm:flex">
                    <Select
                        value={filters.year}
                        onValueChange={(v) => apply({ year: v, month: "all", day: "all" })}
                    >
                        <SelectTrigger className="w-full sm:w-32">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All years</SelectItem>
                            {filterOptions.years.map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.month}
                        disabled={filters.year === "all"}
                        onValueChange={(v) => apply({ month: v, day: "all" })}
                    >
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All months</SelectItem>
                            {filterOptions.months.map((m) => (
                                <SelectItem key={m} value={String(m)}>{MONTHS[m]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.day}
                        disabled={filters.month === "all"}
                        onValueChange={(v) => apply({ day: v })}
                    >
                        <SelectTrigger className="w-full sm:w-28">
                            <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All days</SelectItem>
                            {filterOptions.days.map((d) => (
                                <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {hasFilters && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSearch("");
                            visit({ search: "", year: "all", month: "all", day: "all" });
                        }}
                    >
                        <X className="h-4 w-4" />
                        Clear
                    </Button>
                )}
            </div>

            <div className={`rounded-md border transition-opacity ${loading ? "opacity-60" : ""}`}>
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-14">No.</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Recorded by</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movements.data.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={9} className="h-40">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <PackageOpen className="h-8 w-8" />
                                        <span className="text-sm">No stock movements found.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            movements.data.map((m, i) => {
                                const isIn = m.type === "in";
                                return (
                                    <TableRow key={m.id}>
                                        <TableCell className="text-muted-foreground">
                                            {(movements.from ?? 1) + i}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div>{dateFmt.format(new Date(m.moved_at))}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {timeFmt.format(new Date(m.moved_at))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {m.item?.name ?? "—"}
                                            {m.item?.deleted_at && (
                                                <span className="ml-1 text-xs font-normal text-muted-foreground">
                                                    (deleted)
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`gap-1 ${TYPE_STYLES[m.type]}`}>
                                                {isIn ? (
                                                    <ArrowDownRight className="h-3 w-3" />
                                                ) : (
                                                    <ArrowUpRight className="h-3 w-3" />
                                                )}
                                                {isIn ? "Stock In" : "Stock Out"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-right">
                                            <Badge className={`tabular-nums ${TYPE_STYLES[m.type]}`}>
                                                {isIn ? "+" : "−"}
                                                {m.quantity}
                                            </Badge>
                                            {m.item?.unit && (
                                                <span className="ml-1.5 text-xs text-muted-foreground">
                                                    {m.item.unit}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{money(m.unit_price)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{money(totalOf(m))}</TableCell>
                                        <TableCell className="max-w-48 truncate text-muted-foreground" title={m.reason ?? ""}>
                                            {m.reason ?? "—"}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {m.user?.name ?? m.user?.username ?? "—"}
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
                    {movements.total === 0
                        ? "0 results"
                        : `Showing ${movements.from}–${movements.to} of ${movements.total}`}
                </span>
                <div className="flex items-center gap-2">
                    <span className="mr-2">
                        Page {movements.current_page} of {movements.last_page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!movements.prev_page_url}
                        onClick={() => goTo(movements.prev_page_url)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!movements.next_page_url}
                        onClick={() => goTo(movements.next_page_url)}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <AddMovementDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                items={items}
                reasons={reasons}
            />
        </div>
    );
}

StockMovementsPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;