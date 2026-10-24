import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
const runnerToken = fs.existsSync('.env') ? fs.readFileSync('.env','utf8').match(/^LAB_RUNNER_TOKEN=(.*)$/m)?.[1].trim() || '' : '';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    use: { baseURL: 'http://127.0.0.1:8089', trace: 'retain-on-failure' },
    projects: [
        { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
        { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
        { name: 'mobile360', use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } },
        { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    ],
    webServer: {
        command: `"${process.env.PHP_BINARY || 'php'}" artisan serve --host=127.0.0.1 --port=8089 --no-reload`,
        url: 'http://127.0.0.1:8089/login',
        reuseExistingServer: false,
        timeout: 30000,
        env: {
            APP_ENV: 'local', APP_DEBUG: 'false',
            LABS_ENABLED: 'true', LAB_RUNNER_URL: 'http://127.0.0.1:8090', LAB_RUNNER_TOKEN: runnerToken,
            APP_KEY: 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            DB_CONNECTION: 'sqlite', DB_DATABASE: `${process.cwd()}/database/e2e.sqlite`,
            SESSION_DRIVER: 'file', CACHE_STORE: 'database', CACHE_PREFIX: `vulnlab_e2e_${Date.now()}`, LOG_CHANNEL: 'single',
        },
    },
});

