import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";

test("V5 Quiz Builder: choice radio, localized validation, autosave and key-free learner preview", async ({
    page,
}, info) => {
    test.setTimeout(120000);
    const nonce = randomBytes(5).toString("hex");
    const password = randomBytes(18).toString("hex");
    const email = `quiz-${nonce}@example.test`;
    const slug = `e2e-quiz-${nonce}`;
    const php = process.env.PHP_BINARY || "php";
    const env = {
        ...process.env,
        APP_ENV: "testing",
        DB_CONNECTION: "sqlite",
        DB_DATABASE:
            process.env.E2E_DB_DATABASE ||
            `${process.cwd()}/database/e2e.sqlite`,
        SESSION_DRIVER: "database",
        APP_KEY: "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        VULNLAB_TEST_EMAIL: email,
        VULNLAB_TEST_PASSWORD: password,
        VULNLAB_TEST_LESSON_SLUG: slug,
    };
    execFileSync(php, ["tests/browser-fixture.php"], { env, stdio: "pipe" });
    execFileSync(
        php,
        ["artisan", "studio:grant-role", email, "editor", "--confirm"],
        { env, stdio: "pipe" },
    );
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(
        page.getByRole("heading", { name: "Halo, Hacker Muda!" }),
    ).toBeVisible();
    await page.goto("/studio/quizzes");
    await page.getByRole("button", { name: "+ Konten Baru" }).click();
    await page
        .getByLabel("Judul", { exact: true })
        .fill("Kuis Ownership Original");
    await page.getByLabel("Slug URL stabil").fill(`quiz-${nonce}`);
    await page
        .getByLabel("Lesson untuk kuis", { exact: true })
        .selectOption({ label: `Kuis fixture: ${slug}` });
    await page.getByRole("button", { name: "Buat Draft", exact: true }).click();
    await expect(
        page.getByRole("heading", { name: "Editor Kuis", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "+ Tambah soal" }).click();
    await page
        .getByLabel("Pertanyaan", { exact: true })
        .fill("Di mana pemeriksaan pemilik objek dilakukan?");
    await page
        .getByLabel("Pilihan 1", { exact: true })
        .fill("Hanya pada tombol browser");
    await page
        .getByLabel("Pilihan 2", { exact: true })
        .fill("Di server untuk setiap request");
    await page.getByLabel("Jawaban benar pilihan 2", { exact: true }).check();
    await expect(
        page.getByLabel("Jawaban benar pilihan 1", { exact: true }),
    ).not.toBeChecked();
    await page
        .getByLabel("Penjelasan jawaban", { exact: true })
        .fill(
            "Penjelasan privat setelah penilaian: server memverifikasi pemilik.",
        );
    await page
        .getByLabel("Sumber soal (HTTPS)", { exact: true })
        .fill("http://owasp.org/");
    await expect(
        page.getByLabel("Sumber soal (HTTPS)", { exact: true }),
    ).toHaveAttribute("aria-invalid", "true", { timeout: 15000 });
    await expect(
        page.locator('[data-field="questions.0.source_url"] .field-error'),
    ).toContainText("HTTPS");
    await page
        .getByLabel("Sumber soal (HTTPS)", { exact: true })
        .fill("https://owasp.org/");
    await page.getByRole("button", { name: "+ Tambah Sumber" }).click();
    await page.getByLabel("Judul sumber 1", { exact: true }).fill("OWASP");
    await page
        .getByLabel("URL HTTPS 1", { exact: true })
        .fill("https://owasp.org/");
    await page.getByLabel("Penerbit 1", { exact: true }).fill("OWASP");
    await page
        .getByLabel("Lisensi / atribusi 1", { exact: true })
        .fill("Attribution checked in disposable test fixture");
    await expect(
        page.getByRole("button", { name: "Kirim Review", exact: true }),
    ).toBeEnabled({ timeout: 15000 });
    await page.getByRole("button", { name: "Pratinjau pelajar" }).click();
    const preview = page.getByRole("dialog");
    await expect(
        preview.getByText("Di server untuk setiap request", { exact: true }),
    ).toBeVisible();
    await expect(
        preview.getByText(/Penjelasan privat setelah penilaian/),
    ).toHaveCount(0);
    await expect(preview.locator('[name^="preview_"]:checked')).toHaveCount(0);
    await page.getByRole("button", { name: "Tutup pratinjau" }).click();
    await page.reload();
    await expect(
        page.getByLabel("Jawaban benar pilihan 2", { exact: true }),
    ).toBeChecked();
    await expect(page.getByLabel("Pertanyaan", { exact: true })).toHaveValue(
        "Di mana pemeriksaan pemilik objek dilakukan?",
    );
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
    fs.mkdirSync(`${process.env.QA_SCREENSHOT_ROOT || "docs/screenshots"}/v5`, {
        recursive: true,
    });
    await page.screenshot({
        path: `${process.env.QA_SCREENSHOT_ROOT || "docs/screenshots"}/v5/quiz-builder-${info.project.name}-light.png`,
        fullPage: true,
    });
    const themeResponse = await page.evaluate(async () => {
        const cookie = document.cookie
            .split("; ")
            .find((s) => s.startsWith("XSRF-TOKEN="));
        const response = await fetch("/settings/theme", {
            method: "PATCH",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": decodeURIComponent(cookie?.slice(11) ?? ""),
            },
            body: JSON.stringify({ theme: "dark" }),
        });
        return response.status;
    });
    expect(themeResponse).toBe(200);
    await page.goto("/studio");
    expect(
        (
            await new AxeBuilder({ page })
                .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
                .analyze()
        ).violations,
    ).toEqual([]);
    await page.screenshot({
        path: `${process.env.QA_SCREENSHOT_ROOT || "docs/screenshots"}/v5/studio-${info.project.name}-dark.png`,
        fullPage: true,
    });
    expect(errors).toEqual([]);
});
