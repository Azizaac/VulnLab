import { Head, Link } from "@inertiajs/react";
import { ArrowRight, CheckCircle2, FlaskConical } from "lucide-react";
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
            <div className="v8-home">
                <div className="v8-home-top">
                    <section className="v8-home-hero">
                        <div className="v8-hero-copy">
                            <span className="v8-kicker">
                                VULNLAB / LEARNING JOURNEY
                            </span>
                            <h1>Halo, Hacker Muda!</h1>
                            <p>
                                Terus belajar dan bangun pemahaman melalui
                                materi, lab lokal, dan progres yang nyata.
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
                        <div className="v8-hero-art">
                            <HeroIllustration />
                        </div>
                    </section>
                    <section className="v8-today" aria-labelledby="today-title">
                        <span className="v8-kicker">HARI INI</span>
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
                            <ul>
                                {today.tasks.slice(0, 4).map((task) => (
                                    <li key={task.id}>
                                        <span aria-hidden="true">
                                            {task.status === "completed"
                                                ? "✓"
                                                : "○"}
                                        </span>
                                        <Link
                                            href={`/roadmap?day=${task.day}#task-${task.id}`}
                                        >
                                            {task.title}
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
                <section className="v8-summary" aria-label="Ringkasan belajar">
                    <Link href="/learning">
                        <strong>{stats.lessons_completed}</strong>
                        <span>Materi selesai</span>
                    </Link>
                    <Link href="/labs">
                        <strong>{stats.labs_solved}</strong>
                        <span>Lab terverifikasi</span>
                    </Link>
                    <Link href="/progress">
                        <strong>{stats.xp}</strong>
                        <span>XP tercatat</span>
                    </Link>
                    <Link href="/roadmap">
                        <strong>
                            {plan ? `${stats.days_completed} / 90` : "—"}
                        </strong>
                        <span>Hari roadmap selesai</span>
                    </Link>
                </section>
                <nav className="recovery-shortcuts" aria-label="Akses cepat">
                    <Link href="/roadmap">
                        <strong>Roadmap 90 Hari</strong>
                        <span>Jelajahi tahap & aktivitas →</span>
                    </Link>
                    <Link href="/learning">
                        <strong>Modul Belajar</strong>
                        <span>Konsep, referensi & kuis →</span>
                    </Link>
                    <Link href="/labs">
                        <strong>Lab Praktik</strong>
                        <span>Uji pemahaman di sandbox →</span>
                    </Link>
                    <Link href="/notes">
                        <strong>Catatan Saya</strong>
                        <span>Simpan hasil eksplorasi →</span>
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
                        <div className="v8-resume-box">
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
                        <div className="v8-next-box">
                            {nextLab && (
                                <Link href={`/labs/${nextLab.slug}`}>
                                    <FlaskConical size={18} />
                                    <span>
                                        <small>LAB</small>
                                        <strong>{nextLab.title}</strong>
                                        <em>Buka lab lokal</em>
                                    </span>
                                    <ArrowRight size={15} />
                                </Link>
                            )}
                            {!nextLab && (
                                <p className="muted">
                                    Tidak ada rekomendasi baru saat ini.
                                    Jelajahi katalog untuk belajar kembali.
                                </p>
                            )}
                        </div>
                    </section>
                </div>
                <details className="v8-activity" open>
                    <summary>Aktivitas terakhir</summary>
                    {activities.length ? (
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
                    ) : (
                        <p>Aktivitas belajarmu akan tampil di sini.</p>
                    )}
                    <p>
                        Checklist mandiri, materi, lab dan XP dicatat sebagai
                        bukti yang berbeda.
                    </p>
                </details>
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
