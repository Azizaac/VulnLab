import { Head, Link, router } from "@inertiajs/react";
import { useState, FormEvent } from "react";
import {
    ArrowRight,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    FlaskConical,
    Map,
    NotebookPen,
    Search,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { HeroIllustration } from "../components/JourneyArt";
import PlanForm from "../components/PlanForm";
import TaskRow from "../components/TaskRow";
import { Button } from "../components/ui/button";
import type { RoadmapProps } from "../types";
export default function Dashboard({
    stats,
    nextTask,
    phases,
    activities,
    plan,
    today,
    legacyProgress,
    nextLesson,
    nextLab,
}: RoadmapProps) {
    const [query, setQuery] = useState("");
    const tasks = phases.flatMap((phase) =>
        phase.weeks.flatMap((week) => week.tasks),
    );
    const nextTwo = tasks
        .filter((task) => task.status !== "completed")
        .slice(0, 2);
    const nextUrl = nextTask
        ? `/roadmap?day=${nextTask.day}#task-${nextTask.id}`
        : "/roadmap";
    function search(event: FormEvent) {
        event.preventDefault();
        router.get("/roadmap", { search: query });
    }
    return (
        <AppShell title="Beranda">
            <Head title="Beranda" />
            <section className="academy-hero">
                <HeroIllustration />
                <div className="academy-copy">
                    <h1>
                        Halo, Hacker Muda! <span aria-hidden="true">👋</span>
                    </h1>
                    <p>
                        Terus belajar, terus eksplorasi, dan jadilah lebih baik
                        setiap hari. Dunia digital lebih aman dengan kamu di
                        dalamnya.
                    </p>
                    <form
                        onSubmit={search}
                        className="hero-search"
                        role="search"
                    >
                        <label className="sr-only" htmlFor="hero-search">
                            Apa yang ingin kamu pelajari hari ini?
                        </label>
                        <input
                            id="hero-search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            maxLength={100}
                            placeholder="Apa yang ingin kamu pelajari hari ini?"
                        />
                        <button type="submit" aria-label="Cari di roadmap">
                            <Search size={21} />
                        </button>
                    </form>
                    <span className="hero-search-hint">
                        Jelajahi aktivitas di roadmap pribadimu
                    </span>
                </div>
                <p className="hero-quote">
                    “Skill hari ini,
                    <br />
                    keamanan yang lebih baik
                    <br />
                    untuk esok.”
                </p>
            </section>
            {!plan && <PlanForm plan={plan} today={today} />}
            <section className="dashboard-learning">
                <div>
                    <h2>{stats.lessons_completed} / 25 lesson selesai</h2>
                    <p>
                        Bacaan dan kuis lulus tersimpan terpisah dari checklist
                        mandiri.
                    </p>
                    <p>
                        Berikutnya:{" "}
                        {nextLesson?.title ||
                            "Semua lesson selesai. Baca ulang dan perdalam pemahamanmu."}
                    </p>
                </div>
                <Link
                    className="learning-button"
                    href={
                        nextLesson
                            ? `/learning/${nextLesson.slug}`
                            : "/learning"
                    }
                >
                    Lanjutkan lesson <ArrowRight size={16} />
                </Link>
            </section>
            <section className="dashboard-learning">
                <div>
                    <h2>
                        {stats.labs_solved} lab selesai · {stats.xp} XP
                    </h2>
                    <p>
                        {nextLab
                            ? `Tantangan berikutnya: ${nextLab.title}`
                            : "Tinjau katalog lab dan perbaikan secure."}
                    </p>
                </div>
                <Link
                    className="learning-button"
                    href={nextLab ? `/labs/${nextLab.slug}` : "/labs"}
                >
                    Buka lab <FlaskConical size={16} />
                </Link>
            </section>
            <div className="learning-panels">
                <section
                    className="resume-panel"
                    aria-labelledby="resume-title"
                >
                    <div className="panel-title">
                        <BookOpen size={21} />
                        <h2 id="resume-title">Lanjutkan Belajar</h2>
                        <span>Checklist mandiri</span>
                    </div>
                    <div className="resume-meter">
                        <div
                            role="progressbar"
                            aria-label="Progres checklist"
                            aria-valuenow={stats.percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        >
                            <span style={{ width: `${stats.percent}%` }} />
                        </div>
                        <strong>{stats.percent}%</strong>
                    </div>
                    <div className="resume-body">
                        <span className="resume-icon">
                            <BookOpen size={34} />
                        </span>
                        <div>
                            <h3>
                                {nextTask
                                    ? stats.completed
                                        ? nextTask.title
                                        : "Mulai dari HTTP"
                                    : plan
                                      ? "Semua checklist direview"
                                      : "Mulai perjalananmu"}
                            </h3>
                            <p>
                                {nextTask
                                    ? `Hari ${nextTask.day} · ${nextTask.title} · ${nextTask.minutes} menit`
                                    : "Pilih tanggal mulai dan buat rencana belajarmu."}
                            </p>
                        </div>
                        <Button asChild>
                            <Link href={nextUrl}>
                                Lanjutkan <ArrowRight size={16} />
                            </Link>
                        </Button>
                    </div>
                    <p className="resume-caption">
                        {stats.completed} dari {stats.total} checklist direview
                        · {stats.days_completed} dari {plan ? 90 : 0} hari
                        selesai
                    </p>
                </section>
                <section className="next-panel">
                    <h2>
                        Langkah Berikutnya <ChevronRight size={17} />
                    </h2>
                    {nextTwo.map((task, index) => (
                        <Link
                            href={`/roadmap?day=${task.day}#task-${task.id}`}
                            key={task.id}
                            className="next-step"
                        >
                            <span>{index + 1}</span>
                            <div>
                                <strong>{task.title}</strong>
                                <small>
                                    {task.status === "locked"
                                        ? "Setelah prasyarat selesai"
                                        : task.status === "in_progress"
                                          ? "Sedang dikerjakan"
                                          : "Siap dipelajari"}{" "}
                                    · {task.minutes} menit
                                </small>
                            </div>
                            <ChevronRight size={18} />
                        </Link>
                    ))}
                    {!nextTwo.length && (
                        <p className="muted">
                            {plan
                                ? "Semua aktivitas sudah direview. Buka roadmap untuk melihat kembali catatan perjalanan."
                                : "Buat rencana untuk melihat dua langkah pertamamu."}
                        </p>
                    )}
                </section>
            </div>
            <section className="quick-section">
                <h2>Akses Cepat</h2>
                <div className="quick-grid">
                    {[
                        {
                            title: "Mulai Roadmap",
                            copy: "Rencana 90 hari menuju pemahaman baru",
                            icon: Map,
                            color: "blue",
                            href: "/roadmap",
                        },
                        {
                            title: "Jelajahi Lab",
                            copy: "Latihan dummy di sandbox lokal",
                            href: "/labs",
                            icon: FlaskConical,
                            color: "teal",
                        },
                        {
                            title: "Lihat Modul",
                            copy: "25 lesson dan 50 soal interaktif",
                            href: "/learning",
                            icon: BookOpen,
                            color: "violet",
                        },
                        {
                            title: "Baca Catatan",
                            copy: "Pemahaman dan refleksi pribadimu",
                            href: "/notes",
                            icon: NotebookPen,
                            color: "amber",
                        },
                    ].map(({ title, copy, icon: Icon, color, href }) => {
                        const inner = (
                            <>
                                <span className={`quick-icon ${color}`}>
                                    <Icon size={25} />
                                </span>
                                <div>
                                    <h3>{title}</h3>
                                    <p>{copy}</p>
                                </div>
                                {href && <ChevronRight size={17} />}
                            </>
                        );
                        return href ? (
                            <Link
                                key={title}
                                href={href}
                                className="quick-tile"
                            >
                                {inner}
                            </Link>
                        ) : (
                            <div
                                key={title}
                                className="quick-tile deferred-tile"
                                aria-disabled="true"
                            >
                                {inner}
                            </div>
                        );
                    })}
                </div>
                <p className="quick-note">
                    Modul, lab, dan catatan terhubung dengan roadmap. Kelulusan
                    praktik memerlukan validasi sandbox.
                </p>
            </section>
            <div className="home-details">
                <section className="card today-plan">
                    <div className="section-heading">
                        <h2>
                            <CalendarDays size={18} /> Rencana hari ini
                        </h2>
                        <time dateTime={today.date}>{today.date}</time>
                    </div>
                    {today.day ? (
                        <>
                            <p className="muted">
                                Hari {today.day} · 20 menit teori / 70 praktik /
                                30 refleksi · {plan?.timezone}
                            </p>
                            {today.tasks.map((task) => (
                                <TaskRow key={task.id} task={task} />
                            ))}
                        </>
                    ) : (
                        <div className="empty-state">
                            <h3>
                                {!plan
                                    ? "Pilih tanggal mulai untuk belajar"
                                    : today.date < plan.starts_on
                                      ? "Rencanamu belum dimulai"
                                      : "Jadwal 90 hari sudah berakhir"}
                            </h3>
                            <p>
                                {plan
                                    ? `Jadwal ${plan.starts_on} sampai ${plan.ends_on}. Aktivitas tetap bisa dikerjakan dari roadmap.`
                                    : "Pilih tanggal mulai untuk membuat rencana."}
                            </p>
                            <Link href="/roadmap" className="text-link">
                                Buka roadmap <ArrowRight size={16} />
                            </Link>
                        </div>
                    )}
                </section>
                <section className="card activity-card">
                    <h2>Aktivitas terakhir</h2>
                    {activities.length ? (
                        <ol className="activity-list">
                            {activities.map((activity) => (
                                <li key={activity.id}>
                                    <CheckCircle2 size={18} />
                                    <div>
                                        <strong>
                                            {activity.type ===
                                            "checklist_reviewed"
                                                ? "Checklist direview"
                                                : activity.type ===
                                                    "lesson_completed"
                                                  ? "Lesson selesai"
                                                  : activity.type ===
                                                      "lesson_read"
                                                    ? "Lesson dibaca"
                                                    : activity.type ===
                                                        "lab_solved"
                                                      ? "Lab selesai terverifikasi"
                                                      : "Memulai checklist"}
                                        </strong>
                                        <p>{activity.title}</p>
                                        <time dateTime={activity.at}>
                                            {new Intl.DateTimeFormat("id-ID", {
                                                dateStyle: "medium",
                                                timeZone:
                                                    plan?.timezone ||
                                                    "Asia/Jakarta",
                                            }).format(new Date(activity.at))}
                                        </time>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <div className="empty-state">
                            <Map size={28} />
                            <h3>Perjalanan dimulai dari sini</h3>
                            <p>
                                Langkah kecil pertamamu akan tercatat di sini.
                                Mulai aktivitas, lalu tandai setelah direview.
                            </p>
                        </div>
                    )}
                    <p className="evidence-note">
                        Checklist menunjukkan aktivitas mandiri. XP, kuis, lab,
                        dan menit terverifikasi belum dihitung.
                    </p>
                </section>
            </div>
            {!!legacyProgress.length && (
                <details className="card legacy-progress">
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
        </AppShell>
    );
}
