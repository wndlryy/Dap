import {
    LayoutDashboard,
    ArrowLeftRight,
    ShoppingCartPlus,
    ChefHat,
    Banknote,
    Warehouse,
    ConciergeBell,
    Users,
    Trash,
    Settings,
    type LucideIcon,
} from "lucide-react";

export type NavItem = {
    title: string;
    url: string;
    icon?: LucideIcon;
    items?: { title: string; url: string }[];
};

function cleanPath(url: string) {
    const path = url.split("?")[0].split("#")[0].replace(/\/+$/, "");
    return path || "/";
}

export function isActiveUrl(currentUrl: string, itemUrl: string) {
    if (!itemUrl || itemUrl === "#") return false;
    const current = cleanPath(currentUrl);
    const target = cleanPath(itemUrl);
    return current === target || current.startsWith(target + "/");
}

export function isGroupActive(currentUrl: string, item: NavItem) {
    return !!item.items?.some((sub) => isActiveUrl(currentUrl, sub.url));
}

export type Role = "admin" | "user" | "waiter" | "cashier" | "kitchen-staff";

const dashboard: NavItem = { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard };
const users: NavItem = { title: "Users", url: "/users", icon: Users };
const trash: NavItem = { title: "Trash", url: "/trash", icon: Trash };
const orders: NavItem = { title: "Orders", url: "/orders", icon: ShoppingCartPlus };
const stockMovements: NavItem = { title: "Stock Movements", url: "/stock-movements", icon: ArrowLeftRight };
const kitchen: NavItem = { title: "Kitchen's Record", url: "/kitchen", icon: ChefHat };
const payment: NavItem = { title: "Payment Section", url: "/cashier", icon: Banknote };
const settings: NavItem = { title: "Settings", url: "/backups", icon: Settings };

const inventory: NavItem = {
    title: "Inventory",
    url: "#",
    icon: Warehouse,
    items: [
        { title: "Categories", url: "/categories" },
        { title: "Items", url: "/items" },
        { title: "Stock Movements", url: "/stock-movements" },
    ],
};

const ordering: NavItem = {
    title: "Ordering",
    url: "#",
    icon: ConciergeBell,
    items: [
        { title: "Menu Categories", url: "/menu-categories" },
        { title: "Menu Items", url: "/menu-items" },
        { title: "Orders", url: "/orders" },
        { title: "Order Items", url: "/order-items" },
        { title: "Kitchen's Record", url: "/kitchen" },
        { title: "Payment Section", url: "/cashier" },
    ],
};

const navByRole: Record<Role, NavItem[]> = {
    admin: [dashboard, users, inventory, ordering, trash, settings],
    user: [dashboard, inventory],
    waiter: [orders],
    cashier: [payment],
    "kitchen-staff": [kitchen, stockMovements],
};

export function navFor(role?: string | string[] | null): NavItem[] {
    const roles = Array.isArray(role) ? role : role ? [role] : [];

    if (roles.includes("admin")) return navByRole.admin;

    const seen = new Set<string>();
    return roles
        .flatMap((r) => navByRole[r as Role] ?? [])
        .filter((item) => !seen.has(item.title) && seen.add(item.title));
}