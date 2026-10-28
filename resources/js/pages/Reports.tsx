import { Head, Link, router } from "@inertiajs/react";
import { useState, type FormEvent } from "react";
import { Archive, FilePenLine, FileText, Plus, Search } from "lucide-react";
import AppShell from "../components/AppShell";
import "../../css/v8-workspaces.css";
import {
    ConfirmDialog,
    EmptyState,
    normalizeLaravelError,
    useFeedback,
} from "../feedback";
import { requestJson } from "../learning";
import {
    severityLabels,
    statusLabels,
    type Report,
    type ReportLab,
    type ReportStatus,
} from "../reports";

type Props = {
    reports: {
        data: Report[];
        total: number;
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters: { search?: string; status?: string; severity?: string };
    labs: ReportLab[];
    statuses: { value: ReportStatus; label: string }[];
    severities: string[];
};
export default function Reports({
    reports,
    filters,
    labs,
    statuses,
    severities,
}: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");
    const [severity, setSeverity] = useState(filters.severity || "");
    const [archive, setArchive] = useState<Report | null>(null);
    const [pending, setPending] = useState(false);
    const { notify } = useFeedback();
    function filter(event: FormEvent) {
        event.preventDefault();
        router.get(
            "/reports",
            { search, status, severity },
            { preserveScroll: true },
        );
    }
    async function archiveReport() {
        if (!archive || pending) return;
        setPending(true);
        try {
            await requestJson(`/reports/${archive.id}/archive`, "POST", {
                version: archive.version,
            });
            setArchive(null);
            notify({
                type: "success",
                title: "Laporan diarsipkan",
                message: "Laporan tetap tersimpan di arsip Latihan Internal.",
            });
            router.reload({ only: ["reports"] });
        } catch (error) {
            const failure = normalizeLaravelError(error);
            notify({
                type: "error",
                title: failure.title,
                message: failure.message,
            });
        } finally {
            setPending(false);
        }
    }
    return (
        <AppShell title="Laporan latihan">
            <Head title="Laporan" />
            <div className="s4-page v8-workspace v8-reports">
                <header className="s4-page-heading">
                    <div>
                        <span className="eyebrow">PRACTICE REPORTS</span>
                        <h1>Tulis temuan yang mudah direproduksi.</h1>
                        <p>
                            Laporan latihan, bukan submission ke program
                            eksternal.
                        </p>
                    </div>
                    <Link href="/reports/create" className="learning-button">
                        <Plus size={18} />
                        Laporan Baru
                    </Link>
                </header>
                <div className="s4-practice-strip">
                    <FileText size={19} />
                    <p>
                        Dokumen pribadi untuk Latihan Internal. Tidak ada
                        pengiriman ke pihak ketiga atau penilaian bounty nyata.
                    </p>
                </div>
                <form onSubmit={filter} className="s4-report-filters">
                    <label className="workspace-search">
                        <Search size={18} />
                        <span className="sr-only">Cari laporan</span>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari judul atau kategori..."
                        />
                    </label>
                    <label>
                        <span className="sr-only">Status laporan</span>
                        <select
                            aria-label="Status laporan"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">Semua status</option>
                            {statuses.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {statusLabels[item.value] || item.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span className="sr-only">Severity usulan</span>
                        <select
                            aria-label="Severity usulan"
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value)}
                        >
                            <option value="">Semua severity</option>
                            {severities.map((item) => (
                                <option key={item} value={item}>
                                    {severityLabels[item] || item}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button type="submit" className="learning-button secondary">
                        Terapkan filter
                    </button>
                </form>
                <div className="s4-report-list-header">
                    <h2>Laporan tersimpan</h2>
                    <span>{reports.total} laporan</span>
                </div>
                {!reports.data.length ? (
                    <EmptyState
                        title={
                            filters.search || filters.status || filters.severity
                                ? "Tidak ada laporan yang cocok"
                                : "Laporan pertamamu dimulai di sini"
                        }
                    >
                        <p>
                            {filters.search ||
                            filters.status ||
                            filters.severity
                                ? "Coba kata kunci atau filter lain."
                                : "Selesaikan satu lab, lalu dokumentasikan temuanmu dengan bukti dummy yang jelas."}
                        </p>
                        <Link
                            href="/reports/create"
                            className="learning-button"
                        >
                            <Plus size={16} />
                            Buat laporan latihan
                        </Link>
                    </EmptyState>
                ) : (
                    <div className="s4-report-list">
                        {reports.data.map((report) => (
                            <article
                                className="s4-report-list-item"
                                key={report.id}
                            >
                                <span className="s4-report-file-icon">
                                    <FilePenLine size={24} />
                                </span>
                                <div className="s4-report-item-body">
                                    <Link
                                        href={`/reports/${report.id}`}
                                        className="s4-report-title"
                                    >
                                        {report.title}
                                    </Link>
                                    <p>
                                        {report.cwe_id ||
                                            "Kategori belum diisi"}
                                        {report.lab_id
                                            ? ` · ${labs.find((lab) => lab.id === report.lab_id)?.title || "Lab terkait"}`
                                            : " · Latihan mandiri"}
                                    </p>
                                    <div className="s4-report-meta">
                                        <span
                                            className={`s4-status-badge ${report.status}`}
                                        >
                                            {statusLabels[report.status]}
                                        </span>
                                        <span
                                            className={`s4-severity ${report.severity}`}
                                        >
                                            {severityLabels[report.severity] ||
                                                report.severity}{" "}
                                            (usulan)
                                        </span>
                                        <time dateTime={report.updated_at}>
                                            Diperbarui{" "}
                                            {new Intl.DateTimeFormat("id-ID", {
                                                dateStyle: "medium",
                                            }).format(
                                                new Date(report.updated_at),
                                            )}
                                        </time>
                                    </div>
                                </div>
                                <div className="s4-report-item-actions">
                                    <Link
                                        href={`/reports/${report.id}${["draft", "needs_revision"].includes(report.status) ? "/edit" : ""}`}
                                        className="learning-button secondary"
                                    >
                                        {["draft", "needs_revision"].includes(
                                            report.status,
                                        )
                                            ? "Edit"
                                            : "Lihat"}
                                    </Link>
                                    {report.status !== "archived" && (
                                        <button
                                            className="s4-icon-button"
                                            onClick={() => setArchive(report)}
                                            aria-label={`Arsipkan ${report.title}`}
                                        >
                                            <Archive size={18} />
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
                <nav
                    className="s4-pagination"
                    aria-label="Halaman daftar laporan"
                >
                    {reports.prev_page_url && (
                        <Link
                            href={reports.prev_page_url}
                            className="learning-button secondary"
                        >
                            Sebelumnya
                        </Link>
                    )}
                    <span>
                        Halaman {reports.current_page} dari{" "}
                        {Math.max(1, reports.last_page)}
                    </span>
                    {reports.next_page_url && (
                        <Link
                            href={reports.next_page_url}
                            className="learning-button secondary"
                        >
                            Berikutnya
                        </Link>
                    )}
                </nav>
                <ConfirmDialog
                    open={!!archive}
                    onOpenChange={(open) => {
                        if (!open && !pending) setArchive(null);
                    }}
                    title="Arsipkan laporan ini?"
                    description="Laporan tetap menjadi dokumen Latihan Internal dan dapat ditemukan melalui filter Arsip."
                    onConfirm={archiveReport}
                    confirmLabel="Arsipkan laporan"
                    pending={pending}
                />
            </div>
        </AppShell>
    );
}
