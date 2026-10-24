import SafeMarkdown from "./SafeMarkdown";
export default function CodePanel({
    text,
    language = "json",
}: {
    text: string;
    language?: "json" | "http" | "php" | "javascript" | "xml";
}) {
    const safe = text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    return (
        <SafeMarkdown
            html={`<pre><code class="language-${language}">${safe}</code></pre>`}
        />
    );
}
