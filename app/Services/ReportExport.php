<?php

namespace App\Services;

use App\Models\VulnerabilityReport;

class ReportExport
{
    public function __construct(private ReportRedactor $redactor, private SafeMarkdown $markdown) {}

    public function markdown(VulnerabilityReport $report): string
    {
        $output = '# '.$this->redactor->markdown($report->title)."\n\n> LATIHAN INTERNAL — tidak dikirim ke program bug bounty. Severity adalah usulan.\n\n";
        foreach (['CWE' => $report->cwe_id ?? '-', 'Endpoint sandbox' => $report->endpoint, 'Severity usulan' => $report->severity, 'Status Latihan Internal' => $report->status] as $label => $value) {
            $output .= '**'.$label.':** '.$this->redactor->markdown($value)."\n\n";
        }
        $labels = ['summary' => 'Ringkasan', 'prerequisites' => 'Prasyarat', 'reproduction_md' => 'Langkah reproduksi', 'expected_md' => 'Perilaku diharapkan', 'actual_md' => 'Perilaku aktual', 'evidence_md' => 'Bukti / PoC tersanitasi', 'impact_md' => 'Dampak', 'remediation_md' => 'Rekomendasi mitigasi', 'references_md' => 'Referensi'];
        foreach ($labels as $key => $label) {
            $output .= '## '.$label."\n\n".$this->redactor->markdown($report->body_json[$key] ?? '')."\n\n";
        }
        if ($evaluation = $report->evaluations()->first()) {
            $output .= "## Rubrik kelengkapan otomatis\n\n".ReportRubric::DISCLAIMER."\n\n";
            foreach ($evaluation->scores_json as $dimension => $score) {
                $output .= '- '.$dimension.': '.$score."/4\n";
            }
            $output .= "\nTotal: ".array_sum($evaluation->scores_json)."/24\n";
        }
        $output .= "\nBerkas bukti tetap privat dan tidak disematkan ke export. Tinjau kembali penyamaran data sebelum membagikan laporan.\n";

        return $output;
    }

    public function html(VulnerabilityReport $report): string
    {
        $title = e($this->redactor->redact($report->title));
        $body = $this->markdown->render($this->markdown($report));

        return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'.$title.'</title><style>body{font:16px/1.65 system-ui,sans-serif;max-width:850px;margin:40px auto;padding:0 24px;color:#172033}h1,h2{line-height:1.25}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:16px;background:#f1f5f9}a{overflow-wrap:anywhere}blockquote{border-left:4px solid #2563eb;margin-left:0;padding:8px 16px;background:#eff6ff}@media print{body{max-width:none;margin:0;padding:0}h2{break-after:avoid}pre{break-inside:avoid}}@page{margin:20mm}</style></head><body><p>Gunakan menu Cetak browser untuk mencetak atau menyimpan PDF secara lokal.</p><main>'.$body.'</main></body></html>';
    }
}
