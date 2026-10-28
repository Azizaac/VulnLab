import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

// Read-only browser capture: no fixture creation, authentication or mutations.
const base = "http://127.0.0.1:8088";
const destination = "docs/qa/auth-design-fix/live";
const screens = [
    { route: "login", heading: "Lanjutkan perjalanan belajarmu." },
    { route: "register", heading: "Mulai belajar dengan cara yang benar." },
];
const sizes = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
];

await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
    for (const screen of screens) {
        for (const size of sizes) {
            for (const theme of ["light", "dark"]) {
                const context = await browser.newContext({
                    viewport: { width: size.width, height: size.height },
                });
                try {
                    await context.addInitScript((value) => {
                        localStorage.setItem("vulnlab-theme", value);
                    }, theme);
                    const page = await context.newPage();
                    const response = await page.goto(`${base}/${screen.route}`, {
                        waitUntil: "networkidle",
                    });
                    if (!response?.ok()) {
                        throw new Error(`${screen.route}: HTTP ${response?.status() ?? "no response"}`);
                    }
                    await page.getByRole("heading", { name: screen.heading, exact: true }).waitFor();
                    await page.evaluate(() => document.fonts.ready);
                    const actualTheme = await page.locator("html").getAttribute("data-theme");
                    if (actualTheme !== theme) throw new Error(`${screen.route}: expected ${theme}, got ${actualTheme}`);
                    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
                        throw new Error(`${screen.route}: horizontal overflow at ${size.width}px (${theme})`);
                    }
                    const name = `${screen.route}-${size.name}-${theme}`;
                    await page.screenshot({ path: join(destination, `${name}-viewport.png`) });
                    await page.screenshot({ path: join(destination, `${name}-full.png`), fullPage: true });
                    console.log(`PASS ${name}: ${size.width}x${size.height}, heading, theme, no horizontal overflow`);
                } finally {
                    await context.close();
                }
            }
        }
    }
} finally {
    await browser.close();
}
