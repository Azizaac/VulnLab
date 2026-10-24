import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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
async function saved(page: Page) {
    await expect(
        page
            .getByRole("status")
            .filter({ hasText: "Semua perubahan tersimpan" }),
    ).toBeVisible();
}
test("learning, server quiz, autosave, private markdown workspace and visual matrix", async ({
    page,
}, info) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/register");
    await page.getByLabel("Nama", { exact: true }).fill("Pelajar VulnLab");
    await page
        .getByLabel("Email", { exact: true })
        .fill(`s2-${info.project.name}-${Date.now()}@example.com`);
    await page
        .getByLabel("Kata sandi", { exact: true })
        .fill("secure-password-123");
    await page.getByLabel("Ulangi kata sandi").fill("secure-password-123");
    await page.getByLabel("Tanggal mulai rencana").fill("2026-10-24");
    await page.getByRole("button", { name: "Buat akun" }).click();
    await expect(
        page.getByRole("heading", { name: "Halo, Hacker Muda!" }),
    ).toBeVisible();
    await page.goto("/learning");
    await expect(page.locator(".course-card")).toHaveCount(10);
    await page.getByLabel("Cari modul").fill("JWT");
    await expect(page.locator(".course-card")).toHaveCount(1);
    await page.getByLabel("Cari modul").clear();
    await audit(page);
    await page.goto("/learning/client-server");
    await expect(
        page.getByRole("button", { name: "Tandai sudah dibaca" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Tandai sudah dibaca" }).click();
    await expect(
        page.getByRole("button", { name: "Bacaan tersimpan" }),
    ).toBeDisabled();
    await page.getByRole("tab", { name: "Kuis", exact: true }).click();
    await page.getByLabel("Bukti bahwa login aman", { exact: true }).check();
    await page
        .getByLabel("Untuk menjamin tidak ada bug", { exact: true })
        .check();
    await page.getByRole("button", { name: "Periksa jawaban" }).click();
    await expect(page.locator(".quiz-result")).toContainText("Coba lagi");
    await page.getByRole("button", { name: "Ulangi kuis" }).click();
    await page
        .getByLabel("Pesan dari client ke server", { exact: true })
        .check();
    await page
        .getByLabel(
            "Untuk melihat komunikasi yang nyata antara browser dan server",
            { exact: true },
        )
        .check();
    await page.getByRole("button", { name: "Periksa jawaban" }).click();
    await expect(page.locator(".quiz-result")).toContainText("Lulus · 100/100");
    await page.reload();
    await page.getByRole("tab", { name: "Kuis", exact: true }).click();
    await expect(page.locator(".attempt-list li")).toHaveCount(2);
    await expect(page.locator(".lesson-evidence")).toContainText(
        "✓ Kuis lulus",
    );
    await page.goto("/dashboard");
    await expect(
        page
            .locator(".dashboard-learning")
            .filter({ hasText: "lesson selesai" }),
    ).toContainText("1 / 25 lesson selesai");
    await expect(
        page.getByRole("link", { name: "Lanjutkan lesson" }),
    ).toHaveAttribute("href", "/learning/http-methods");
    await page.goto("/learning/sql-injection");
    await page.getByRole("tab", { name: "Contoh Kode" }).click();
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
        await page.evaluate(() => document.fonts.ready);
        await audit(page);
        await page.screenshot({
            path: `docs/screenshots/sprint2/learning-${info.project.name}-${theme}.png`,
            fullPage: true,
        });
        await page.screenshot({
            path: `docs/screenshots/sprint2/learning-${info.project.name}-${theme}-viewport.png`,
        });
    }
    await page.goto("/notes?lesson=1");
    await page
        .getByRole("button", { name: "Catatan baru", exact: true })
        .click();
    await expect(page.getByLabel("Judul catatan")).toBeVisible();
    await page.getByLabel("Judul catatan").fill("SQL Injection Notes");
    await page.getByLabel("Tag (pisahkan koma)").fill("web-security, sql");
    await page.getByLabel("Kategori", { exact: true }).fill("Web Security");
    await page
        .getByLabel("Lesson", { exact: true })
        .selectOption({ label: "SQL Injection dan Query Berparameter" });
    await page
        .getByLabel("Isi catatan Markdown")
        .fill(
            "# SQL Injection Notes\n\n## Yang saya pahami\nNilai input harus tetap menjadi data, terpisah dari struktur query.\n\n## Checklist pencegahan\n- Gunakan parameter binding\n- Batasi kolom pengurutan dengan allowlist\n- Periksa policy untuk setiap objek\n\n```sql\nSELECT name FROM products WHERE id = ?;\n```\n\n## Pertanyaan berikutnya\nBagaimana menguji regresi menggunakan dua akun dummy?\n\n[PortSwigger Academy](https://portswigger.net/web-security/sql-injection)",
        );
    await page
        .getByRole("button", { name: "Pin catatan", exact: true })
        .click();
    await saved(page);
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(page.locator(".note-preview")).toContainText(
        "Yang saya pahami",
    );
    await page.getByRole("button", { name: "Edit", exact: true }).click();
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
        await expect(page.getByLabel("Isi catatan Markdown")).toBeVisible();
        await page.screenshot({
            path: `docs/screenshots/sprint2/notes-${info.project.name}-${theme}.png`,
            fullPage: true,
        });
        await page.screenshot({
            path: `docs/screenshots/sprint2/notes-${info.project.name}-${theme}-viewport.png`,
        });
    }
    if (info.project.name === "desktop") {
        await page
            .getByLabel("Isi catatan Markdown")
            .fill("Theme change while draft is dirty");
        await page.locator(".theme-toggle").click();
        await expect(page.locator(".theme-toggle")).toBeEnabled();
        await saved(page);
        await expect(page.getByLabel("Isi catatan Markdown")).toHaveValue(
            "Theme change while draft is dirty",
        );
        let release!: () => void;
        let started!: () => void;
        const held = new Promise<void>((resolve) => {
            release = resolve;
        });
        const began = new Promise<void>((resolve) => {
            started = resolve;
        });
        let writes = 0;
        await page.route("**/notes/*", async (route) => {
            if (route.request().method() === "PATCH" && ++writes === 1) {
                started();
                await held;
            }
            await route.continue();
        });
        await page
            .getByLabel("Isi catatan Markdown")
            .fill("First pending write");
        await began;
        await page
            .getByLabel("Isi catatan Markdown")
            .fill("Second edit while saving");
        release();
        await saved(page);
        expect(writes).toBe(2);
        await expect(page.getByLabel("Isi catatan Markdown")).toHaveValue(
            "Second edit while saving",
        );
        await page.unroute("**/notes/*");
        await page.context().setOffline(true);
        await page
            .getByLabel("Isi catatan Markdown")
            .fill("Offline draft remains available");
        await expect(page.getByRole("status")).toContainText("Belum tersimpan");
        await expect(page.getByLabel("Isi catatan Markdown")).toHaveValue(
            "Offline draft remains available",
        );
        await page.context().setOffline(false);
        await page.getByRole("button", { name: "Coba simpan lagi" }).click();
        await saved(page);
    }
    await page
        .getByLabel("Isi catatan Markdown")
        .fill(
            '# Aman\n\n<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>\n\n[unsafe](javascript:alert(1))',
        );
    await saved(page);
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(page.locator(".note-preview h1")).toHaveText("Aman");
    await expect(
        page.locator(".note-preview img,.note-preview script"),
    ).toHaveCount(0);
    expect(await page.evaluate(() => Object.hasOwn(window, "__xss"))).toBe(
        false,
    );
    await page.reload();
    await page
        .locator(".note-list>button")
        .filter({ hasText: "SQL Injection Notes" })
        .click();
    await expect(page.getByLabel("Isi catatan Markdown")).toHaveValue(
        /window.__xss/,
    );
    await expect(
        page.getByRole("button", { name: "Lepas pin" }),
    ).toHaveAttribute("aria-pressed", "true");
    // Simulate a second tab committing a newer revision; stale autosave must preserve local text.
    const conflictResponse = await page.evaluate(async () => {
        const token = decodeURIComponent(
            document.cookie
                .split("; ")
                .find((v) => v.startsWith("XSRF-TOKEN="))!
                .slice(11),
        );
        const app = JSON.parse(
            document.getElementById("app")!.getAttribute("data-page")!,
        );
        const n = app.props.notes.data[0];
        const r = await fetch(`/notes/${n.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-XSRF-TOKEN": token,
            },
            body: JSON.stringify({ ...n, title: "Versi tab lain" }),
        });
        return r.status;
    });
    expect(conflictResponse).toBe(200);
    await page
        .getByLabel("Isi catatan Markdown")
        .fill("Perubahan lokal tetap aman");
    await expect(page.getByRole("status")).toContainText("Konflik versi");
    await expect(page.getByLabel("Isi catatan Markdown")).toHaveValue(
        "Perubahan lokal tetap aman",
    );
    await page
        .getByRole("button", { name: "Simpan lokal sebagai catatan baru" })
        .click();
    await saved(page);
    await expect(page.getByLabel("Judul catatan")).toHaveValue(
        "Salinan SQL Injection Notes",
    );
    await page
        .getByRole("button", { name: "Hapus catatan", exact: true })
        .click();
    await page.getByRole("button", { name: "Ya, hapus catatan" }).click();
    await expect(page.getByRole("status")).toContainText("Catatan dihapus");
    await page.getByLabel("Cari catatan").fill("does-not-exist");
    await page.getByRole("button", { name: "Cari", exact: true }).click();
    await expect(
        page.getByRole("heading", { name: "Tidak ada catatan cocok" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
});
