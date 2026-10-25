import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    use: { baseURL: 'http://127.0.0.1:8089', trace: 'retain-on-failure' },
    projects: [
        { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
        { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
        { name: 'mobile360', use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } },
        { name: 'mobile320', use: { viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true } },
        { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    ],
    webServer: {
        command: `"${process.env.PHP_BINARY || 'php'}" artisan serve --host=127.0.0.1 --port=8089 --no-reload`,
        url: 'http://127.0.0.1:8089/login',
        reuseExistingServer: false,
        timeout: 30000,
        env: {
            APP_ENV: 'local', APP_DEBUG: 'false',
            // Laravel reads the private token from ignored .env (or inherited environment).
            // Never copy it into reporter-serialized Playwright configuration.
            LABS_ENABLED: 'true', LAB_RUNNER_URL: 'http://127.0.0.1:8090',
            APP_KEY: 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            DB_CONNECTION: 'sqlite', DB_DATABASE: `${process.cwd()}/database/e2e.sqlite`,
            SESSION_DRIVER: 'database', CACHE_STORE: 'database', CACHE_PREFIX: `vulnlab_e2e_${Date.now()}`, LOG_CHANNEL: 'single',
        },
    },
});

