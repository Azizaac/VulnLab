import { chromium, expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

test.use({ actionTimeout: 15000 });

const evidence = process.env.QA_V6_SCREENSHOT_ROOT || "docs/qa/screenshots";
const php = process.env.PHP_BINARY || "php";
const dbEnv = {
    ...process.env,
    APP_ENV: "testing",
    DB_CONNECTION: "sqlite",
    DB_DATABASE: `${process.cwd()}/database/e2e.sqlite`,
    SESSION_DRIVER: "database",
    APP_KEY: "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
};
function fixture(admin = false) {
    const email = `v6-${randomBytes(7).toString("hex")}@example.test`,
        password = randomBytes(20).toString("hex");
    execFileSync(php, ["tests/browser-fixture.php"], {
        env: {
            ...dbEnv,
            VULNLAB_TEST_EMAIL: email,
            VULNLAB_TEST_PASSWORD: password,
        },
        stdio: "pipe",
    });
    if (admin)
        execFileSync(
            php,
            ["artisan", "studio:grant-role", email, "admin", "--confirm"],
            { env: dbEnv, stdio: "pipe" },
        );
    return { email, password };
}
async function login(page: Page, account: ReturnType<typeof fixture>) {
    await page.goto("http://127.0.0.1:8089/login");
    await page.getByLabel("Email", { exact: true }).fill(account.email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(
        page.getByRole("heading", { name: "Halo, Hacker Muda!" }),
    ).toBeVisible();
}
async function reflow(page: Page) {
    await expect(page.locator("main").first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
}

test("Sprint 6: CSP, private history, narrow reflow, keyboard and reduced motion", async ({
    page,
}, info) => {
    test.skip(
        !["desktop", "mobile320"].includes(info.project.name),
        "Other widths run the complete existing workflow suites.",
    );
    test.setTimeout(240000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const account = fixture(true);
    await login(page, account);
    const response = await page.request.get("/settings/general");
    expect(response.headers()["content-security-policy"]).toContain(
        "object-src 'none'",
    );
    expect(response.headers()["cache-control"]).toContain("no-store");
    // Attempt a real inline script without the per-response nonce.
    const blocked = await page.evaluate(async () => {
        const result = new Promise<boolean>((resolve) =>
            document.addEventListener(
                "securitypolicyviolation",
                (e) => resolve(e.violatedDirective === "script-src-elem"),
                { once: true },
            ),
        );
        const script = document.createElement("script");
        script.textContent = 'document.documentElement.dataset.injected="yes"';
        document.body.append(script);
        return await Promise.race([
            result,
            new Promise<boolean>((resolve) =>
                setTimeout(() => resolve(false), 1500),
            ),
        ]);
    });
    expect(blocked).toBe(true);
    expect(await page.locator("html").getAttribute("data-injected")).toBeNull();
    await expect
        .poll(() =>
            page.evaluate(() => history.state.page instanceof ArrayBuffer),
        )
        .toBe(true);
    expect(
        await page.evaluate(() => JSON.stringify(history.state)),
    ).not.toContain(account.email);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const routes = [
        "dashboard",
        "roadmap",
        "learning",
        "notes",
        "labs",
        "progress",
        "reports",
        "profile",
        "settings/general",
        "settings/security",
        "studio",
        "studio/content",
        "studio/reviews",
        "studio/users",
    ];
    fs.mkdirSync(evidence, { recursive: true });
    for (const route of routes) {
        await page.goto(`/${route}`);
        for (const theme of ["light", "dark"]) {
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
            await reflow(page);
            const audit = await new AxeBuilder({ page })
                .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
                .analyze();
            expect(
                audit.violations.map((v) => ({
                    id: v.id,
                    targets: v.nodes.map((n) => n.target),
                })),
            ).toEqual([]);
            await page.screenshot({
                path: `${evidence}/v6-${route.replaceAll("/", "-")}-${info.project.name}-${theme}.png`,
            });
        }
        await page.keyboard.press("Tab");
        await expect(page.locator(":focus")).toBeVisible();
    }
    for (const [slug, heading, sample] of [
        ["rest-api-json", "Penjelasan contoh HTTP", "HTTP/1.1 200 OK"],
        [
            "laravel-fixes",
            "Penjelasan contoh otorisasi Laravel",
            "Gate::authorize('view', $order)",
        ],
    ]) {
        await page.goto(`/learning/${slug}`);
        await expect(
            page.getByRole("heading", { name: heading, exact: true }),
        ).toBeVisible();
        await page
            .getByRole("tab", { name: "Contoh Kode", exact: true })
            .click();
        await expect(
            page.locator("main pre").filter({ hasText: sample }),
        ).toBeVisible();
    }
    // Offline failure keeps typed values. Reconnect and explicitly retry.
    await page.goto("/settings/general");
    await page
        .getByLabel("Bio", { exact: true })
        .fill("Draft bertahan saat offline");
    await page.context().setOffline(true);
    await page
        .getByRole("button", { name: "Simpan Perubahan", exact: true })
        .click();
    await expect(page.getByLabel("Bio", { exact: true })).toHaveValue(
        "Draft bertahan saat offline",
    );
    await page.context().setOffline(false);
    await expect(
        page.getByRole("button", { name: "Simpan Perubahan", exact: true }),
    ).toBeEnabled();
    let saves = 0;
    await page.route("**/account/settings/general", async (route) => {
        saves++;
        await new Promise((resolve) => setTimeout(resolve, 350));
        await route.continue();
    });
    await page
        .getByRole("button", { name: "Simpan Perubahan", exact: true })
        .dblclick();
    await expect(
        page.getByText("Profil tersimpan.", { exact: true }),
    ).toBeVisible();
    expect(saves).toBe(1);
    await page.unroute("**/account/settings/general");
    await page.reload();
    await expect(page.getByLabel("Bio", { exact: true })).toHaveValue(
        "Draft bertahan saat offline",
    );
    await page
        .getByRole("button", { name: "Buka menu akun", exact: true })
        .click();
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
    expect(
        (
            await page.request.get("/settings/general", { maxRedirects: 0 })
        ).status(),
    ).toBe(302);
    await page.getByLabel("Email", { exact: true }).fill(account.email);
    await page
        .getByLabel("Kata sandi", { exact: true })
        .fill("incorrect-password-for-qa");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
    await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute(
        "aria-invalid",
        "true",
    );
    expect(errors).toEqual([]);
});

test("Sprint 6: actual Chromium tab zoom at 200 percent", async ({
    browserName,
}, info) => {
    test.skip(
        info.project.name !== "desktop",
        "One real desktop browser zoom run.",
    );
    test.setTimeout(120000);
    expect(browserName).toBe("chromium");
    const extension = path.resolve(".tools/v6/zoom-extension");
    fs.mkdirSync(extension, { recursive: true });
    fs.writeFileSync(
        path.join(extension, "manifest.json"),
        JSON.stringify({
            manifest_version: 3,
            name: "Local QA Zoom",
            version: "1.0",
            permissions: ["tabs"],
            background: { service_worker: "worker.js" },
        }),
    );
    fs.writeFileSync(
        path.join(extension, "worker.js"),
        "chrome.runtime.onInstalled.addListener(()=>{});",
    );
    const context = await chromium.launchPersistentContext(
        path.resolve(
            `.tools/v6/zoom-profile-${randomBytes(4).toString("hex")}`,
        ),
        {
            channel: "chromium",
            headless: true,
            viewport: null,
            args: [
                "--window-size=1440,900",
                `--disable-extensions-except=${extension}`,
                `--load-extension=${extension}`,
            ],
        },
    );
    try {
        const worker =
            context.serviceWorkers()[0] ||
            (await context.waitForEvent("serviceworker"));
        const page = context.pages()[0];
        await login(page, fixture(true));
        const before = await page.evaluate(() => ({
            width: innerWidth,
            dpr: devicePixelRatio,
        }));
        const zoom = await worker.evaluate(async () => {
            const api = (
                globalThis as unknown as {
                    chrome: {
                        tabs: {
                            query: (q: object) => Promise<{ id: number }[]>;
                            setZoom: (id: number, z: number) => Promise<void>;
                            getZoom: (id: number) => Promise<number>;
                        };
                    };
                }
            ).chrome.tabs;
            const [tab] = await api.query({
                active: true,
                lastFocusedWindow: true,
            });
            await api.setZoom(tab.id, 2);
            return api.getZoom(tab.id);
        });
        expect(zoom).toBe(2);
        await expect
            .poll(() => page.evaluate(() => devicePixelRatio))
            .toBeGreaterThan(before.dpr * 1.9);
        const after = await page.evaluate(() => ({
            width: innerWidth,
            dpr: devicePixelRatio,
        }));
        expect(after.width).toBeLessThan(before.width * 0.55);
        for (const route of [
            "dashboard",
            "roadmap",
            "learning",
            "notes",
            "labs",
            "progress",
            "reports",
            "settings/security",
            "studio/content",
        ]) {
            await page.goto(`http://127.0.0.1:8089/${route}`);
            await reflow(page);
            for (const theme of ["light", "dark"]) {
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
                await reflow(page);
                await page.screenshot({
                    path: `${evidence}/zoom200-${route.replaceAll("/", "-")}-${theme}.png`,
                });
            }
        }
        fs.writeFileSync(
            "docs/qa/zoom-results.json",
            JSON.stringify(
                {
                    checked_at: new Date().toISOString(),
                    method: "chrome.tabs.setZoom",
                    zoom,
                    before,
                    after,
                    routes: 9,
                },
                null,
                2,
            ) + "\n",
        );
    } finally {
        await context.close();
    }
});
