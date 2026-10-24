<?php

namespace Database\Seeders;

use App\Models\LearningPath;
use App\Models\Phase;
use App\Models\Week;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoadmapSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $path = LearningPath::updateOrCreate(['slug' => 'web-api-security'], ['title' => 'Web & API Security', 'description' => 'Rencana belajar mandiri 90 hari, 120 menit per hari.']);
            $phases = [
                ['Fondasi yang kuat', 'Fundamental', 'Jelaskan alur HTTP dan session.', 1, 3],
                ['Keamanan aplikasi web', 'Web', 'Susun checklist kontrol akses dan pertahanan web.', 4, 6],
                ['Mendalami API security', 'API', 'Petakan otorisasi objek dan fungsi API.', 7, 10],
                ['Siap memulai bug bounty', 'Bug Bounty', 'Buat laporan simulasi dengan bukti dummy.', 11, 13],
            ];
            $topics = [
                ['HTTP, browser, DNS', ['Internet dan DNS', 'Request dan response', 'Metode HTTP', 'Status code', 'Header HTTP', 'Pemetaan alur browser', 'Review HTTP']],
                ['Cookies, session, dan proxy', ['Cookie dan SameSite', 'Session browser', 'Riwayat request', 'Proxy lokal', 'Request editing di atas kertas', 'Dokumentasi request dummy', 'Review session']],
                ['Auth dan session flows', ['Autentikasi vs otorisasi', 'Login dan logout', 'Siklus hidup session', 'Hash kata sandi', 'Proteksi session', 'Matriks login dummy', 'Review autentikasi']],
                ['Access control dan IDOR', ['Kepemilikan objek', 'IDOR konseptual', 'Akses horizontal', 'Akses vertikal', 'Policy per objek', 'Matriks akses', 'Review kontrol akses']],
                ['XSS dan output encoding', ['Konteks output', 'Reflected XSS konseptual', 'Stored XSS konseptual', 'DOM dan trust boundary', 'Output encoding', 'Rancangan uji escaping', 'Review XSS']],
                ['SQLi dan CSRF', ['Alur data ke query', 'Parameter binding', 'Validasi input', 'Cookie dan CSRF', 'Token CSRF', 'Rancangan regresi', 'Review SQLi dan CSRF']],
                ['API discovery dan dokumentasi', ['REST dan JSON', 'Inventaris endpoint lokal', 'Skema API', 'OpenAPI', 'Error response', 'Pemetaan API dummy', 'Review dokumentasi API']],
                ['BOLA, BFLA, mass assignment', ['Otorisasi objek API', 'Otorisasi fungsi', 'Allowlist properti', 'Isolasi tenant', 'Hak akses minimum', 'Matriks izin API', 'Review otorisasi API']],
                ['JWT, GraphQL, business logic', ['Anatomi token', 'Validasi JWT', 'Otorisasi field GraphQL', 'Invarian bisnis', 'Ruang lingkup pengujian', 'Bukti minimal dummy', 'Review risiko API']],
                ['Praktik lokal dan remediasi', ['Rencana latihan berizin', 'Analisis skenario dummy', 'Rancangan patch', 'Uji regresi konseptual', 'Prioritas dampak', 'Laporan simulasi', 'Review remediasi']],
                ['Scope, izin, dan laporan', ['Membaca scope program', 'Pengecualian program', 'Batas pengujian', 'Struktur laporan', 'Langkah reproduksi', 'Redaksi bukti', 'Review etika']],
                ['Mock hunting lokal', ['Inventaris aset dummy', 'Hipotesis pengujian', 'Matriks akses dummy', 'Validasi dampak konseptual', 'Saran mitigasi', 'Laporan mock hunting', 'Review simulasi']],
                ['Review dan kesiapan', ['Review fondasi', 'Review web security', 'Review API security', 'Portofolio laporan dummy', 'Checklist kesiapan', 'Rencana belajar lanjutan']],
            ];
            foreach ($phases as $index => [$title, $category, $milestone, $from, $to]) {
                $phase = Phase::updateOrCreate(['learning_path_id' => $path->id, 'sort_order' => $index + 1], compact('title', 'category', 'milestone'));
                for ($number = $from; $number <= $to; $number++) {
                    [$weekTitle, $days] = $topics[$number - 1];
                    $week = Week::updateOrCreate(['week_number' => $number], ['phase_id' => $phase->id, 'title' => $weekTitle]);
                    foreach ($days as $offset => $dayTitle) {
                        DB::table('roadmap_day_templates')->updateOrInsert(['day_number' => ($number - 1) * 7 + $offset + 1], [
                            'week_id' => $week->id, 'title' => $dayTitle,
                            'objective' => "Jelaskan {$dayTitle} dengan kata sendiri, gunakan contoh data dummy, dan tuliskan satu tindakan pencegahan. Ini checklist belajar mandiri, bukan bukti lulus kuis atau lab.",
                        ]);
                    }
                }
            }
            // Only update templates: each learner keeps their existing content snapshot and progress.
            $source = json_decode(file_get_contents(database_path('data/roadmap-v4.json')), true, 512, JSON_THROW_ON_ERROR);
            if (array_column($source, 'day') !== range(1, 90)) {
                throw new \RuntimeException('The v4 curriculum must contain exactly 90 ordered days.');
            }
            foreach ($source as $day) {
                DB::table('roadmap_day_templates')->where('day_number', $day['day'])->update([
                    'title' => $day['title'],
                    'objective' => $day['theory_action'].' '.$day['reflection_action'],
                    'source_actions' => json_encode($day, JSON_THROW_ON_ERROR),
                ]);
            }
        });
    }
}
