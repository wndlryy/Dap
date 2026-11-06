import { Head } from "@inertiajs/react";
import {
    Boxes,
    ClipboardList,
    ShieldCheck,
    type LucideIcon,
} from "lucide-react";
import { LoginCard } from "@/components/login-card";

const APP_NAME = "Danao Adventure Park";

const CHIPS: { icon: LucideIcon; label: string }[] = [
    { icon: Boxes, label: "Stock tracking" },
    { icon: ClipboardList, label: "Order management" },
    { icon: ShieldCheck, label: "Role-based access" },
];

export default function Home() {
    return (
        <>
            <Head title="Sign in" />
            <div className="relative h-svh overflow-hidden bg-background">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.5)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.5)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-40 left-1/2 h-112 w-5xl -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
                />

                <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col px-5 sm:px-8">
                    <header className="flex shrink-0 items-center gap-3 py-5 [@media(max-height:560px)]:hidden">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <Boxes className="h-5 w-5" />
                        </span>
                        <span className="text-base font-bold tracking-tight">
                            {APP_NAME}
                        </span>
                    </header>

                    <main className="grid min-h-0 flex-1 items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
                        <section className="hidden lg:block">
                            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                                </span>
                                Stock and orders, always up to date
                            </span>

                            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight xl:text-5xl">
                                Know what&rsquo;s in stock.
                                <span className="block bg-linear-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                                    Know what&rsquo;s ordered.
                                </span>
                            </h1>

                            <p className="mt-5 max-w-xl text-base text-muted-foreground">
                                Track your inventory, manage incoming orders,
                                and keep every role in sync from one place.
                            </p>

                            <ul className="mt-6 flex flex-wrap gap-2">
                                {CHIPS.map(({ icon: Icon, label }) => (
                                    <li
                                        key={label}
                                        className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-2 text-sm font-medium backdrop-blur"
                                    >
                                        <Icon className="h-4 w-4 text-primary" />
                                        {label}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="flex justify-center lg:justify-end">
                            <LoginCard />
                        </section>
                    </main>

                    <footer className="shrink-0 py-4 text-center text-xs text-muted-foreground lg:text-left [@media(max-height:560px)]:hidden">
                        &copy; {new Date().getFullYear()} {APP_NAME}
                    </footer>
                </div>
            </div>
        </>
    );
}
