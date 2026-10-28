import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, relative } from "node:path";

test("v8 pages reflow across additional viewport widths", async ({
    page,
}, info) => {
    test.skip(info.project.name !== "desktop");
    test.setTimeout(180_000);
    const database = process.env.E2E_DB_DATABASE;
    if (!database) throw new Error("A disposable E2E_DB_DATABASE is required.");
    const rel = relative(realpathSync(tmpdir()), realpathSync(database));
    if (!rel || rel.startsWith("..") || isAbsolute(rel))
        throw new Error("Database must be under the temporary directory.");
    const nonce = randomBytes(6).toString("hex");
    const email = `v8-reflow-${nonce}@example.test`;
    const password = randomBytes(24).toString("hex");
    await page.goto("/register");
    await page.getByLabel("Nama", { exact: true }).fill("V8 Reflow");
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
    execFileSync(
        process.env.PHP_BINARY || "php",
        ["artisan", "studio:import-legacy"],
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
    await page.goto("/studio/content");
    const editor = await page
        .locator('.v5-content-list a[href*="/edit"]')
        .first()
        .getAttribute("href");
    expect(editor).toBeTruthy();
    const routes = [
        "/dashboard",
        "/roadmap",
        "/learning",
        "/learning/client-server",
        "/labs",
        "/labs/order-idor",
        "/progress",
        "/notes",
        "/reports",
        "/reports/create",
        "/profile",
        "/settings/general",
        "/studio",
        editor!,
    ];
    for (const width of [320, 375, 768, 1024]) {
        await page.setViewportSize({ width, height: 844 });
        for (const theme of ["light", "dark"] as const) {
            await page.goto("/dashboard");
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
            await expect(page.locator("html")).toHaveAttribute(
                "data-theme",
                theme,
            );
            for (const route of routes) {
                let response;
                for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                        response = await page.goto(route);
                        break;
                    } catch (error) {
                        if (
                            !String(error).includes("ERR_NO_BUFFER_SPACE") ||
                            attempt === 2
                        )
                            throw error;
                        await page.waitForTimeout(1000);
                    }
                }
                expect(
                    response?.ok(),
                    `${width}px ${theme}: ${route}`,
                ).toBeTruthy();
                await expect(page.locator("main#main")).toBeVisible();
                const overflow = await page.evaluate(() => {
                    if (document.documentElement.scrollWidth <= innerWidth)
                        return [];
                    return Array.from(document.querySelectorAll("body *"))
                        .map((el) => ({
                            tag: el.tagName,
                            class: el.getAttribute("class"),
                            right: Math.round(el.getBoundingClientRect().right),
                        }))
                        .filter((el) => el.right > innerWidth + 1)
                        .slice(0, 12);
                });
                expect(
                    overflow,
                    `${width}px ${theme}: ${route} overflow`,
                ).toEqual([]);
            }
        }
    }
});
