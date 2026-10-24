export type ReportStatus =
    | "draft"
    | "ready_for_review"
    | "under_internal_review"
    | "needs_revision"
    | "accepted_for_practice"
    | "archived";
export type ReportEvidence = {
    id: number;
    original_filename: string;
    mime: string;
    size: number;
    created_at: string;
    download_url: string;
};
export type ReportEvaluation = {
    id: number;
    evaluator_type: string;
    scores: Record<
        | "technical_accuracy"
        | "reproducibility"
        | "evidence"
        | "impact_specificity"
        | "clarity"
        | "remediation_usefulness",
        number
    >;
    total: number;
    max_score: number;
    feedback: string[];
    rubric_version: string;
    report_version: number;
    evaluated_at: string;
    disclaimer: string;
};
export type Report = {
    id: number;
    title: string;
    cwe_id: string;
    lab_id: number | null;
    endpoint: string;
    severity: string;
    status: ReportStatus;
    version: number;
    summary: string;
    prerequisites: string;
    reproduction_md: string;
    expected_md: string;
    actual_md: string;
    evidence_md: string;
    impact_md: string;
    remediation_md: string;
    references_md: string;
    created_at: string;
    updated_at: string;
    reviewed_at: string | null;
    evidence: ReportEvidence[];
    evaluations: ReportEvaluation[];
    xp_delta?: number;
};
export type ReportLab = {
    id: number;
    slug: string;
    title: string;
    category: string;
    cwe_id: string | null;
    endpoint: string;
};
export const statusLabels: Record<ReportStatus, string> = {
    draft: "Draft · Latihan Internal",
    ready_for_review: "Siap ditinjau · Latihan Internal",
    under_internal_review: "Sedang ditinjau · Latihan Internal",
    needs_revision: "Perlu revisi · Latihan Internal",
    accepted_for_practice: "Diterima · Latihan Internal",
    archived: "Arsip · Latihan Internal",
};
export const severityLabels: Record<string, string> = {
    informational: "Informasional",
    low: "Rendah",
    medium: "Sedang",
    high: "Tinggi",
    critical: "Kritis",
};
export const reportFields = (report: Report) => ({
    title: report.title,
    cwe_id: report.cwe_id || "",
    lab_id: report.lab_id,
    endpoint: report.endpoint || "",
    severity: report.severity,
    summary: report.summary || "",
    prerequisites: report.prerequisites || "",
    reproduction_md: report.reproduction_md || "",
    expected_md: report.expected_md || "",
    actual_md: report.actual_md || "",
    evidence_md: report.evidence_md || "",
    impact_md: report.impact_md || "",
    remediation_md: report.remediation_md || "",
    references_md: report.references_md || "",
});
export type ReportFields = ReturnType<typeof reportFields>;
export const reportMarkdown = (report: Report) =>
    [
        `# ${report.title}`,
        ...(
            [
                ["Ringkasan", "summary"],
                ["Prasyarat", "prerequisites"],
                ["Langkah reproduksi", "reproduction_md"],
                ["Perilaku diharapkan", "expected_md"],
                ["Perilaku aktual", "actual_md"],
                ["Bukti / PoC", "evidence_md"],
                ["Dampak", "impact_md"],
                ["Rekomendasi mitigasi", "remediation_md"],
                ["Referensi", "references_md"],
            ] as const
        ).map(([label, key]) => `## ${label}\n\n${report[key]}`),
    ].join("\n\n");
