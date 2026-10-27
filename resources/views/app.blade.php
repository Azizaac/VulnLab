<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#101827">
        <script nonce="{{ Vite::cspNonce() }}">
            document.documentElement.dataset.density = @json(auth()->user()?->density ?? 'comfortable');
            document.documentElement.dataset.motion = @json(auth()->user()?->reduced_motion ? 'reduced' : 'system');
            let preference = @json(auth()->user()?->theme ?? 'system');
            if (@json(!auth()->check())) {
                try {
                    const savedTheme = localStorage.getItem('vulnlab-theme');
                    if (savedTheme === 'light' || savedTheme === 'dark') preference = savedTheme;
                } catch { /* Storage may be disabled. */ }
            }
            document.documentElement.dataset.theme = preference === 'system'
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : preference;
        </script>
        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>
