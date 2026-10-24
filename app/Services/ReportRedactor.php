<?php

namespace App\Services;

class ReportRedactor
{
    public function redact(string $text): string
    {
        $text = preg_replace('/\b(Authorization|Proxy-Authorization|Cookie|Set-Cookie|X-Control-Token|X-Capability|X-API-Key)\s*:[^\r\n]*/i', '$1: [DISENSOR]', $text);
        $text = preg_replace('/(["\']?(?:password|passwd|secret|token|access_token|refresh_token|api_key|session|session_id|session_token|csrf_token|app_key|flag)["\']?\s*[:=]\s*)(?:"[^"\r\n]*"|\'[^\'\r\n]*\'|[^\s,;&}\r\n]+)/i', '$1[DISENSOR]', $text);
        $text = preg_replace('/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/i', 'Bearer [DISENSOR]', $text);
        $text = preg_replace('/VULNLAB\{[^}\r\n]*\}/i', '[FLAG DISENSOR]', $text);
        $text = preg_replace('/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/', '[JWT DISENSOR]', $text);

        return $text;
    }

    public function markdown(string $text): string
    {
        $text = $this->redact($text);
        $text = preg_replace('/!\[[^\]]*\]\([^)]*\)/s', '[Gambar eksternal dihilangkan]', $text);
        $text = preg_replace('/\]\(\s*(?:javascript|data|vbscript):[^)]*\)/i', '](#)', $text);

        // Exported Markdown is inert even in viewers that allow raw HTML.
        return str_replace(['<', '>'], ['&lt;', '&gt;'], $text);
    }
}
