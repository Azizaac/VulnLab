import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";

test.use({ actionTimeout: 15000 });
const php = process.env.PHP_BINARY || "php";
const dbEnv = {
    ...process.env,
    APP_ENV: "testing",
    DB_CONNECTION: "sqlite",
    DB_DATABASE: `${process.cwd()}/database/e2e.sqlite`,
    SESSION_DRIVER: "database",
    APP_KEY: "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
};
async function register(page: Page, email: string, password: string) {
    await page.goto("/register");
    await page.getByLabel("Nama", { exact: true }).fill("Pelajar V5");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(password);
    await page.getByLabel("Ulangi kata sandi").fill(password);
    await page.getByRole("button", { name: "Buat akun" }).click();
    await expect(
        page.getByRole("heading", { name: "Halo, Hacker Muda!" }),
    ).toBeVisible();
}
async function login(page: Page, email: string, password: string) {
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(
        page.getByRole("heading", { name: "Halo, Hacker Muda!" }),
    ).toBeVisible();
}
async function audit(page: Page) {
    const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
    expect(
        result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
                target: n.target,
                summary: n.failureSummary,
            })),
        })),
    ).toEqual([]);
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
}
async function screenshot(
    page: Page,
    name: string,
    viewport: string,
    theme: string,
) {
    fs.mkdirSync("docs/screenshots/v5", { recursive: true });
    await page.screenshot({
        path: `docs/screenshots/v5/${name}-${viewport}-${theme}.png`,
        fullPage: true,
    });
}
async function api(
    page: Page,
    url: string,
    method: string,
    body: unknown = {},
) {
    return page.evaluate(
        async ({ url, method, body }) => {
            const cookie = document.cookie
                .split("; ")
                .find((s) => s.startsWith("XSRF-TOKEN="));
            const response = await fetch(url, {
                method,
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": decodeURIComponent(cookie?.slice(11) ?? ""),
                },
                body: JSON.stringify(body),
            });
            return {
                status: response.status,
                body: await response.json().catch(() => ({})),
            };
        },
        { url, method, body },
    );
}

test("V5 account: persistent profile, real sessions, private export, theme rollback and accessible settings", async ({
    page,
    browser,
}, info) => {
    test.setTimeout(180000);
    const password = randomBytes(18).toString("hex");
    const email = `v5-account-${info.project.name}-${Date.now()}@example.test`;
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await register(page, email, password);
    expect((await page.request.get("/studio")).status()).toBe(403);
    await page.goto("/settings/general");
    await page
        .getByLabel("Nama Tampilan", { exact: true })
        .fill("Pelajar Lima");
    await page
        .getByLabel("Username", { exact: true })
        .fill(`v5_${randomBytes(5).toString("hex")}`);
    await page
        .getByLabel("Bio", { exact: true })
        .fill("Belajar dengan bukti dan rasa ingin tahu.");
    await page.getByLabel("Zona Waktu", { exact: true }).selectOption("UTC");
    await page
        .getByRole("button", { name: "Simpan Perubahan", exact: true })
        .click();
    await expect(
        page.getByText("Profil tersimpan.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Nama Tampilan", { exact: true })).toHaveValue(
        "Pelajar Lima",
    );
    for (const theme of ["light", "dark"] as const) {
        expect(
            (await api(page, "/settings/theme", "PATCH", { theme })).status,
        ).toBe(200);
        for (const section of ["general", "appearance", "security"]) {
            await page.goto(`/settings/${section}`);
            await audit(page);
            await screenshot(
                page,
                `settings-${section}`,
                info.project.name,
                theme,
            );
        }
        await page.goto("/profile");
        await expect(
            page.getByRole("heading", { name: "Pelajar Lima" }),
        ).toBeVisible();
        await audit(page);
        await screenshot(page, "profile", info.project.name, theme);
    }
    await page.goto("/settings/appearance");
    await page.route("**/settings/theme", (route) =>
        route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Gagal menyimpan tema uji" }),
        }),
    );
    await page
        .getByLabel("Tema tampilan", { exact: true })
        .selectOption("light");
    await expect(page.locator(".v5-error")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.unroute("**/settings/theme");
    await page
        .getByLabel("Tema tampilan", { exact: true })
        .selectOption("system");
    await expect(
        page.getByText("Tema tersimpan.", { exact: true }),
    ).toBeVisible();
    await page.goto("/settings/privacy");
    await page
        .getByLabel("Tampilkan aktivitas terbaru pada profil pribadi saya")
        .uncheck();
    await page.getByRole("button", { name: "Simpan Privasi" }).click();
    await expect(
        page.getByText("Preferensi privasi tersimpan.", { exact: true }),
    ).toBeVisible();
    await page.goto("/profile");
    await expect(
        page.getByRole("heading", { name: "Aktivitas terbaru" }),
    ).toHaveCount(0);
    const other = await browser.newContext({
        viewport: { width: 1440, height: 900 },
    });
    const second = await other.newPage();
    await login(second, email, password);
    await page.goto("/settings/security");
    await expect(
        page.getByText("Komputer", { exact: false }).first(),
    ).toBeVisible();
    await page.getByLabel("Password saat ini", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Keluar dari sesi lain" }).click();
    await expect(
        page.getByText("Sesi lain dihentikan.", { exact: true }).first(),
    ).toBeVisible();
    await second.goto("/profile");
    await expect(second).toHaveURL(/\/login/);
    await other.close();
    await page.goto("/settings/data");
    await page.getByLabel("Password saat ini", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Buat ekspor data" }).click();
    await expect(
        page.getByRole("link", { name: "Unduh ekspor pribadi" }),
    ).toBeVisible();
    const url = await page
        .getByRole("link", { name: "Unduh ekspor pribadi" })
        .getAttribute("href");
    const exported = await page.request.get(url!);
    expect(exported.status()).toBe(200);
    const raw = await exported.text();
    expect(raw).not.toContain(password);
    expect(raw).not.toContain("remember_token");
    await page.goto("/settings/security");
    await page
        .getByLabel("Password saat ini", { exact: true })
        .fill("wrong-password");
    await page
        .getByLabel("Password Baru", { exact: true })
        .fill("new-password-12345");
    await page
        .getByLabel("Konfirmasi Password Baru", { exact: true })
        .fill("new-password-12345");
    await page.getByRole("button", { name: "Perbarui Password" }).click();
    await expect(page.locator(".v5-error")).toBeVisible();
    await expect(
        page.getByLabel("Password saat ini", { exact: true }),
    ).toBeFocused();
    await audit(page);
    const nextPassword = randomBytes(18).toString("hex");
    await page.getByLabel("Password saat ini", { exact: true }).fill(password);
    await page.getByLabel("Password Baru", { exact: true }).fill(nextPassword);
    await page
        .getByLabel("Konfirmasi Password Baru", { exact: true })
        .fill(nextPassword);
    await page.getByRole("button", { name: "Perbarui Password" }).click();
    await expect(
        page.getByText("Password diperbarui. Sesi lain dihentikan.", {
            exact: true,
        }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Buka menu akun" }).click();
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(
        page.getByText("Email atau kata sandi tidak cocok.", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Kata sandi", { exact: true }).fill(nextPassword);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(
        page.getByRole("heading", { name: "Halo, Hacker Muda!" }),
    ).toBeVisible({ timeout: 15000 });
    expect(errors).toEqual([]);
});

test("V5 Studio: author to reviewer to publisher to learner, conflict, metadata and roadmap controls", async ({
    browser,
}, info) => {
    test.setTimeout(240000);
    const password = randomBytes(18).toString("hex");
    const nonce = randomBytes(5).toString("hex");
    const pages: Record<string, Page> = {};
    const contexts = [];
    for (const role of ["editor", "reviewer", "admin", "learner"]) {
        const context = await browser.newContext({
            viewport: info.project.use.viewport,
        });
        contexts.push(context);
        const page = await context.newPage();
        pages[role] = page;
        const email = `v5-${role}-${nonce}@example.test`;
        execFileSync(php, ["tests/browser-fixture.php"], {
            env: {
                ...dbEnv,
                VULNLAB_TEST_EMAIL: email,
                VULNLAB_TEST_PASSWORD: password,
            },
            stdio: "pipe",
        });
        if (role !== "learner") {
            execFileSync(
                php,
                ["artisan", "studio:grant-role", email, role, "--confirm"],
                { env: dbEnv, stdio: "pipe" },
            );
        }
        await login(page, email, password);
    }
    execFileSync(php, ["artisan", "studio:import-legacy"], {
        env: dbEnv,
        stdio: "pipe",
    });
    const editor = pages.editor;
    const reviewer = pages.reviewer;
    const admin = pages.admin;
    const learner = pages.learner;
    const clientErrors: string[] = [];
    for (const page of Object.values(pages))
        page.on("pageerror", (e) => clientErrors.push(e.message));
    await editor.goto("/studio");
    await audit(editor);
    await screenshot(editor, "studio", info.project.name, "light");
    await editor.getByRole("button", { name: "+ Konten Baru" }).click();
    await editor
        .getByLabel("Judul", { exact: true })
        .fill("Memahami Ownership V5");
    await editor.getByLabel("Slug URL stabil").fill(`ownership-v5-${nonce}`);
    await editor
        .getByRole("button", { name: "Buat Draft", exact: true })
        .click();
    await expect(
        editor.getByRole("heading", { name: "Editor Materi", exact: true }),
    ).toBeVisible();
    const entryUrl = new URL(editor.url()).pathname;
    await editor
        .getByLabel("Ringkasan", { exact: true })
        .fill("Periksa pemilik objek pada setiap request.");
    await editor
        .getByLabel("Audiens", { exact: true })
        .fill("Pelajar dasar Web Security");
    await editor
        .getByLabel("Tujuan belajar", { exact: true })
        .fill("Menjelaskan pemeriksaan pemilik objek.");
    await editor
        .getByLabel("Konten Markdown", { exact: true })
        .fill(
            "# Ownership V5\nGunakan dua akun dummy di lab lokal.\n<script>alert('unsafe')</script>",
        );
    await editor.getByRole("button", { name: "+ Tambah Sumber" }).click();
    await editor
        .getByLabel("Judul sumber 1", { exact: true })
        .fill("OWASP IDOR");
    await editor
        .getByLabel("URL HTTPS 1", { exact: true })
        .fill(
            "https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html",
        );
    await editor.getByLabel("Penerbit 1", { exact: true }).fill("OWASP");
    await editor
        .getByLabel("Lisensi / atribusi 1", { exact: true })
        .fill("CC BY-SA 4.0 — diperiksa pada fixture tes");
    await expect(
        editor.getByRole("button", { name: "Kirim Review", exact: true }),
    ).toBeEnabled({ timeout: 15000 });
    for (const theme of ["light", "dark"] as const) {
        await api(editor, "/settings/theme", "PATCH", { theme });
        await editor.reload();
        await audit(editor);
        await screenshot(editor, "editor", info.project.name, theme);
    }
    await editor.getByRole("button", { name: "Pratinjau pelajar" }).click();
    await expect(editor.getByRole("dialog")).toBeVisible();
    await expect(editor.getByRole("dialog").locator("script")).toHaveCount(0);
    await editor.getByRole("button", { name: "Tutup pratinjau" }).click();
    await editor
        .getByRole("button", { name: "Kirim Review", exact: true })
        .click();
    await expect(editor.locator(".v5-editor-toolbar")).toContainText(
        "Dalam review",
    );
    expect(
        (await learner.request.get(`/learning/ownership-v5-${nonce}`)).status(),
    ).toBe(404);
    await reviewer.goto("/studio/reviews");
    await audit(reviewer);
    await screenshot(reviewer, "reviews", info.project.name, "light");
    await reviewer.goto(entryUrl);
    for (const label of [
        "Akurasi teknis",
        "Kejelasan bahasa",
        "Keamanan latihan lokal",
        "Sumber diperiksa manual",
        "Lisensi / atribusi diperiksa",
    ])
        await reviewer.getByLabel(label, { exact: true }).check();
    await reviewer
        .getByLabel("Catatan reviewer", { exact: true })
        .fill("Skenario lokal dan sumber diperiksa pada alur browser tes.");
    await reviewer
        .getByLabel("Setujui revisi (kosongkan untuk meminta perubahan)")
        .check();
    await reviewer
        .getByRole("button", { name: "Simpan keputusan review" })
        .click();
    await expect(reviewer.locator(".v5-editor-toolbar")).toContainText(
        "Disetujui",
    );
    await admin.goto(entryUrl);
    await admin.getByRole("button", { name: "Terbitkan revisi" }).click();
    await expect(admin.locator(".v5-editor-toolbar")).toContainText("Terbit");
    await learner.goto(`/learning/ownership-v5-${nonce}`);
    await expect(
        learner.getByRole("heading", { name: "Ownership V5", exact: true }),
    ).toBeVisible();
    await expect(
        learner.locator("script").filter({ hasText: "unsafe" }),
    ).toHaveCount(0);
    await editor.reload();
    await editor
        .getByRole("button", { name: "Buat revisi dari versi ini" })
        .click();
    await expect(
        editor.getByRole("button", { name: "Kirim Review", exact: true }),
    ).toBeVisible();
    await editor.route("**/studio/revisions/*", async (route) => {
        if (route.request().method() === "PATCH")
            await route.fulfill({
                status: 409,
                contentType: "application/json",
                body: JSON.stringify({ message: "Versi di server berubah." }),
            });
        else await route.continue();
    });
    await editor
        .getByLabel("Ringkasan", { exact: true })
        .fill("Draft lokal saat konflik tetap disimpan.");
    await expect(
        editor.getByText("Konflik versi — perubahan lokal dipertahankan", {
            exact: true,
        }),
    ).toBeVisible();
    await expect(editor.getByLabel("Ringkasan", { exact: true })).toHaveValue(
        "Draft lokal saat konflik tetap disimpan.",
    );
    await editor.unroute("**/studio/revisions/*");
    await editor
        .getByRole("button", { name: "Simpan Draft", exact: true })
        .click();
    await expect(
        editor.getByRole("button", { name: "Kirim Review", exact: true }),
    ).toBeEnabled();
    await admin.goto("/studio/labs");
    await audit(admin);
    await admin.locator(".v5-content-list a").first().click();
    await expect(
        admin.getByText("Batas metadata:", { exact: false }),
    ).toBeVisible();
    expect(await admin.locator('input[name="command"]').count()).toBe(0);
    await admin.goto("/studio/roadmap");
    await admin.locator(".v5-content-list a").first().click();
    if (
        await admin
            .getByRole("button", { name: "Buat revisi dari versi ini" })
            .isVisible()
    )
        await admin
            .getByRole("button", { name: "Buat revisi dari versi ini" })
            .click();
    const stage = admin.locator('[id="body"] input').first();
    const original = await stage.inputValue();
    await admin
        .getByRole("button", {
            name: `Turunkan tahap ${original}`,
            exact: true,
        })
        .click();
    await expect(stage).not.toHaveValue(original);
    await expect(
        admin.getByRole("button", { name: "Kirim Review", exact: true }),
    ).toBeEnabled({ timeout: 15000 });
    await admin.reload();
    await expect(admin.locator('[id="body"] input').first()).not.toHaveValue(
        original,
    );
    await admin.goto("/studio/users");
    await admin
        .getByLabel("Cari pengguna", { exact: true })
        .fill(`v5-learner-${nonce}@example.test`);
    await admin.getByRole("button", { name: "Cari", exact: true }).click();
    await admin
        .locator(".v5-row")
        .filter({ hasText: `v5-learner-${nonce}@example.test` })
        .getByRole("button", { name: /Kelola izin/ })
        .click();
    await admin.getByLabel("Peran", { exact: true }).selectOption("reviewer");
    await admin
        .getByRole("button", { name: "Simpan izin", exact: true })
        .click();
    await expect(admin.locator(".v5-error")).toBeVisible();
    await admin
        .getByLabel("Password admin saat ini", { exact: true })
        .fill(password);
    await admin
        .getByRole("button", { name: "Simpan izin", exact: true })
        .click();
    await expect(
        admin.getByText("Izin pengguna diperbarui.", { exact: true }),
    ).toBeVisible();
    await learner.goto("/profile");
    await expect(learner).toHaveURL(/\/login/);
    expect(clientErrors).toEqual([]);
    for (const context of contexts) await context.close();
});
