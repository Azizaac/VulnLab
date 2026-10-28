import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, relative } from "node:path";

test("capture v8 pages using real disposable account data", async ({
    page,
}, info) => {
    test.setTimeout(240_000);
    if (!["desktop", "mobile"].includes(info.project.name)) test.skip();
    const database = process.env.E2E_DB_DATABASE;
    if (!database) throw new Error("A disposable E2E_DB_DATABASE is required.");
    const rel = relative(realpathSync(tmpdir()), realpathSync(database));
    if (!rel || rel.startsWith("..") || isAbsolute(rel))
        throw new Error("Database must be under the temporary directory.");
    const stage =
        process.env.V8_SCREENSHOT_STAGE === "before" ? "before" : "after";
    const dir = `docs/ui-v8/screenshots/${stage}`;
    mkdirSync(dir, { recursive: true });
    const save = async (name: string, theme: string) => {
        await page.evaluate(() => document.fonts.ready);
        if (stage === "after")
            expect(
                await page.evaluate(
                    () => document.documentElement.scrollWidth <= innerWidth,
                ),
                name,
            ).toBe(true);
        await page.screenshot({
            path: `${dir}/${name}-${info.project.name}-${theme}.png`,
            fullPage: true,
        });
    };
    for (const theme of ["light", "dark"] as const) {
        for (const route of ["login", "register"]) {
            await page.goto(`/${route}`);
            if (
                (await page.locator("html").getAttribute("data-theme")) !==
                theme
            )
                await page
                    .getByRole("button", {
                        name:
                            theme === "dark"
                                ? "Aktifkan tema gelap"
                                : "Aktifkan tema terang",
                    })
                    .click();
            await save(route, theme);
        }
    }
    const nonce = randomBytes(6).toString("hex");
    const email = `v8-${info.project.name}-${nonce}@example.test`;
    const password = randomBytes(24).toString("hex");
    await page.goto("/register");
    await page.getByLabel("Nama", { exact: true }).fill("V8 Learner");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(password);
    await page.getByLabel("Ulangi kata sandi").fill(password);
    await page.getByRole("button", { name: "Buat akun" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    execFileSync(
        process.env.PHP_BINARY || "php",
        ["artisan", "studio:grant-role", email, "editor", "--confirm"],
        {
            env: {
                ...process.env,
                APP_ENV: "testing",
                DB_CONNECTION: "sqlite",
                DB_DATABASE: database,
                SESSION_DRIVER: "database",
                APP_KEY: "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
            },
            stdio: "pipe",
        },
    );
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/learning");
    const lesson = await page
        .locator('a[href^="/learning/"]')
        .first()
        .getAttribute("href");
    await page.goto("/labs");
    const lab = await page
        .locator('a[href^="/labs/"]')
        .first()
        .getAttribute("href");
    expect(lesson).toBeTruthy();
    expect(lab).toBeTruthy();
    await page.goto("/studio/content");
    await page.getByRole("button", { name: "+ Konten Baru" }).click();
    await page.getByLabel("Judul", { exact: true }).fill(`V8 draft ${nonce}`);
    await page.getByLabel("Slug URL stabil").fill(`v8-draft-${nonce}`);
    await page.getByRole("button", { name: "Buat Draft", exact: true }).click();
    await expect(page).toHaveURL(/\/studio\/content\/\d+\/edit/);
    const editor = new URL(page.url()).pathname;
    const routes: [string, string][] = [
        ["dashboard", "/dashboard"],
        ["roadmap", "/roadmap"],
        ["modules", "/learning"],
        ["lesson", lesson!],
        ["labs", "/labs"],
        ["lab-workspace", lab!],
        ["progress", "/progress"],
        ["notes", "/notes"],
        ["reports", "/reports"],
        ["report-editor", "/reports/create"],
        ["profile", "/profile"],
        ["settings", "/settings/general"],
        ["studio", "/studio"],
        ["studio-editor", editor],
    ];
    for (const theme of ["light", "dark"] as const) {
        await page.goto("/dashboard");
        if ((await page.locator("html").getAttribute("data-theme")) !== theme)
            await page
                .getByRole("button", {
                    name:
                        theme === "dark"
                            ? "Aktifkan tema gelap"
                            : "Aktifkan tema terang",
                })
                .click();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        for (const [name, route] of routes) {
            const response = await page.goto(route);
            expect(response?.ok(), `${name}: HTTP`).toBeTruthy();
            await expect(page.locator("main#main")).toBeVisible();
            await save(name, theme);
        }
    }
});
