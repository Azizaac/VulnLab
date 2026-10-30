// Runs one Playwright spec against a disposable SQLite database.
// Usage: node scripts/v9-run-e2e.mjs <spec> [--config=...] [extra args...]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [spec, ...rest] = process.argv.slice(2);
if (!spec) throw new Error("Usage: node scripts/v9-run-e2e.mjs <spec> [...]");
const php =
    process.env.PHP_BINARY ||
    (process.platform === "win32" ? path.resolve(".tools/php/php.exe") : "php");
// This PHP build cannot write to %LOCALAPPDATA%\Temp, so SQLite spills and
// Laravel's temp dir both need a writable location inside the ignored .tools dir.
const dir = ".tools/v9-e2e-db";
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(path.join(dir, "tmp"), { recursive: true });
const tmp = path.resolve(path.join(dir, "tmp"));
const database = path.resolve(path.join(dir, "test.sqlite"));
fs.writeFileSync(database, "");
const env = {
    ...process.env,
    PHP_BINARY: php,
    E2E_DB_DATABASE: database,
    DB_CONNECTION: "sqlite",
    DB_DATABASE: database,
    APP_ENV: "testing",
    DB_URL: "",
    DB_SOCKET: "",
    APP_CONFIG_CACHE: path.join(dir, "unused-config-cache.php"),
    APP_KEY: "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    TMP: tmp,
    TEMP: tmp,
    TMPDIR: tmp,
    CACHE_STORE: "array",
    SESSION_DRIVER: "database",
    MAIL_MAILER: "array",
    RECOVERY_STAGE: "after",
    QA_SCREENSHOT_ROOT: ".tools/v9-screenshots",
    QA_V6_SCREENSHOT_ROOT: ".tools/v9-screenshots-v6",
};
execFileSync(php, ["artisan", "migrate", "--seed", "--force"], {
    env,
    stdio: "pipe",
});
// Defaults to the base config; recovery-visual screenshots pass --config=.
const config = rest.find((a) => a.startsWith("--config=")) ?? "playwright.config.ts";
execFileSync(
    process.execPath,
    [
        "node_modules/@playwright/test/cli.js",
        "test",
        spec,
        `--config=${config}`,
        ...rest.filter((a) => a !== `--config=${config}`),
    ],
    { env, stdio: "inherit" },
);
