import "../css/app.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "../css/journey.css";
import "../css/learning.css";
import "../css/labs.css";
import "../css/feedback.css";
import "../css/sprint4.css";
import "../css/v5.css";
import "../css/v8-base.css";
import "../css/v8-account-studio.css";
import "../css/recovery.css";
import { GlobalToastProvider } from "./feedback";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";

const pages = import.meta.glob("./pages/*.tsx");
createInertiaApp({
    title: (title) => `${title} · VulnLab`,
    resolve: async (name) => {
        const page = pages[`./pages/${name}.tsx`];
        if (!page) throw new Error(`Unknown page: ${name}`);
        return page();
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <GlobalToastProvider>
                <App {...props} />
            </GlobalToastProvider>,
        );
    },
    progress: false,
});
