import "../css/app.css";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { configureEcho } from "@laravel/echo-react";
import { TooltipProvider } from "@/components/ui/tooltip";

configureEcho({
    broadcaster: "reverb",
});

const appName = import.meta.env.VITE_APP_NAME || "DAP POS";

createInertiaApp({
    title: (title) => `${title} ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            [`./pages/${name}.tsx`, `./pages/${name}.jsx`],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mixed .jsx/.tsx glob during TS migration; narrow to '*.tsx' and remove once all pages are converted
            import.meta.glob("./pages/**/*.{jsx,tsx}") as any,
        ),
    setup({ el, App, props }) {
        createRoot(el).render(
            <TooltipProvider>
                <App {...props} />
            </TooltipProvider>,
        );
    },
    progress: {
        color: "#50C878",
    },
});
