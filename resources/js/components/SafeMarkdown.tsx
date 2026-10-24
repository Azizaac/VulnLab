import { useMemo } from "react";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import http from "highlight.js/lib/languages/http";
import php from "highlight.js/lib/languages/php";
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import javascript from "highlight.js/lib/languages/javascript";
import xml from "highlight.js/lib/languages/xml";
for (const [name, grammar] of Object.entries({
    http,
    php,
    json,
    sql,
    javascript,
    xml,
}))
    hljs.registerLanguage(name, grammar);
export function sanitizedMarkup(html: string) {
    const clean = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: [
            "img",
            "style",
            "input",
            "form",
            "button",
            "iframe",
            "video",
            "audio",
        ],
        FORBID_ATTR: ["style", "id", "name"],
    });
    const doc = new DOMParser().parseFromString(clean, "text/html");
    doc.querySelectorAll("pre").forEach((pre) => {
        pre.tabIndex = 0;
        pre.setAttribute("role", "region");
        pre.setAttribute("aria-label", "Contoh kode, dapat digulir horizontal");
    });
    doc.querySelectorAll("pre code").forEach((code) => {
        const language = code.className.match(/language-(\w+)/)?.[1];
        if (language && hljs.getLanguage(language))
            code.innerHTML = hljs.highlight(code.textContent || "", {
                language,
            }).value;
    });
    doc.querySelectorAll("a").forEach((a) => {
        a.rel = "noopener noreferrer";
    });
    return doc.body.innerHTML;
}
export default function SafeMarkdown({ html }: { html: string }) {
    const markup = useMemo(() => sanitizedMarkup(html), [html]);
    return (
        <div
            className="lesson-prose"
            dangerouslySetInnerHTML={{ __html: markup }}
        />
    );
}
