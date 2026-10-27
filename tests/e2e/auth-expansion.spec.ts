import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

const screens = [
    { route: "/login", title: "Lanjutkan perjalanan belajarmu." },
    { route: "/register", title: "Mulai belajar dengan cara yang benar." },
] as const;

test("auth screens support both themes and responsive layouts", async ({ page }, info) => {
    for (const screen of screens) {
        await page.goto(screen.route);
        await expect(page.getByRole("heading", { name: screen.title })).toBeVisible();
        for (const theme of ["dark", "light"] as const) {
            if ((await page.locator("html").getAttribute("data-theme")) !== theme) {
                await page.getByRole("button", {
                    name: theme === "dark" ? "Aktifkan tema gelap" : "Aktifkan tema terang",
                }).click();
            }
            await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
            await page.evaluate(() => document.fonts.ready);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
            expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
            if (info.project.name === "desktop" || info.project.name === "mobile") {
                const screenshotDir = "docs/qa/expansion-v7.1/screenshots";
                mkdirSync(screenshotDir, { recursive: true });
                await page.screenshot({
                    path: `${screenshotDir}/${screen.route.slice(1)}-${info.project.name}-${theme}.png`,
                    fullPage: true,
                });
            }
        }
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    }
});

test("password visibility controls work with the keyboard", async ({ page }) => {
    for (const screen of screens) {
        await page.goto(screen.route);
        const password = page.getByLabel("Kata sandi", { exact: true });
        const toggle = page.getByRole("button", { name: "Tampilkan kata sandi", exact: true });
        await password.focus();
        await page.keyboard.press("Tab");
        await expect(toggle).toBeFocused();
        await expect(toggle).toHaveAttribute("aria-pressed", "false");
        await page.keyboard.press("Space");
        await expect(password).toHaveAttribute("type", "text");
        await expect(page.getByRole("button", { name: "Sembunyikan kata sandi", exact: true })).toHaveAttribute("aria-pressed", "true");
        await page.keyboard.press("Enter");
        await expect(password).toHaveAttribute("type", "password");
        if (screen.route === "/register") {
            const confirmation = page.getByLabel("Ulangi kata sandi");
            await confirmation.focus();
            await page.keyboard.press("Tab");
            await expect(page.getByRole("button", { name: "Tampilkan konfirmasi kata sandi" })).toBeFocused();
            await page.keyboard.press("Space");
            await expect(confirmation).toHaveAttribute("type", "text");
        }
    }
});


test("real registration, logout, rejected credentials and login", async ({ page }, info) => {
    const email = `auth-expansion-${info.project.name}-${Date.now()}@example.test`;
    const password = "secure-password-123";
    await page.goto("/register");
    await page.getByLabel("Nama", { exact: true }).fill("Pelajar Auth");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(password);
    await page.getByLabel("Ulangi kata sandi").fill(password);
    await page.getByRole("button", { name: "Buat akun" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("button", { name: "Buka menu akun" }).click();
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveValue("");
    await page.getByLabel("Kata sandi", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
});
