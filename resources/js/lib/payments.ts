import type { KitchenStatus } from "@/lib/orders";

export interface Person {
    id: number;
    name?: string | null;
    username?: string | null;
}

export interface PayableLine {
    id: number;
    quantity: number;
    price_at_time: number | string;
    notes: string | null;
    menu_item?: { id: number; name: string } | null;
}

export interface PayableOrder {
    id: number;
    kitchen_status: KitchenStatus;
    total: number | string;
    created_at: string;
    user?: Person | null;
    items: PayableLine[];
}

export interface PaymentRecord {
    id: number;
    order_id: number;
    payment_method: string;
    amount: number | string;
    reference_number: string | null;
    processed_at: string;
    processed_by?: Person | null;
}

export interface CashierSummary {
    to_collect_count: number;
    to_collect_total: number;
    collected_count: number;
    collected_total: number;
    cash_total: number;
}

export const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

const METHOD_LABELS: Record<string, string> = {
    cash: "Cash",
    gcash: "GCash",
    maya: "Maya",
    card: "Card",
};

export function methodLabel(method: string) {
    return METHOD_LABELS[method] ?? method;
}

export function personName(person?: Person | null) {
    return person?.name ?? person?.username ?? "—";
}