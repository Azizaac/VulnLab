<?php

namespace App\Http\Middleware;

use App\Services\StudioAccess;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class RecordStudioDenial
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $response = $next($request);
            if ($response->getStatusCode() === 403 && ! $request->attributes->get('studio_denial_logged')) {
                $this->record($request);
            }

            return $response;
        } catch (\Throwable $e) {
            if ($e instanceof AuthorizationException || $e instanceof HttpExceptionInterface && $e->getStatusCode() === 403) {
                if (! $request->attributes->get('studio_denial_logged')) {
                    $this->record($request);
                }
            }
            throw $e;
        }
    }

    private function record(Request $request): void
    {
        StudioAccess::audit($request->user(), 'authorization.denied', 'studio', null, ['method' => $request->method(), 'route' => $request->route()?->uri()]);
    }
}
