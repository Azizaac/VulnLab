import { ClipboardCheck } from "lucide-react";
import type { ReportEvaluation } from "../reports";

export default function ReportRubric({
    evaluations,
}: {
    evaluations: ReportEvaluation[];
}) {
    const evaluation = evaluations[0];
    const labels = {
        technical_accuracy: "Konteks teknis",
        reproducibility: "Reproduksibilitas",
        evidence: "Bukti pendukung",
        impact_specificity: "Kejelasan dampak",
        clarity: "Kejelasan penulisan",
        remediation_usefulness: "Kegunaan mitigasi",
    };
    return (
        <section className="s4-panel s4-report-rubric">
            <div className="s4-panel-heading">
                <h2>Rubrik Latihan Internal</h2>
                <ClipboardCheck size={20} />
            </div>
            {!evaluation ? (
                <p className="s4-caption">
                    Belum dievaluasi. Simpan dan kirim draft ke alur tinjauan
                    internal untuk memeriksa kelengkapannya.
                </p>
            ) : (
                <>
                    <div className="s4-rubric-score">
                        <strong>
                            {evaluation.total}
                            <small>/{evaluation.max_score}</small>
                        </strong>
                        <span>Evaluasi kelengkapan otomatis</span>
                    </div>
                    <dl>
                        {Object.entries(labels).map(([key, label]) => (
                            <div key={key}>
                                <dt>{label}</dt>
                                <dd>
                                    {
                                        evaluation.scores[
                                            key as keyof typeof labels
                                        ]
                                    }
                                    /4
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <ul>
                        {evaluation.feedback.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                    <p className="s4-caption">{evaluation.disclaimer}</p>
                    <small>
                        Rubrik {evaluation.rubric_version} · versi laporan{" "}
                        {evaluation.report_version}
                    </small>
                </>
            )}
        </section>
    );
}
