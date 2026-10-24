import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { Moon, Sun } from "lucide-react";
export default function ThemeToggle({
    preference,
    accountId,
}: {
    preference?: "light" | "dark" | "system";
    accountId?: number;
}) {
    const [dark, setDark] = useState(
        () => document.documentElement.dataset.theme === "dark",
    );
    const [error, setError] = useState(false);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (!preference) return;
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const sync = () =>
            setDark(
                preference === "dark" ||
                    (preference === "system" && media.matches),
            );
        sync();
        media.addEventListener("change", sync);
        return () => media.removeEventListener("change", sync);
    }, [preference]);
    useEffect(() => {
        document.documentElement.dataset.theme = dark ? "dark" : "light";
        try {
            localStorage.setItem(
                accountId ? `vulnlab-theme-${accountId}` : "vulnlab-theme",
                dark ? "dark" : "light",
            );
        } catch {
            /* Storage can be disabled; server preference remains authoritative. */
        }
    }, [dark, accountId]);
    function toggle() {
        const previous = dark;
        setDark(!dark);
        setError(false);
        if (accountId) {
            setSaving(true);
            router.patch(
                "/settings/theme",
                { theme: dark ? "light" : "dark" },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onError: () => {
                        setDark(previous);
                        setError(true);
                    },
                    onFinish: () => setSaving(false),
                },
            );
        }
    }
    return (
        <>
            <button
                type="button"
                disabled={saving}
                className="icon-button theme-toggle"
                onClick={toggle}
                aria-label={
                    dark ? "Aktifkan tema terang" : "Aktifkan tema gelap"
                }
            >
                {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {error && (
                <span className="theme-error" role="alert">
                    Tema gagal disimpan. Coba lagi.
                </span>
            )}
        </>
    );
}
