import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
    plugins: [laravel({ input: ['resources/js/app.tsx'], refresh: true }), react(), tailwind()],
    server: { host: '127.0.0.1' },
});
