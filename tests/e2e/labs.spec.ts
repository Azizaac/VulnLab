import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.use({ actionTimeout: 10000 });
async function signup(page: Page, name: string) {
    await page.goto("/register");
    await page.getByLabel("Nama", { exact: true }).fill("Lab Learner");
    await page
        .getByLabel("Email", { exact: true })
        .fill(`lab-${name}-${Date.now()}@example.com`);
    await page
        .getByLabel("Kata sandi", { exact: true })
        .fill("secure-password-123");
    await page.getByLabel("Ulangi kata sandi").fill("secure-password-123");
    await page.getByLabel("Tanggal mulai rencana").fill("2026-10-24");
    await page.getByRole("button", { name: "Buat akun" }).click();
    await expect(
        page.getByRole("heading", { name: "Halo, Hacker Muda!" }),
    ).toBeVisible();
}
async function panel(page: Page, name: string) {
    const button = page
        .getByRole("navigation", { name: "Panel lab" })
        .getByRole("button", { name, exact: true });
    if (await button.isVisible()) await button.click();
}
async function send(page: Page) {
    await panel(page, "Request");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
        page.getByRole("button", {
            name: "Send",
            exact: true,
            includeHidden: true,
        }),
    ).toBeEnabled({ timeout: 15000 });
    await panel(page, "Response");
    await expect(page.locator(".lab-response-pane code")).toBeVisible();
    const raw = await page.locator(".lab-response-pane code").innerText();
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}
async function audit(page: Page) {
    expect(
        (
            await new AxeBuilder({ page })
                .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
                .analyze()
        ).violations,
    ).toEqual([]);
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
}
test("first two labs: real HTTP, flag validation, reset, XP, persistence, themes and mobile", async ({
    page,
}, info) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await signup(page, info.project.name);
    await page.goto("/labs");
    await expect(page.locator(".lab-grid article")).toHaveCount(8);
    await page.getByLabel("Cari lab", { exact: true }).fill("IDOR");
    await expect(page.locator(".lab-grid article")).toHaveCount(1);
    await page.getByLabel("Cari lab", { exact: true }).clear();
    for (const slug of ["order-idor", "address-bola"]) {
        await page.goto(`/labs/${slug}`);
        await panel(page, "Request");
        await expect(
            page.getByRole("button", { name: "Send", exact: true }),
        ).toBeDisabled();
        await page
            .getByRole("button", { name: "Mulai Sandbox", exact: true })
            .click();
        await expect(
            page.getByText("Sandbox berjalan", { exact: true }),
        ).toBeVisible();
        await panel(page, "Request");
        const baseline = await send(page);
        expect(baseline.order?.owner || baseline.profile?.owner).toBe(
            "customer_b",
        );
        await panel(page, "Request");
        await page
            .getByLabel("Endpoint latihan", { exact: true })
            .selectOption(slug === "order-idor" ? "order-a" : "profile-a");
        if (slug === "address-bola")
            await page
                .getByLabel("HTTP method", { exact: true })
                .selectOption("PATCH");
        const exploit = await send(page);
        const flag = exploit.order?.flag || exploit.flag;
        expect(flag).toMatch(/^VULNLAB\{[a-f0-9]{48}\}$/);
        await panel(page, "Request");
        await page
            .getByLabel("Mode latihan", { exact: true })
            .selectOption("secure");
        await send(page);
        await expect(page.locator(".http-panel-title")).toContainText([
            "Request",
            "Status: 403",
        ]);
        await panel(page, "Instruksi");
        await page.getByRole("button", { name: /Hint \(0\/3\)/ }).click();
        await expect(page.getByText("Hint 1", { exact: true })).toBeVisible();
        await panel(page, "Flag");
        const form = page.locator(".lab-flag-box:visible");
        await form
            .getByLabel("Flag sesi", { exact: true })
            .fill("VULNLAB{invalid}");
        await form
            .getByRole("button", { name: "Kirim Flag", exact: true })
            .click();
        await expect(
            page.locator(".lab-feedback").getByRole("status"),
        ).toContainText("Flag belum cocok");
        await form.getByLabel("Flag sesi", { exact: true }).fill(flag);
        await form
            .getByRole("button", { name: "Kirim Flag", exact: true })
            .click();
        await expect(
            page.locator(".lab-feedback").getByRole("status"),
        ).toContainText("Flag tervalidasi");
        await expect(page.locator(".lab-live-status")).toHaveText("Selesai");
        await page.reload();
        await expect(page.locator(".lab-live-status")).toHaveText("Selesai");
        await panel(page, "Instruksi");
        await page.getByRole("button", { name: "Solusi", exact: true }).click();
        await expect(
            page.getByRole("heading", { name: "Contoh implementasi aman" }),
        ).toBeVisible();
        await page
            .getByRole("button", { name: "Reset Lab", exact: true })
            .click();
        await page
            .getByRole("button", { name: "Ya, reset data dummy" })
            .click();
        await expect(
            page.locator(".lab-feedback").getByRole("status"),
        ).toContainText("Data dummy direset");
        await expect(page.locator(".lab-live-status")).toHaveText("Selesai");
        await panel(page, "Request");
        const resetBaseline = await send(page);
        if (slug === "address-bola")
            expect(resetBaseline.profile.city).toBe("Jakarta");
    }
    await page.goto("/dashboard");
    await expect(
        page.getByRole("heading", {
            name: "2 lab selesai · 100 XP",
            exact: true,
        }),
    ).toBeVisible();
    await page.goto("/learning/idor");
    await page
        .locator(".reader-sources")
        .getByText("Praktik terkait", { exact: true })
        .isVisible();
    await page.goto("/labs/order-idor");
    await panel(page, "Request");
    await page
        .getByLabel("Endpoint latihan", { exact: true })
        .selectOption("order-a");
    await send(page);
    for (const theme of ["light", "dark"]) {
        if ((await page.locator("html").getAttribute("data-theme")) !== theme)
            await page
                .getByRole("button", {
                    name:
                        theme === "dark"
                            ? "Aktifkan tema gelap"
                            : "Aktifkan tema terang",
                })
                .click();
        await expect(page.locator(".theme-toggle")).toBeEnabled();
        await panel(page, "Response");
        await audit(page);
        await page.screenshot({
            path: `docs/screenshots/sprint3/workspace-${info.project.name}-${theme}.png`,
            fullPage: true,
        });
        await page.screenshot({
            path: `docs/screenshots/sprint3/workspace-${info.project.name}-${theme}-viewport.png`,
        });
    }
    await page.goto("/labs");
    for (const theme of ["light", "dark"]) {
        if ((await page.locator("html").getAttribute("data-theme")) !== theme)
            await page
                .getByRole("button", {
                    name:
                        theme === "dark"
                            ? "Aktifkan tema gelap"
                            : "Aktifkan tema terang",
                })
                .click();
        await expect(page.locator(".theme-toggle")).toBeEnabled();
        await audit(page);
        await page.screenshot({
            path: `docs/screenshots/sprint3/catalog-${info.project.name}-${theme}.png`,
            fullPage: true,
        });
    }
    expect(errors).toEqual([]);
});

test("remaining six labs: real vulnerable and secure responses, browser XSS proof and persistent solves", async ({
    page,
}, info) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await signup(page, `six-${info.project.name}`);
    for (const slug of [
        "search-xss",
        "product-sqli",
        "profile-mass-assignment",
        "jwt-validation",
        "admin-bfla",
        "coupon-logic",
    ]) {
        await page.goto(`/labs/${slug}`);
        await page
            .getByRole("button", { name: "Mulai Sandbox", exact: true })
            .click();
        await expect(
            page.getByText("Sandbox berjalan", { exact: true }),
        ).toBeVisible();
        const baseline = await send(page);
        let flag = "";
        await panel(page, "Request");
        if (slug === "search-xss" || slug === "product-sqli") {
            await page
                .getByRole("button", { name: "Body / Params", exact: true })
                .click();
            await page.getByLabel("Request body atau query JSON").fill(
                JSON.stringify({
                    q:
                        slug === "search-xss"
                            ? "<script>window.__coreXss=1;labProof()</script>"
                            : "' OR 1=1 -- ",
                }),
            );
        }
        if (slug === "profile-mass-assignment") {
            expect(baseline.profile.role).toBe("customer");
            await page
                .getByLabel("HTTP method", { exact: true })
                .selectOption("PATCH");
            await page
                .getByRole("button", { name: "Body / Params", exact: true })
                .click();
            await page
                .getByLabel("Request body atau query JSON")
                .fill('{"city":"Solo","role":"admin"}');
        }
        if (slug === "jwt-validation")
            await page
                .getByRole("button", { name: "Ubah role token dummy → admin" })
                .click();
        if (slug === "admin-bfla")
            await page
                .getByLabel("Endpoint latihan", { exact: true })
                .selectOption("publish");
        if (slug === "coupon-logic") {
            expect(baseline.cart.total).toBe(100);
            await page
                .getByLabel("Endpoint latihan", { exact: true })
                .selectOption("coupon");
            await send(page);
        }
        const result = await send(page);
        if (slug === "search-xss") {
            expect(typeof result).toBe("string");
            await page
                .getByRole("button", { name: "Headers", exact: true })
                .last()
                .click();
            const headers = JSON.parse(
                await page.locator(".lab-response-pane code").innerText(),
            );
            expect(headers["x-lab-script-executed"]).toBe("true");
            flag = headers["x-lab-flag"];
            expect(
                await page.evaluate(() => Object.hasOwn(window, "__coreXss")),
            ).toBe(false);
        } else
            flag =
                slug === "product-sqli"
                    ? result.products.find((p: { id: number }) => p.id === 3)
                          .description
                    : result.flag;
        expect(flag).toMatch(/^VULNLAB\{[a-f0-9]{48}\}$/);
        await panel(page, "Request");
        await page
            .getByLabel("Mode latihan", { exact: true })
            .selectOption("secure");
        const safe = await send(page);
        if (slug === "search-xss") {
            expect(safe).toContain("&lt;script&gt;");
            await page
                .getByRole("button", { name: "Headers", exact: true })
                .last()
                .click();
            expect(
                JSON.parse(
                    await page.locator(".lab-response-pane code").innerText(),
                )["x-lab-script-executed"],
            ).toBe("false");
        } else if (slug === "product-sqli")
            expect(safe.products).toHaveLength(0);
        else
            await expect(
                page.locator(".http-panel-title").last(),
            ).toContainText(
                slug === "jwt-validation"
                    ? "401"
                    : slug === "profile-mass-assignment"
                      ? "422"
                      : slug === "coupon-logic"
                        ? "409"
                        : "403",
            );
        await panel(page, "Flag");
        const form = page.locator(".lab-flag-box:visible");
        await form.getByLabel("Flag sesi", { exact: true }).fill(flag);
        await form
            .getByRole("button", { name: "Kirim Flag", exact: true })
            .click();
        await expect(
            page.locator(".lab-feedback").getByRole("status"),
        ).toContainText("Flag tervalidasi");
        await expect(page.locator(".lab-live-status")).toHaveText("Selesai");
        await page.reload();
        await expect(page.locator(".lab-live-status")).toHaveText("Selesai");
    }
    await page.goto("/dashboard");
    await expect(
        page.getByRole("heading", {
            name: "6 lab selesai · 600 XP",
            exact: true,
        }),
    ).toBeVisible();
    await page.goto("/labs");
    await page.getByLabel("Status lab", { exact: true }).selectOption("solved");
    await expect(page.locator(".lab-grid article")).toHaveCount(6);
    await page
        .getByLabel("Tingkat kesulitan", { exact: true })
        .selectOption("Hard");
    await expect(page.locator(".lab-grid article")).toHaveCount(1);
    expect(errors).toEqual([]);
});
