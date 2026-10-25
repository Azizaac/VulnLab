import { Head, Link, router } from "@inertiajs/react";
import AppShell from "../components/AppShell";
export default function Notifications({
    notifications,
}: {
    notifications: {
        data: {
            id: number;
            message: string;
            href: string;
            read_at: string | null;
            created_at: string;
        }[];
        prev_page_url: string | null;
        next_page_url: string | null;
    };
}) {
    return (
        <AppShell title="Notifikasi">
            <Head title="Notifikasi" />
            <div className="v5-title">
                <div>
                    <p className="v5-eyebrow">AKUN VULNLAB</p>
                    <h1>Notifikasi</h1>
                    <p>Perubahan keamanan dan pembaruan konten pilihanmu.</p>
                </div>
            </div>
            <section className="v5-card">
                {!notifications.data.length && <p>Belum ada notifikasi.</p>}
                {notifications.data.map((n) => (
                    <article key={n.id} className="v5-row">
                        <div>
                            <Link href={n.href}>{n.message}</Link>
                            <p>
                                {new Date(n.created_at).toLocaleString("id-ID")}
                            </p>
                        </div>
                        {!n.read_at && (
                            <button
                                className="v5-button secondary"
                                onClick={() =>
                                    router.post(`/notifications/${n.id}/read`)
                                }
                            >
                                Tandai dibaca
                            </button>
                        )}
                    </article>
                ))}
                <div className="v5-actions">
                    {notifications.prev_page_url && (
                        <Link href={notifications.prev_page_url}>
                            Sebelumnya
                        </Link>
                    )}
                    {notifications.next_page_url && (
                        <Link href={notifications.next_page_url}>
                            Berikutnya
                        </Link>
                    )}
                </div>
            </section>
        </AppShell>
    );
}
