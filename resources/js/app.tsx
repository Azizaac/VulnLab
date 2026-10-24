import "../css/app.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "../css/journey.css";
import "../css/learning.css";
import "../css/labs.css";
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
        createRoot(el).render(<App {...props} />);
    },
    progress: false,
});
