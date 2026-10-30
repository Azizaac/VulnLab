// Disposable SQLite only. Never loads a learner database or resets Docker volumes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const mode = process.argv[2] || 'after';
if (!['before', 'after', 'regression'].includes(mode)) throw new Error('Use before, after or regression');
const php = process.env.PHP_BINARY || (process.platform === 'win32' ? path.resolve('.tools/php/php.exe') : 'php');
const database = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vulnlab-recovery-')), 'test.sqlite');
fs.writeFileSync(database, '');
const env = {
    ...process.env, PHP_BINARY: php, E2E_DB_DATABASE: database,
    DB_CONNECTION: 'sqlite', DB_DATABASE: database, APP_ENV: 'testing',
    DB_URL: '', DB_SOCKET: '', APP_CONFIG_CACHE: path.join(path.dirname(database), 'unused-config-cache.php'),
    APP_KEY: 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    CACHE_STORE: 'array', SESSION_DRIVER: 'database', MAIL_MAILER: 'array',
    RECOVERY_STAGE: mode, QA_SCREENSHOT_ROOT: '.tools/recovery-regression-screenshots',
    QA_V6_SCREENSHOT_ROOT: '.tools/recovery-regression-v6',
};
execFileSync(php, ['artisan', 'migrate', '--seed', '--force'], { env, stdio: 'pipe' });
const args = mode === 'regression'
    ? ['test', 'journey.spec.ts', 'learning.spec.ts', 'labs.spec.ts', 'sprint4.spec.ts', 'v5.spec.ts', 'v5-quiz.spec.ts', 'v6.spec.ts', '--project=desktop']
    : ['test', '--config=playwright.recovery.config.ts'];
execFileSync(process.execPath, ['node_modules/@playwright/test/cli.js', ...args, ...process.argv.slice(3)], { env, stdio: 'inherit' });
// Keep the disposable DB for failure diagnosis; never recursively delete an inferred path.
