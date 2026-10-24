import { CheckCircle2, ShieldCheck } from "lucide-react";
import { statusLabels, type Report, type ReportStatus } from "../reports";

export default function ReportGuidance({ report }: { report: Report }) {
    const steps: ReportStatus[] = [
        "draft",
        "ready_for_review",
        "under_internal_review",
        "needs_revision",
        "accepted_for_practice",
        "archived",
    ];
    return (
        <aside className="s4-report-guidance">
            <section className="s4-panel">
                <h2>Tips Laporan yang Baik</h2>
                <ul className="s4-report-tips">
                    {[
                        "Gunakan judul yang menjelaskan celah dan dampaknya.",
                        "Tuliskan prasyarat dan langkah yang dapat diulang.",
                        "Pisahkan hasil yang diharapkan dari hasil aktual.",
                        "Gunakan bukti minimal dari data dummy sandbox.",
                        "Jelaskan dampak yang benar-benar terbukti.",
                        "Berikan rekomendasi perbaikan yang spesifik.",
                    ].map((tip) => (
                        <li key={tip}>
                            <CheckCircle2 size={16} />
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </section>
            <section className="s4-panel">
                <h2>Status Laporan</h2>
                <p className="s4-caption">Alur Latihan Internal</p>
                <ol className="s4-report-timeline">
                    {steps.map((status) => (
                        <li
                            key={status}
                            aria-current={
                                report.status === status ? "step" : undefined
                            }
                        >
                            <span />
                            <div>
                                <strong>
                                    {statusLabels[status].split(" · ")[0]}
                                </strong>
                                {report.status === status && (
                                    <small>Status saat ini</small>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            </section>
            <section className="s4-practice-notice">
                <ShieldCheck size={22} />
                <div>
                    <strong>Ruang latihan pribadi</strong>
                    <p>
                        Laporan tidak dikirim ke program bounty. Severity masih
                        usulan. Evaluasi kelengkapan otomatis bukan tinjauan
                        pakar keamanan.
                    </p>
                </div>
            </section>
        </aside>
    );
}
