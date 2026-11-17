import { Head, Link } from "@inertiajs/react";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Compass,
    FlaskConical,
    Map,
    NotebookPen,
    Sparkles,
} from "lucide-react";
import AppShell from "../components/AppShell";
import type { RoadmapProps } from "../types";
import "../../css/v8-dashboard-roadmap.css";
import { HeroIllustration } from "../components/JourneyArt";

export default function Dashboard({
    stats,
    nextTask,
    activities,
    plan,
    today,
    legacyProgress,
    nextLesson,
    nextLab,
}: RoadmapProps) {
    const nextUrl = nextLesson
        ? `/learning/${nextLesson.slug}`
        : nextTask
          ? `/roadmap?day=${nextTask.day}#task-${nextTask.id}`
          : "/learning";
    return (
        <AppShell title="Beranda">
            <Head title="Beranda" />
            <div className="v8-home v9-home">
                <div className="v8-home-top">
                    <section className="v8-home-hero v9-hero-card">
                        <div className="v8-hero-art">
                            <HeroIllustration />
                        </div>
                        <p className="v9-hero-quote" aria-hidden="true">
                            “Skill hari ini, keamanan yang lebih baik untuk
                            esok.”
                        </p>
                        <div className="v8-hero-copy">
                            <span className="v8-kicker v9-pill-kicker">
                                VULNLAB · WEB &amp; API SECURITY
                            </span>
                            <h1>Halo, Hacker Muda!</h1>
                            <p>
                                Terus belajar dan bangun pemahaman melalui
                                materi terarah, lab lokal berizin, dan progres
                                yang terukur.
                            </p>
                            <div className="v8-hero-actions">
                                <Link className="v8-primary" href={nextUrl}>
                                    Lanjutkan Belajar <ArrowRight size={16} />
                                </Link>
                                <Link className="v8-secondary" href="/roadmap">
                                    Lihat Roadmap
                                </Link>
                            </div>
                        </div>
                    </section>
                    <section
                        className="v8-today v9-today-card"
                        aria-labelledby="today-title"
                    >
                        <div className="v9-today-head">
                            <span className="v8-kicker">HARI INI</span>
                            {plan?.timezone && (
                                <span className="v9-tz-chip">
                                    {plan.timezone}
                                </span>
                            )}
                        </div>
                        <h2 id="today-title">
                            {today.day
                                ? `Hari ${today.day}`
                                : "Rencana belajarmu"}
                        </h2>
                        <p>
                            {today.day
                                ? `Aktivitas sesuai zona waktu ${plan?.timezone}.`
                                : plan
                                  ? "Lihat jadwal dan pilih langkah berikutnya."
                                  : "Buat rencana untuk melihat aktivitas harianmu."}
                        </p>
                        {today.tasks.length > 0 && (
                            <ul className="v9-today-list">
                                {today.tasks.slice(0, 3).map((task) => (
                                    <li
                                        key={task.id}
                                        className={`status-${task.status}`}
                                    >
                                        <span
                                            className="v9-task-bullet"
                                            aria-hidden="true"
                                        >
                                            {task.status === "completed"
                                                ? "✓"
                                                : "○"}
                                        </span>
                                        <Link
                                            href={`/roadmap?day=${task.day}#task-${task.id}`}
                                        >
                                            <span className="v9-task-name">
                                                {task.title}
                                            </span>
                                            <small>
                                                {task.status === "completed"
                                                    ? "Selesai"
                                                    : task.status === "locked"
                                                      ? "Terkunci"
                                                      : task.status ===
                                                          "in_progress"
                                                        ? "Dikerjakan"
                                                        : "Tersedia"}
                                            </small>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Link className="v8-inline-link" href="/roadmap">
                            {plan
                                ? "Buka rencana harian"
                                : "Buat Roadmap 90 Hari"}{" "}
                            <ArrowRight size={14} />
                        </Link>
                    </section>
                </div>

                <section
                    className="v8-summary v9-metric-ribbon"
                    aria-label="Ringkasan belajar"
                >
                    <Link href="/learning" className="v9-metric-item tone-blue">
                        <span className="v9-metric-icon" aria-hidden="true">
                            <BookOpen size={18} />
                        </span>
                        <div>
                            <strong>{stats.lessons_completed}</strong>
                            <span>Materi selesai</span>
                        </div>
                    </Link>
                    <Link href="/labs" className="v9-metric-item tone-teal">
                        <span className="v9-metric-icon" aria-hidden="true">
                            <FlaskConical size={18} />
                        </span>
                        <div>
                            <strong>{stats.labs_solved}</strong>
                            <span>Lab terverifikasi</span>
                        </div>
                    </Link>
                    <Link
                        href="/progress"
                        className="v9-metric-item tone-violet"
                    >
                        <span className="v9-metric-icon" aria-hidden="true">
                            <Sparkles size={18} />
                        </span>
                        <div>
                            <strong>{stats.xp}</strong>
                            <span>XP tercatat</span>
                        </div>
                    </Link>
                    <Link href="/roadmap" className="v9-metric-item tone-amber">
                        <span className="v9-metric-icon" aria-hidden="true">
                            <Compass size={18} />
                        </span>
                        <div>
                            <strong>
                                {plan ? `${stats.days_completed} / 90` : "—"}
                            </strong>
                            <span>Hari roadmap selesai</span>
                        </div>
                    </Link>
                </section>

                <nav
                    className="recovery-shortcuts v9-shortcuts"
                    aria-label="Akses cepat"
                >
                    <Link href="/roadmap" className="tone-blue">
                        <span className="v9-shortcut-icon" aria-hidden="true">
                            <Map size={19} />
                        </span>
                        <div>
                            <strong>Roadmap 90 Hari</strong>
                            <span>Jelajahi tahap &amp; aktivitas →</span>
                        </div>
                    </Link>
                    <Link href="/learning" className="tone-violet">
                        <span className="v9-shortcut-icon" aria-hidden="true">
                            <BookOpen size={19} />
                        </span>
                        <div>
                            <strong>Modul Belajar</strong>
                            <span>Konsep, referensi &amp; kuis →</span>
                        </div>
                    </Link>
                    <Link href="/labs" className="tone-teal">
                        <span className="v9-shortcut-icon" aria-hidden="true">
                            <FlaskConical size={19} />
                        </span>
                        <div>
                            <strong>Lab Praktik</strong>
                            <span>Uji pemahaman di sandbox →</span>
                        </div>
                    </Link>
                    <Link href="/notes" className="tone-amber">
                        <span className="v9-shortcut-icon" aria-hidden="true">
                            <NotebookPen size={19} />
                        </span>
                        <div>
                            <strong>Catatan Saya</strong>
                            <span>Simpan hasil eksplorasi →</span>
                        </div>
                    </Link>
                </nav>

                <div className="v8-home-content">
                    <section
                        className="v8-resume"
                        aria-labelledby="resume-title"
                    >
                        <div className="v8-section-heading">
                            <div>
                                <h2 id="resume-title">Lanjutkan belajar</h2>
                                <p>
                                    Satu langkah yang relevan untuk
                                    perjalananmu.
                                </p>
                            </div>
                            <Link href="/learning">
                                Semua modul <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="v8-resume-box v9-spotlight-card">
                            <span className="v8-kicker">
                                {nextLesson
                                    ? "MATERI BERIKUTNYA"
                                    : "ROADMAP BELAJAR"}
                            </span>
                            <h3>
                                {nextLesson?.title ||
                                    nextTask?.title ||
                                    (plan
                                        ? "Semua aktivitas tersedia untuk ditinjau"
                                        : "Mulai perjalananmu")}
                            </h3>
                            <p>
                                {nextLesson
                                    ? `${nextLesson.minutes} menit · ${nextLesson.read ? "Sudah dibaca" : "Belum dibaca"} · ${nextLesson.quiz_passed ? "Kuis lulus" : "Kuis belum lulus"}`
                                    : nextTask
                                      ? `Hari ${nextTask.day} · ${nextTask.minutes} menit · progres tersimpan`
                                      : "Buka materi atau roadmap untuk memilih langkah belajar."}
                            </p>
                            <div className="recovery-completion">
                                <span>
                                    Checklist roadmap · {stats.percent}%
                                </span>
                                <progress
                                    aria-label="Checklist roadmap"
                                    value={stats.completed}
                                    max={Math.max(1, stats.total)}
                                />
                            </div>
                            <p className="resume-caption">
                                {plan
                                    ? `${stats.completed} dari ${stats.total} checklist direview · ${stats.days_completed} dari 90 hari selesai`
                                    : "Rencana roadmap belum dibuat."}
                            </p>
                            <Link className="v8-primary" href={nextUrl}>
                                Lanjutkan <ArrowRight size={15} />
                            </Link>
                        </div>
                    </section>
                    <section className="v8-next" aria-labelledby="next-title">
                        <div className="v8-section-heading">
                            <div>
                                <h2 id="next-title">Langkah Berikutnya</h2>
                                <p>Rekomendasi sesuai prasyarat.</p>
                            </div>
                        </div>
                        <div className="v8-next-box v9-next-stack">
                            {nextLab ? (
                                <Link
                                    href={`/labs/${nextLab.slug}`}
                                    className="v9-rec-item"
                                >
                                    <span
                                        className="v9-rec-icon"
                                        aria-hidden="true"
                                    >
                                        <FlaskConical size={18} />
                                    </span>
                                    <span>
                                        <small>LAB LOKAL TERISOLASI</small>
                                        <strong>{nextLab.title}</strong>
                                        <em>
                                            Bandingkan mode vulnerable &amp;
                                            secure
                                        </em>
                                    </span>
                                    <ArrowRight size={15} />
                                </Link>
                            ) : (
                                <p className="muted">
                                    Tidak ada rekomendasi baru saat ini.
                                    Jelajahi katalog untuk belajar kembali.
                                </p>
                            )}
                            <Link
                                href="/reports"
                                className="v9-rec-item subtle"
                            >
                                <span
                                    className="v9-rec-icon violet"
                                    aria-hidden="true"
                                >
                                    <NotebookPen size={18} />
                                </span>
                                <span>
                                    <small>LATIHAN LAPORAN</small>
                                    <strong>Dokumentasikan temuan lab</strong>
                                    <em>
                                        Latih struktur laporan reproduksibel
                                    </em>
                                </span>
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </section>
                </div>

                {activities.length > 0 ? (
                    <details className="v8-activity v9-activity-feed" open>
                        <summary>Aktivitas terakhir</summary>
                        <ol>
                            {activities.map((activity) => (
                                <li key={activity.id}>
                                    <CheckCircle2 size={16} />
                                    <span>
                                        {activity.title}{" "}
                                        <time dateTime={activity.at}>
                                            {new Intl.DateTimeFormat("id-ID", {
                                                dateStyle: "medium",
                                                timeZone:
                                                    plan?.timezone ||
                                                    "Asia/Jakarta",
                                            }).format(new Date(activity.at))}
                                        </time>
                                    </span>
                                </li>
                            ))}
                        </ol>
                        <p>
                            Checklist mandiri, materi, lab dan XP dicatat
                            sebagai bukti yang berbeda.
                        </p>
                    </details>
                ) : (
                    <section
                        className="v9-onboarding-strip"
                        aria-label="Panduan mulai belajar"
                    >
                        <div>
                            <strong>Cara belajar efektif di VulnLab</strong>
                            <p>
                                Baca konsep &amp; contoh HTTP → kerjakan kuis
                                server-side → buktikan di sandbox lokal → tulis
                                catatan &amp; laporan latihan.
                            </p>
                        </div>
                        <span className="v9-onboarding-note">
                            Progres dicatat dari bukti kuis, lab, dan laporan —
                            bukan sekadar membuka halaman.
                        </span>
                    </section>
                )}

                {!!legacyProgress.length && (
                    <details className="v8-activity">
                        <summary>
                            Arsip progres sebelumnya ({legacyProgress.length})
                        </summary>
                        <p>
                            Arsip tetap tersimpan dan tidak dihitung sebagai
                            penyelesaian rencana saat ini.
                        </p>
                        <ul>
                            {legacyProgress.map((item, index) => (
                                <li key={index}>
                                    {item.title} · {item.completed_at}
                                </li>
                            ))}
                        </ul>
                    </details>
                )}
            </div>
        </AppShell>
    );
}
