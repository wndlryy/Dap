import Layout from "@/layouts/app-layout";
import { useEffect, useState, type ReactElement } from "react";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, ShoppingBasket } from "lucide-react";
import { KITCHEN_LABELS } from "@/lib/orders";
import type { OrderItem } from "@/lib/order-items";

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
    orderItems: Paginated<OrderItem>;
}

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

export default function OrderItemsPage({ orderItems }: Props) {
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
        if (orderItems.data.length === 0 && orderItems.prev_page_url) {
            router.get(orderItems.prev_page_url, {}, { replace: true, preserveScroll: true });
        }
    }, [orderItems]);

    function goTo(url: string | null) {
        if (url) router.get(url, {}, { preserveState: true, preserveScroll: true });
    }

    return (
        <div className="grid gap-4">
            <div>
                <h1 className="text-xl font-semibold">Order Items</h1>
                <p className="text-sm text-muted-foreground">
                    {orderItems.total} {orderItems.total === 1 ? "line" : "lines"} — read-only. Edit items from the order itself while it&rsquo;s still pending.
                </p>
            </div>

            <div className={`rounded-md border transition-opacity ${loading ? "opacity-60" : ""}`}>
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Menu item</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="hidden text-right sm:table-cell">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="hidden lg:table-cell">Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orderItems.data.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={6} className="h-40">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <ShoppingBasket className="h-8 w-8" />
                                        <span className="text-sm">No order items yet.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orderItems.data.map((line) => {
                                const price = Number(line.price_at_time);
                                return (
                                    <TableRow key={line.id}>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="font-medium">#{line.order_id}</div>
                                            {line.order && (
                                                <div className="text-xs text-muted-foreground">
                                                    {KITCHEN_LABELS[line.order.kitchen_status]}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {line.menu_item?.name ?? "—"}
                                            {line.notes && (
                                                <div className="max-w-56 truncate text-xs font-normal text-muted-foreground lg:hidden">
                                                    {line.notes}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                            {peso.format(price)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium tabular-nums">
                                            {peso.format(price * line.quantity)}
                                        </TableCell>
                                        <TableCell
                                            className="hidden max-w-56 truncate text-muted-foreground lg:table-cell"
                                            title={line.notes ?? ""}
                                        >
                                            {line.notes ?? "—"}
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
                    {orderItems.total === 0
                        ? "0 results"
                        : `Showing ${orderItems.from}–${orderItems.to} of ${orderItems.total}`}
                </span>
                <div className="flex items-center gap-2">
                    <span className="mr-2">
                        Page {orderItems.current_page} of {orderItems.last_page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!orderItems.prev_page_url}
                        onClick={() => goTo(orderItems.prev_page_url)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!orderItems.next_page_url}
                        onClick={() => goTo(orderItems.next_page_url)}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

OrderItemsPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;