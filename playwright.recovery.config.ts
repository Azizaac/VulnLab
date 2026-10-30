import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
    ...base,
    outputDir: ".tools/recovery-visual-results",
    use: { ...base.use, baseURL: "http://127.0.0.1:8098" },
    webServer: {
        ...base.webServer,
        command: `"${process.env.PHP_BINARY || "php"}" artisan serve --host=127.0.0.1 --port=8098 --no-reload`,
        url: "http://127.0.0.1:8098/login",
    },
    testMatch: "recovery-visual.spec.ts",
    projects: [
        { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
        { name: "laptop", use: { viewport: { width: 1280, height: 800 } } },
        {
            name: "mobile",
            use: {
                viewport: { width: 390, height: 844 },
                isMobile: true,
                hasTouch: true,
            },
        },
        {
            name: "mobile320",
            use: {
                viewport: { width: 320, height: 740 },
                isMobile: true,
                hasTouch: true,
            },
        },
    ],
});
