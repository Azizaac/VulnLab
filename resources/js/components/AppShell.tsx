import { FormEvent, ReactNode, useState, useEffect, useRef } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
    MoreHorizontal,
    BookOpen,
    FlaskConical,
    House,
    LogOut,
    Map,
    Search,
    X,
    ChartNoAxesCombined,
    FileText,
    UserRound,
    Settings,
    ShieldCheck,
    PanelsTopLeft,
    Bell,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import BrandMark from "./BrandMark";
import type { SharedProps } from "../types";
import { useFeedback } from "../feedback";
export default function AppShell({
    children,
    title,
}: {
    children: ReactNode;
    title: string;
}) {
    const { auth, flash } = usePage<SharedProps>().props;
    const { notify } = useFeedback();
    const { url } = usePage();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [themeError, setThemeError] = useState(false);
    const trigger = useRef<HTMLButtonElement | null>(null);
    useEffect(() => {
        if (flash.success)
            notify({
                type: "success",
                title: flash.success,
                key: `flash:${flash.success}`,
            });
    }, [flash.success, notify]);
    useEffect(() => {
        const start = router.on("start", () => setLoading(true));
        const finish = router.on("finish", () => setLoading(false));
        return () => {
            start();
            finish();
        };
    }, []);
    function submit(event: FormEvent) {
        event.preventDefault();
        setSearchOpen(false);
        setOpen(false);
        router.get("/roadmap", { search });
    }
    return (
        <div className="journey-shell">
            <a className="skip-link" href="#main">
                Lewati navigasi
            </a>
            <header className="journey-header">
                <div className="header-inner">
                    <Link
                        href="/dashboard"
                        className="journey-brand"
                        aria-label="VulnLab Beranda"
                    >
                        <BrandMark />
                        <span>
                            Vuln<span>Lab</span>
                        </span>
                    </Link>
                    {url.startsWith("/studio") && (
                        <span className="v5-pill v5-shell-badge">Studio</span>
                    )}
                    <nav className="top-nav" aria-label="Navigasi utama">
                        <Link
                            href="/dashboard"
                            aria-current={
                                url.startsWith("/dashboard")
                                    ? "page"
                                    : undefined
                            }
                        >
                            Beranda
                        </Link>
                        <Link
                            href="/roadmap"
                            aria-current={
                                url.startsWith("/roadmap") ? "page" : undefined
                            }
                        >
                            Roadmap
                        </Link>
                        <Link
                            href="/learning"
                            aria-current={
                                url.startsWith("/learning") ? "page" : undefined
                            }
                        >
                            Modul
                        </Link>
                        <Link
                            href="/labs"
                            aria-current={
                                url.startsWith("/labs") ? "page" : undefined
                            }
                        >
                            Lab
                        </Link>
                        <Link
                            href="/progress"
                            aria-current={
                                url.startsWith("/progress") ? "page" : undefined
                            }
                        >
                            Progres
                        </Link>
                        <Link
                            href="/notes"
                            aria-current={
                                url.startsWith("/notes") ? "page" : undefined
                            }
                        >
                            Catatan
                        </Link>
                        <Link
                            href="/reports"
                            aria-current={
                                url.startsWith("/reports") ? "page" : undefined
                            }
                        >
                            Laporan
                        </Link>
                    </nav>
                    <div className="header-actions">
                        <Dialog.Root
                            open={searchOpen}
                            onOpenChange={setSearchOpen}
                        >
                            <Dialog.Trigger
                                className="icon-button"
                                aria-label="Buka pencarian"
                            >
                                <Search size={20} />
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                <Dialog.Overlay className="drawer-overlay" />
                                <Dialog.Content className="search-dialog">
                                    <Dialog.Title>
                                        Cari perjalanan belajarmu
                                    </Dialog.Title>
                                    <Dialog.Description>
                                        Telusuri aktivitas dari rencana yang
                                        tersimpan di akunmu.
                                    </Dialog.Description>
                                    <form
                                        onSubmit={submit}
                                        className="journey-search"
                                        role="search"
                                    >
                                        <Search size={19} />
                                        <label
                                            className="sr-only"
                                            htmlFor="global-search"
                                        >
                                            Cari aktivitas belajar
                                        </label>
                                        <input
                                            id="global-search"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            maxLength={100}
                                            placeholder="Cari aktivitas dalam roadmap…"
                                        />
                                        <button
                                            type="submit"
                                            className="icon-button"
                                            aria-label="Cari aktivitas"
                                        >
                                            <Search size={18} />
                                        </button>
                                    </form>
                                    <Dialog.Close
                                        className="icon-button dialog-close"
                                        aria-label="Tutup pencarian"
                                    >
                                        <X size={20} />
                                    </Dialog.Close>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                        <ThemeToggle
                            preference={auth.user.theme}
                            accountId={auth.user.id}
                        />
                        <button
                            className="avatar account-trigger"
                            aria-label="Buka menu akun"
                            onClick={(event) => {
                                trigger.current = event.currentTarget;
                                setOpen(true);
                            }}
                        >
                            {auth.user.avatar_url ? (
                                <img src={auth.user.avatar_url} alt="" />
                            ) : (
                                auth.user.name.slice(0, 1).toUpperCase()
                            )}
                        </button>
                    </div>
                </div>
            </header>
            <Dialog.Root open={open} onOpenChange={setOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="drawer-overlay" />
                    <Dialog.Content
                        className="account-drawer"
                        onCloseAutoFocus={(event) => {
                            event.preventDefault();
                            trigger.current?.focus();
                        }}
                    >
                        <Dialog.Title>Ruang belajarmu</Dialog.Title>
                        <Dialog.Description>
                            {auth.user.name} · {auth.user.email}
                        </Dialog.Description>
                        <Dialog.Close
                            className="icon-button dialog-close"
                            aria-label="Tutup navigasi"
                        >
                            <X size={20} />
                        </Dialog.Close>
                        <nav aria-label="Navigasi akun">
                            <Link
                                href="/profile"
                                onClick={() => setOpen(false)}
                            >
                                <UserRound size={19} />
                                Profil Saya
                            </Link>
                            <Link
                                href="/settings/general"
                                onClick={() => setOpen(false)}
                            >
                                <Settings size={19} />
                                Pengaturan
                            </Link>
                            <Link
                                href="/settings/security"
                                onClick={() => setOpen(false)}
                            >
                                <ShieldCheck size={19} />
                                Keamanan
                            </Link>
                            <Link
                                href="/notifications"
                                onClick={() => setOpen(false)}
                            >
                                <Bell size={19} />
                                Notifikasi
                            </Link>
                            {auth.user.permissions?.includes(
                                "studio.access",
                            ) && (
                                <Link
                                    href="/studio"
                                    onClick={() => setOpen(false)}
                                >
                                    <PanelsTopLeft size={19} />
                                    Admin Studio
                                </Link>
                            )}
                            <Link
                                href="/progress"
                                onClick={() => setOpen(false)}
                            >
                                <ChartNoAxesCombined size={19} />
                                Progres
                            </Link>
                            <Link
                                href="/reports"
                                onClick={() => setOpen(false)}
                            >
                                <FileText size={19} />
                                Laporan
                            </Link>
                            <Link href="/labs" onClick={() => setOpen(false)}>
                                <FlaskConical size={19} />
                                Lab
                            </Link>
                            <Link
                                href="/learning"
                                onClick={() => setOpen(false)}
                            >
                                <BookOpen size={19} />
                                Modul
                            </Link>
                            <Link href="/notes" onClick={() => setOpen(false)}>
                                <BookOpen size={19} />
                                Catatan
                            </Link>
                            <Link
                                href="/dashboard"
                                onClick={() => setOpen(false)}
                            >
                                <House size={19} />
                                Beranda
                            </Link>
                            <Link
                                href="/roadmap"
                                onClick={() => setOpen(false)}
                            >
                                <Map size={19} />
                                Roadmap
                            </Link>
                        </nav>
                        <label className="theme-setting">
                            Tema tampilan
                            <select
                                aria-label="Preferensi tema"
                                value={auth.user.theme}
                                onChange={(event) => {
                                    setThemeError(false);
                                    router.patch(
                                        "/settings/theme",
                                        { theme: event.target.value },
                                        {
                                            preserveScroll: true,
                                            onError: () => setThemeError(true),
                                        },
                                    );
                                }}
                            >
                                <option value="system">Ikuti sistem</option>
                                <option value="light">Terang</option>
                                <option value="dark">Gelap</option>
                            </select>
                        </label>
                        {themeError && (
                            <p role="alert">Tema gagal disimpan. Coba lagi.</p>
                        )}
                        <p className="scope-note">
                            Belajar lewat modul, uji pemahaman dengan kuis, lalu
                            simpan refleksi di catatan.
                        </p>
                        <button
                            className="account-logout"
                            onClick={() => router.post("/logout")}
                        >
                            <LogOut size={18} />
                            Keluar
                        </button>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
            <main
                id="main"
                className="journey-main"
                tabIndex={-1}
                aria-label={title}
                aria-busy={loading}
            >
                {loading && (
                    <div role="status" className="loading-shimmer">
                        <span className="sr-only">Memuat halaman…</span>
                    </div>
                )}
                {children}
                <footer className="journey-footer">
                    <span>
                        VulnLab · Rasa ingin tahu, dunia yang lebih aman.
                    </span>
                    <span>90 hari · 120 menit sehari</span>
                </footer>
            </main>
            <nav className="bottom-nav" aria-label="Navigasi mobile">
                <Link
                    href="/dashboard"
                    aria-current={
                        url.startsWith("/dashboard") ? "page" : undefined
                    }
                >
                    <House size={20} />
                    Beranda
                </Link>
                <Link
                    href="/roadmap"
                    aria-current={
                        url.startsWith("/roadmap") ? "page" : undefined
                    }
                >
                    <Map size={20} />
                    Roadmap
                </Link>
                <Link
                    href="/learning"
                    aria-current={
                        url.startsWith("/learning") ? "page" : undefined
                    }
                >
                    <BookOpen size={20} />
                    Modul
                </Link>
                <Link
                    href="/labs"
                    aria-current={url.startsWith("/labs") ? "page" : undefined}
                >
                    <FlaskConical size={20} />
                    Lab
                </Link>
                <button
                    onClick={(event) => {
                        trigger.current = event.currentTarget;
                        setOpen(true);
                    }}
                    aria-label="Lainnya: buka navigasi"
                >
                    <MoreHorizontal size={20} />
                    Lainnya
                </button>
            </nav>
        </div>
    );
}
