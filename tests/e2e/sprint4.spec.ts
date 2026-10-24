import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";

async function api<T>(page: Page, url: string, body: unknown = {}): Promise<T> {
    return page.evaluate(
        async ({ url, body }) => {
            const cookie = document.cookie
                .split("; ")
                .find((row) => row.startsWith("XSRF-TOKEN="));
            const response = await fetch(url, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    ...(cookie
                        ? {
                              "X-XSRF-TOKEN": decodeURIComponent(
                                  cookie.slice(11),
                              ),
                          }
                        : {}),
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(
                    `HTTP ${response.status}: ${String(data.message)}`,
                );
            return data;
        },
        { url, body },
    ) as Promise<T>;
}
async function audit(page: Page) {
    expect(
        (
            await new AxeBuilder({ page })
                .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
                .analyze()
        ).violations,
    ).toEqual([]);
    const overflow = await page.evaluate(() => {
        if (document.documentElement.scrollWidth <= window.innerWidth)
            return [];
        return Array.from(document.querySelectorAll("body *"))
            .map((node) => ({
                tag: node.tagName,
                class: node.getAttribute("class"),
                right: Math.round(node.getBoundingClientRect().right),
                width: Math.round(node.getBoundingClientRect().width),
            }))
            .filter((item) => item.right > window.innerWidth + 1)
            .slice(0, 12);
    });
    expect(overflow, "Page must not overflow horizontally").toEqual([]);
}
async function clearToasts(page: Page) {
    const buttons = page.locator(
        '.toast-stack button[aria-label^="Tutup notifikasi"]',
    );
    while (await buttons.count()) await buttons.first().click();
}

test("Sprint 4: genuine progress, private report autosave/review/evidence/export and visual themes", async ({
    page,
}, info) => {
    test.setTimeout(180000);
    const clientErrors: string[] = [];
    page.on("pageerror", (error) => clientErrors.push(error.message));
    await page.goto("/register");
    await page.getByLabel("Nama", { exact: true }).fill("Pelajar Sprint Empat");
    await page
        .getByLabel("Email", { exact: true })
        .fill(`s4-${info.project.name}-${Date.now()}@example.test`);
    await page
        .getByLabel("Kata sandi", { exact: true })
        .fill("secure-password-123");
    await page.getByLabel("Ulangi kata sandi").fill("secure-password-123");
    await page.getByRole("button", { name: "Buat akun" }).click();
    await expect(
        page.getByRole("heading", { name: "Halo, Hacker Muda!" }),
    ).toBeVisible();
    await page.goto("/progress");
    await expect(
        page.getByRole("heading", { name: "Perkembangan Belajarmu" }),
    ).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "Belum ada aktivitas belajar." }),
    ).toBeVisible();
    await expect(page.locator(".s4-level")).toContainText("Level 1 · 0 XP");
    await page.getByLabel("Periode aktivitas").selectOption("30");
    await expect(page).toHaveURL(/period=30/);
    await page
        .getByText("Lihat tabel aktivitas yang dapat diakses", { exact: true })
        .click();
    await expect(page.locator(".s4-data-table tbody tr")).toHaveCount(30);
    await page.getByLabel("Jenis aktivitas").selectOption("study_minutes");
    await expect(page.locator(".s4-inline-info")).toContainText(
        "Belum dilacak",
    );
    await page.getByLabel("Jenis aktivitas").selectOption("all");
    await audit(page);

    fs.mkdirSync("docs/screenshots/sprint4", { recursive: true });
    for (const theme of ["light", "dark"] as const) {
        const current = await page.locator("html").getAttribute("data-theme");
        if (current !== theme)
            await page
                .getByRole("button", {
                    name:
                        theme === "dark"
                            ? "Aktifkan tema gelap"
                            : "Aktifkan tema terang",
                })
                .click();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await audit(page);
        await page.evaluate(() =>
            (document.activeElement as HTMLElement | null)?.blur(),
        );
        await expect(page.locator(".loading-shimmer")).toHaveCount(0);
        await page.screenshot({
            path: `docs/screenshots/sprint4/progress-${info.project.name}-${theme}.png`,
            fullPage: true,
        });
    }

    const { session } = await api<{
        session: { id: string; generation: number };
    }>(page, "/labs/order-idor/sessions");
    try {
        const exploit = await api<{ body: string }>(
            page,
            `/lab-sessions/${session.id}/request`,
            {
                generation: session.generation,
                endpoint: "order-a",
                method: "GET",
                headers_json: JSON.stringify({
                    "X-Dummy-User": "customer_b",
                    "Content-Type": "application/json",
                }),
                body_json: "{}",
                mode: "vulnerable",
            },
        );
        const flag = (JSON.parse(exploit.body) as { order: { flag: string } })
            .order.flag;
        const solved = await api<{ success: boolean; xp_delta: number }>(
            page,
            `/lab-sessions/${session.id}/flag`,
            {
                generation: session.generation,
                submission_id: crypto.randomUUID(),
                flag,
            },
        );
        expect(solved.success).toBe(true);
        expect(solved.xp_delta).toBe(50);

        await page.goto("/reports/create");
        await expect(page.locator(".s4-report-status-row")).toContainText(
            "Perubahan belum tersimpan",
        );
        await page
            .getByRole("button", { name: "Simpan Draft", exact: true })
            .click();
        await expect(page.locator("#title-error")).toContainText(
            "Judul laporan wajib diisi.",
        );
        await expect(
            page.getByLabel("Judul laporan", { exact: true }),
        ).toBeFocused();
        await page
            .getByLabel("Judul laporan", { exact: true })
            .fill("Latihan IDOR pada rincian pesanan dummy");
        const option = page
            .getByLabel("Lab Terkait", { exact: true })
            .locator("option")
            .filter({ hasText: "IDOR" })
            .first();
        await page
            .getByLabel("Lab Terkait", { exact: true })
            .selectOption((await option.getAttribute("value"))!);
        await page
            .getByLabel("Kategori / CWE", { exact: true })
            .fill("CWE-639");
        await page
            .getByLabel("Endpoint Sandbox", { exact: true })
            .fill("/api/orders/101");
        const fields = {
            Ringkasan:
                "Server sandbox menerima permintaan akun dummy B untuk pesanan akun A tanpa memeriksa kepemilikan. Bukti berikut hanya berasal dari sesi latihan lokal.",
            Prasyarat:
                "Dua akun dummy A dan B tersedia pada sesi sandbox lokal yang masih aktif.",
            "Langkah untuk Reproduksi":
                "1. Buka pesanan sendiri sebagai akun dummy B untuk mendapat respons baseline.\n2. Ganti objek menjadi pesanan akun A sambil mempertahankan akun B. Bandingkan mode rentan dan mode aman.",
            "Perilaku Diharapkan":
                "Server menolak akses akun B ke pesanan milik akun A dengan respons 403 atau 404.",
            "Perilaku Aktual":
                "Mode rentan mengembalikan data pesanan akun A kepada akun B tanpa pemeriksaan pemilik.",
            "Bukti / Proof of Concept (PoC) Tersanitasi":
                "GET /api/orders/101 dengan akun dummy B menghasilkan HTTP 200 dan owner customer_a. Mode aman menolak dengan HTTP 403. Tidak ada flag atau data pribadi dalam laporan.",
            Dampak: "Dalam skenario dummy ini, akun B dapat membaca rincian pesanan milik akun A. Bukti hanya mendukung akses baca satu objek dan tidak membuktikan perubahan atau akses di luar sandbox.",
            "Rekomendasi Mitigasi":
                "Batasi query berdasarkan identitas pengguna yang terautentikasi dan jalankan authorization policy per objek. Tambahkan pengujian regresi untuk akun A, akun B, objek tidak ada, serta role yang memang diberi izin.",
            Referensi:
                "https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html",
        };
        for (const [label, value] of Object.entries(fields))
            await page.getByLabel(label, { exact: true }).fill(value);
        await page
            .getByRole("button", { name: "Simpan Draft", exact: true })
            .click();
        await expect(page).toHaveURL(/\/reports\/\d+\/edit$/);
        await expect(page.locator(".save-status")).toContainText("Tersimpan");
        const reportUrl = page.url();
        const reportId = reportUrl.match(/\/reports\/(\d+)/)![1];
        await page.reload();
        await expect(page.getByLabel("Ringkasan", { exact: true })).toHaveValue(
            fields.Ringkasan,
        );
        if (info.project.name === "desktop") {
            const endpoint = `**/reports/${reportId}`;
            await page.route(endpoint, (route) =>
                route.request().method() === "PATCH"
                    ? route.abort("failed")
                    : route.continue(),
            );
            const localText = `${fields.Ringkasan} Tambahan lokal dipertahankan saat koneksi gagal.`;
            await page.getByLabel("Ringkasan", { exact: true }).fill(localText);
            await expect(page.locator(".feedback-state")).toContainText(
                "Perubahan belum dikonfirmasi",
            );
            await expect(
                page.getByLabel("Ringkasan", { exact: true }),
            ).toHaveValue(localText);
            await page.unroute(endpoint);
            await page
                .locator(".feedback-state")
                .getByRole("button", { name: "Coba lagi", exact: true })
                .click();
            await expect(page.locator(".save-status")).toContainText(
                "Tersimpan",
            );
            await page.reload();
            await expect(
                page.getByLabel("Ringkasan", { exact: true }),
            ).toHaveValue(localText);
            fields.Ringkasan = localText;
        }
        await page.locator('input[type="file"]').setInputFiles({
            name: "bukti-dummy.txt",
            mimeType: "text/plain",
            buffer: Buffer.from(
                "GET /api/orders/101 HTTP/1.1\nHTTP/1.1 200 OK\nowner: customer_a\n",
            ),
        });
        await expect(page.locator(".s4-evidence-list")).toContainText(
            "bukti-dummy.txt",
        );
        await page
            .getByRole("button", { name: "Preview aman", exact: true })
            .click();
        await expect(page.locator(".s4-report-preview")).toContainText(
            fields.Ringkasan,
        );
        await page
            .getByRole("button", { name: "Edit laporan", exact: true })
            .click();
        await clearToasts(page);
        const deleteButton = page.getByRole("button", {
            name: "Hapus Laporan",
            exact: true,
        });
        await deleteButton.click();
        await expect(
            page
                .getByRole("dialog", { name: "Hapus laporan ini?" })
                .getByRole("button", { name: "Batal", exact: true }),
        ).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(deleteButton).toBeFocused();
        for (const theme of ["light", "dark"] as const) {
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
            await audit(page);
            await page.evaluate(() =>
                (document.activeElement as HTMLElement | null)?.blur(),
            );
            await expect(page.locator(".loading-shimmer")).toHaveCount(0);
            await page.screenshot({
                path: `docs/screenshots/sprint4/reports-${info.project.name}-${theme}.png`,
                fullPage: true,
            });
        }
        const exported = await page.request.get(
            `/reports/${reportId}/export?format=md`,
        );
        expect(exported.status()).toBe(200);
        expect(exported.headers()["content-disposition"]).toContain(
            "attachment",
        );
        expect(await exported.text()).toContain("LATIHAN INTERNAL");
        const printable = await page.request.get(
            `/reports/${reportId}/export?format=html`,
        );
        expect(printable.status()).toBe(200);
        expect(printable.headers()["content-security-policy"]).toContain(
            "sandbox",
        );
        await page
            .getByRole("button", {
                name: "Kirim untuk Tinjauan Internal",
                exact: true,
            })
            .click();
        await expect(page.locator(".s4-status-badge").first()).toContainText(
            "Siap ditinjau",
        );
        await page
            .getByRole("button", {
                name: "Evaluasi Kelengkapan Otomatis",
                exact: true,
            })
            .click();
        await expect(page.locator(".s4-status-badge").first()).toContainText(
            "Diterima",
        );
        await page.goto("/progress");
        await expect(page.locator(".s4-level")).toContainText(
            "Level 2 · 100 XP",
        );
        await page.reload();
        await expect(page.locator(".s4-level")).toContainText("100 XP");
        await expect(page.locator(".s4-achievements")).toContainText(
            "Bug Hunter Latihan",
        );
        for (const theme of ["light", "dark"] as const) {
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
            await page.evaluate(() =>
                (document.activeElement as HTMLElement | null)?.blur(),
            );
            await expect(page.locator(".loading-shimmer")).toHaveCount(0);
            await page.screenshot({
                path: `docs/screenshots/sprint4/progress-evidence-${info.project.name}-${theme}.png`,
                fullPage: true,
            });
        }
        await page.goto("/reports");
        await expect(
            page.getByRole("link", {
                name: "Latihan IDOR pada rincian pesanan dummy",
                exact: true,
            }),
        ).toBeVisible();
        if (info.project.name === "desktop") {
            // 200% browser zoom reflows a 1440px window into 720 CSS pixels.
            await page.setViewportSize({ width: 720, height: 450 });
            await audit(page);
            await page.setViewportSize({ width: 1440, height: 900 });
        }
        expect(clientErrors).toEqual([]);
    } finally {
        await api(page, `/lab-sessions/${session.id}/stop`, {
            generation: session.generation,
        }).catch(() => {});
    }
});
