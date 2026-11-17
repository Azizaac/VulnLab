import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";

test("V9 drafts render in Studio without changing learner visibility", async ({ page }, info) => {
    test.skip(!process.env.E2E_DB_DATABASE, "Disposable E2E database required");
    const password = randomBytes(24).toString("hex");
    const email = `v9-content-${randomBytes(6).toString("hex")}@example.test`;
    const output = execFileSync(
        process.env.PHP_BINARY || "php",
        ["tests/v9-content-browser-fixture.php"],
        {
            encoding: "utf8",
            env: {
                ...process.env,
                APP_ENV: "testing",
                DB_CONNECTION: "sqlite",
                DB_DATABASE: process.env.E2E_DB_DATABASE,
                SESSION_DRIVER: "database",
                APP_KEY: "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
                VULNLAB_TEST_EMAIL: email,
                VULNLAB_TEST_PASSWORD: password,
            },
        },
    );
    const line = output.split(/\r?\n/).find((row) => row.startsWith("V9_CONTENT:"));
    if (!line) throw new Error("Fixture did not return content IDs");
    const ids = JSON.parse(line.slice("V9_CONTENT:".length));
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto(`/studio/content/${ids.baseline_entry}/edit`);
    await expect(page.getByLabel("Konten Markdown", { exact: true })).toHaveValue(/Pendalaman V9-D/);
    await page.getByRole("button", { name: "Pratinjau pelajar", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("Tiga cek diri, bukan kuis bernilai");
    await page.keyboard.press("Escape");
    await page.goto(`/studio/content/${ids.new_entry}/edit`);
    await expect(page.getByLabel("Ringkasan", { exact: true })).toHaveValue(/alamat email bukan bukti/);
    await expect(page.getByLabel("Contoh lokal (Markdown)", { exact: true })).toHaveValue(/Password::sendResetLink/);
    const preview = await page.request.get(`/studio/revisions/${ids.quiz_revision}/preview`);
    expect(preview.status()).toBe(200);
    const previewData = await preview.json();
    expect(previewData.questions[0].choices).toContainEqual({ text: "Mengaitkan callback dengan flow login yang dimulai sesi yang sama" });
    expect(JSON.stringify(previewData)).not.toMatch(/is_correct|correct_index|explanation/);
    fs.mkdirSync("docs/v9/implementation/screenshots", { recursive: true });
    await page.screenshot({ path: `docs/v9/implementation/screenshots/content-studio-${info.project.name}.png`, fullPage: true });
    const draft = await page.goto("/learning/reset-token-lifecycle");
    expect(draft?.status()).toBe(404);
    await page.goto("/learning/client-server");
    await expect(page.locator("main")).not.toContainText("Pendalaman V9-D");
    await expect(page.getByRole("tabpanel", { name: "Materi", exact: true }).getByRole("heading", { name: "Cara Browser dan Server Berkomunikasi", exact: true })).toBeVisible();
});
