import type { KitchenStatus, PaymentStatus } from "@/lib/orders";

export interface OrderOption {
    id: number;
    kitchen_status: KitchenStatus;
    payment_status: PaymentStatus;
    total: number | string;
}

export interface MenuItemOption {
    id: number;
    name: string;
    price: number | string;
}

export interface OrderItem {
    id: number;
    order_id: number;
    menu_item_id: number;
    quantity: number;
    price_at_time: number | string;
    notes: string | null;
    order?: OrderOption | null;
    menu_item?: MenuItemOption | null;
}