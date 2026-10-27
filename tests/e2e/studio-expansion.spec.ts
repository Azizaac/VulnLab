import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, relative } from "node:path";

test("Studio links a quiz to an unpublished lesson and filters it by path", async ({ page }, info) => {
    const database = process.env.E2E_DB_DATABASE;
    if (!database) throw new Error("E2E_DB_DATABASE must name a disposable SQLite database under the temporary directory.");
    const rel = relative(realpathSync(tmpdir()), realpathSync(database));
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error("Refusing a database outside the temporary directory.");
    const php = process.env.PHP_BINARY || "php";
    const nonce = randomBytes(6).toString("hex");
    const email = `studio-parent-${info.project.name}-${nonce}@example.test`;
    const password = randomBytes(24).toString("hex");
    await page.goto("/register");
    await page.getByLabel("Nama", { exact: true }).fill("Studio Test Editor");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(password);
    await page.getByLabel("Ulangi kata sandi").fill(password);
    await page.getByRole("button", { name: "Buat akun" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    execFileSync(php, ["artisan", "studio:grant-role", email, "editor", "--confirm"], {
        env: { ...process.env, APP_ENV: "testing", DB_CONNECTION: "sqlite", DB_DATABASE: database, SESSION_DRIVER: "database", APP_KEY: "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" },
        stdio: "pipe",
    });
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/studio/content");
    const data = JSON.parse((await page.locator("#app").getAttribute("data-page"))!);
    const module = data.props.choices.modules[0] as { id: number; learning_path_id: number };
    expect(module).toBeTruthy();
    const lessonTitle = `Lesson parent ${nonce}`;
    const quizTitle = `Quiz parent ${nonce}`;
    await page.getByRole("button", { name: "+ Konten Baru" }).click();
    await page.getByLabel("Judul", { exact: true }).fill(lessonTitle);
    await page.getByLabel("Slug URL stabil").fill(`lesson-parent-${nonce}`);
    await page.getByRole("button", { name: "Buat Draft", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Editor Materi", exact: true })).toBeVisible();
    await page.goto("/studio/quizzes");
    await page.getByRole("button", { name: "+ Konten Baru" }).click();
    await page.getByLabel("Lesson untuk kuis").selectOption({ label: `${lessonTitle} (draft)` });
    await page.getByLabel("Judul", { exact: true }).fill(quizTitle);
    await page.getByLabel("Slug URL stabil").fill(`quiz-parent-${nonce}`);
    await page.getByRole("button", { name: "Buat Draft", exact: true }).click();
    await expect(page.getByLabel("Lesson terkait")).toBeDisabled();
    await expect(page.getByLabel("Lesson terkait").locator("option:checked")).toHaveText(`${lessonTitle} (draft)`);
    await expect(page.getByText("Lesson terkait harus terbit sebelum kuis dapat diterbitkan.")).toBeVisible();
    await page.goto("/studio/quizzes");
    await page.getByText("Filter jalur & reviewer").click();
    await page.getByLabel("Jalur belajar").selectOption(String(module.learning_path_id));
    await expect(page.getByRole("link", { name: new RegExp(quizTitle) })).toBeVisible();
});
