<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        Vite::useCspNonce();
        $scripts = "'self' 'nonce-".Vite::cspNonce()."'";
        $connections = "'self'";
        // Permit only the explicitly configured loopback Vite server in local development.
        if (app()->environment('local') && Vite::isRunningHot()) {
            $origin = trim(file_get_contents(Vite::hotFile()));
            $parts = parse_url($origin);
            if (in_array($parts['host'] ?? '', ['localhost', '127.0.0.1', '[::1]'], true)
                && in_array($parts['scheme'] ?? '', ['http', 'https'], true)
                && ! isset($parts['user']) && ! isset($parts['pass']) && empty($parts['path']) && empty($parts['query']) && empty($parts['fragment'])) {
                $scripts .= ' '.$origin;
                $connections .= ' '.$origin.' '.preg_replace('/^http/', 'ws', $origin);
            }
        }
        $response = $next($request);
        // Private HTML exports already carry a stricter sandbox policy.
        if (! $response->headers->has('Content-Security-Policy')) {
            $response->headers->set('Content-Security-Policy', "default-src 'self'; script-src $scripts; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src $connections; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
        }
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        if ($request->user()) {
            $response->headers->set('Cache-Control', 'no-store, private');
        }

        return $response;
    }
}
