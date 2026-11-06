import { Link } from "@inertiajs/react";

const messages: Record<number, { title: string; description: string }> = {
    403: {
        title: "Access Denied",
        description: "You don't have permission to view this page.",
    },
    404: {
        title: "Page Not Found",
        description: "The page you're looking for doesn't exist.",
    },
    500: {
        title: "Server Error",
        description: "Something went wrong on our end.",
    },
    503: {
        title: "Service Unavailable",
        description: "We're doing some maintenance. Please try again soon.",
    },
};

export default function Error({ status }: { status: number }) {
    const { title, description } = messages[status] ?? messages[500];

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
            <h1 className="text-7xl font-bold">{status}</h1>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
            <div className="flex gap-3">
                <button
                    onClick={() => window.history.back()}
                    className="rounded-md border px-4 py-2"
                >
                    Go Back
                </button>
                <Link
                    href="/"
                    className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
                >
                    Home
                </Link>
            </div>
        </div>
    );
}