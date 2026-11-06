export type KitchenStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";
export type PaymentStatus = "unpaid" | "paid";

export interface MenuItem {
    id: number;
    name: string;
    price: number;
    menu_category_id: number;
}

export interface Order {
    id: number;
    user_id: number;
    kitchen_status: KitchenStatus;
    payment_status: PaymentStatus;
    sub_total: number | string;
    total: number | string;
    created_at: string;
    items_count?: number;
    items: OrderItem[];
    user?: { id: number; name?: string | null; username?: string | null } | null;
}

export const KITCHEN_STATUSES: KitchenStatus[] = ["pending", "preparing", "ready", "served", "cancelled"];
export const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "paid"];

export const KITCHEN_LABELS: Record<KitchenStatus, string> = {
    pending: "Pending",
    preparing: "Preparing",
    ready: "Ready",
    served: "Served",
    cancelled: "Cancelled",
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
    unpaid: "Unpaid",
    paid: "Paid",
};

export const KITCHEN_STYLES: Record<KitchenStatus, string> = {
    pending: "border-transparent bg-chart-1 text-background hover:bg-chart-1",
    preparing: "border-transparent bg-chart-3 text-primary-foreground hover:bg-chart-3",
    ready: "border-transparent bg-primary text-primary-foreground hover:bg-primary",
    served: "border-transparent bg-muted-foreground text-background hover:bg-muted-foreground",
    cancelled: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive",
};

export const PAYMENT_STYLES: Record<PaymentStatus, string> = {
    unpaid: "border-transparent bg-chart-2 text-primary-foreground hover:bg-chart-2",
    paid: "border-transparent bg-primary text-primary-foreground hover:bg-primary",
};

export interface OrderItem {
    id: number;
    menu_item_id: number;
    quantity: number;
    price_at_time: number;
    notes: string | null;
    menu_item: { id: number; name: string; price: number };
}