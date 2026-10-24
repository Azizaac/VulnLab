import { Head, Link } from "@inertiajs/react";
import { ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Error({ status }: { status: number }) {
    const title =
        status === 403
            ? "Akses ditolak"
            : status === 404
              ? "Konten tidak ditemukan"
              : status === 419
                ? "Sesi berakhir"
                : "Halaman belum dapat dimuat";
    return (
        <main className="error-page">
            <Head title={title} />
            <section className="card empty-state">
                <ShieldCheck size={36} />
                <span className="eyebrow">VULNLAB · {status}</span>
                <h1>{title}</h1>
                <p>
                    {status === 403
                        ? "Halaman atau data ini bukan milik akunmu."
                        : "Kembali ke dashboard atau muat ulang untuk mencoba lagi. Progres yang sudah tersimpan tetap ada."}
                </p>
                <div className="error-actions">
                    {status === 419 && (
                        <Button asChild>
                            <Link href="/login">Masuk kembali</Link>
                        </Button>
                    )}
                    <Button asChild>
                        <Link href="/dashboard">Ke dashboard</Link>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                    >
                        Coba lagi
                    </Button>
                </div>
            </section>
        </main>
    );
}
