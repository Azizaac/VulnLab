<?php

namespace App\Services;

use App\Models\LabProgress;
use App\Models\VulnerabilityReport;

class ReportRubric
{
    public const VERSION = 'completeness-v1';

    public const DISCLAIMER = 'Penilaian kelengkapan otomatis untuk Latihan Internal; bukan verifikasi akurasi teknis, dampak, severity, atau review pakar. Diterima jika lab terkait sudah diselesaikan, total minimal 20/24, dan setiap dimensi minimal 3/4. Panjang teks dan struktur adalah indikator kelengkapan, bukan bukti kualitas.';

    public function evaluate(VulnerabilityReport $report): array
    {
        $body = $report->body_json;
        $length = fn (string $key) => mb_strlen(trim($body[$key] ?? ''));
        $solved = $report->lab_id && LabProgress::where('user_id', $report->user_id)->where('lab_id', $report->lab_id)->exists();
        $steps = preg_match_all('/^\s*(?:\d+[.)]|[-*])\s+\S/mu', $body['reproduction_md'] ?? '');
        $scores = [
            'technical_accuracy' => $solved ? ($report->cwe_id ? 4 : 3) : ($report->lab_id ? 2 : 1),
            'reproducibility' => $steps >= 2 && $length('reproduction_md') >= 80 ? 4 : ($steps >= 1 && $length('reproduction_md') >= 40 ? 3 : ($length('reproduction_md') >= 20 ? 2 : 0)),
            'evidence' => $length('evidence_md') >= 80 || ($report->evidence()->exists() && $length('evidence_md') >= 20) ? 4 : ($length('evidence_md') >= 40 ? 3 : ($length('evidence_md') >= 20 ? 2 : 0)),
            'impact_specificity' => $length('impact_md') >= 100 ? 4 : ($length('impact_md') >= 40 ? 3 : ($length('impact_md') >= 20 ? 2 : 0)),
            'clarity' => $length('summary') >= 80 && mb_strlen($report->title) >= 12 ? 4 : ($length('summary') >= 40 ? 3 : ($length('summary') >= 20 ? 2 : 0)),
            'remediation_usefulness' => $length('remediation_md') >= 100 ? 4 : ($length('remediation_md') >= 40 ? 3 : ($length('remediation_md') >= 20 ? 2 : 0)),
        ];
        $feedback = [];
        if (! $solved) {
            $feedback[] = 'Selesaikan lab terkait terlebih dahulu agar latihan memiliki bukti praktik yang tervalidasi.';
        }
        $labels = ['technical_accuracy' => 'Konteks teknis dan CWE', 'reproducibility' => 'Langkah reproduksi bernomor', 'evidence' => 'Penjelasan bukti tersanitasi', 'impact_specificity' => 'Dampak yang spesifik', 'clarity' => 'Judul dan ringkasan', 'remediation_usefulness' => 'Rekomendasi mitigasi'];
        foreach ($scores as $key => $score) {
            if ($score < 3) {
                $feedback[] = $labels[$key].': tambahkan konteks yang konkret, hindari pengulangan teks hanya untuk memenuhi panjang.';
            }
        }
        $accepted = $solved && array_sum($scores) >= 20 && min($scores) >= 3;
        $feedback[] = $accepted ? 'Kriteria kelengkapan Latihan Internal terpenuhi. Verifikasi pakar tetap diperlukan sebelum digunakan di luar latihan.' : 'Draft memerlukan revisi. Perbaiki bagian di atas lalu ajukan kembali untuk Latihan Internal.';

        return ['scores' => $scores, 'total' => array_sum($scores), 'feedback' => $feedback, 'accepted' => $accepted];
    }
}
