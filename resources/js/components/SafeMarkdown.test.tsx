import { describe, it, expect } from "vitest";
import { sanitizedMarkup } from "./SafeMarkdown";
describe("Markdown defense in depth", () => {
    it("strips active HTML, attributes and tracking images", () => {
        const html = sanitizedMarkup(
            '<h2>Safe</h2><script>alert(1)</script><img src="https://example.org/pixel" onerror="alert(1)"><a href="javascript:alert(1)">bad</a><svg onload="alert(1)"></svg><p id="location" style="color:red">text</p>',
        );
        expect(html).toContain("<h2>Safe</h2>");
        expect(html).not.toMatch(
            /<script|<img|<svg|onerror|javascript:|style=|id=/,
        );
    });
    it("highlights escaped code without making code executable", () => {
        const html = sanitizedMarkup(
            '<pre><code class="language-javascript">const x = "&lt;img src=x onerror=alert(1)&gt;";</code></pre>',
        );
        expect(html).toContain("hljs-keyword");
        expect(html).not.toContain("<img");
        expect(html).toContain("&lt;img");
    });
});
