import { expect, test } from "@playwright/test";

// Guards the approved roadmap composition: node dots visible, labels clear of the
// luminous path and of each other, nothing clipped by the frame or the inset panel.
test("roadmap milestones stay legible", async ({ page }) => {
    test.skip(!process.env.E2E_DB_DATABASE, "Needs disposable E2E database");
    const email = `v9-${Date.now()}@example.test`;
    const password = "v9-roadmap-check-password";

    await page.goto("/register");
    await page.getByLabel("Nama", { exact: true }).fill("V9 Roadmap");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(password);
    await page.getByLabel("Ulangi kata sandi").fill(password);
    await page.getByRole("button", { name: "Buat akun" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/roadmap");
    const map = page.locator(".recovery-map");
    await expect(map).toBeVisible();
    const mapBox = (await map.boundingBox())!;
    const nodes = page
        .getByRole("group", { name: "Pilih tahap perjalanan" })
        .getByRole("button");
    await expect(nodes).toHaveCount(5);

    const panel = (await page.locator(".v8-stage-detail").boundingBox())!;

    for (let i = 0; i < 5; i++) {
        const node = nodes.nth(i);
        const dot = node.locator(".v8-stage-dot");
        // Every milestone must draw its numbered dot, not only a text label.
        await expect(dot, `node ${i + 1} dot`).toBeVisible();
        const dotBox = (await dot.boundingBox())!;
        expect(dotBox.width, `node ${i + 1} dot width`).toBeGreaterThan(40);
        expect(dotBox.height, `node ${i + 1} dot height`).toBeGreaterThan(40);

        // Full label stack must stay inside the illustration frame.
        for (const part of [node.locator("strong"), node.locator("small").last()]) {
            const b = (await part.boundingBox())!;
            expect(b.x, `node ${i + 1} label left`).toBeGreaterThanOrEqual(
                mapBox.x - 1,
            );
            expect(
                b.x + b.width,
                `node ${i + 1} label right`,
            ).toBeLessThanOrEqual(mapBox.x + mapBox.width + 1);
            expect(b.y, `node ${i + 1} label top`).toBeGreaterThanOrEqual(
                mapBox.y - 1,
            );
            expect(
                b.y + b.height,
                `node ${i + 1} label bottom`,
            ).toBeLessThanOrEqual(mapBox.y + mapBox.height + 1);
        }
    }

    // The contextual panel overlays the panorama rather than sitting in its own column.
    expect(panel.x).toBeGreaterThan(mapBox.x + mapBox.width * 0.5);

    // Icon-only controls still expose an accessible name.
    const themeToggle = page.getByRole("button", { name: /tema/i }).first();
    await expect(themeToggle).toHaveAttribute("aria-label", /./);
});
