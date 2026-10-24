import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import {
    ArrowRight,
    BookOpen,
    Search,
    ShieldCheck,
    Clock3,
} from "lucide-react";
import AppShell from "../components/AppShell";
import type { Course } from "../learning";
export default function Learning({ courses }: { courses: Course[] }) {
    const [search, setSearch] = useState("");
    const shown = courses.filter((c) =>
        [c.title, c.description, ...c.lessons.map((l) => l.title)]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase()),
    );
    return (
        <AppShell title="Modul pembelajaran">
            <Head title="Modul" />
            <section className="learning-banner">
                <div>
                    <span className="eyebrow">AKADEMI KEAMANAN WEB</span>
                    <h1>Rasa ingin tahu. Jadi pemahaman.</h1>
                    <p>
                        Sepuluh jalur belajar, langkah kecil yang bermakna.
                        Baca, uji pemahaman, dan simpan penemuanmu.
                    </p>
                    <span className="learning-badge">
                        25 lesson · 50 soal · Bahasa Indonesia
                    </span>
                </div>
                <div className="academy-emblem" aria-hidden="true">
                    <ShieldCheck size={100} />
                    <span>Belajar dengan tujuan</span>
                </div>
            </section>
            <div className="catalog-heading">
                <div>
                    <h2>Pilih perjalanan belajarmu</h2>
                    <p className="muted">
                        {courses.reduce((n, c) => n + c.completed, 0)} dari 25
                        lesson selesai · bacaan + kuis lulus
                    </p>
                </div>
                <label className="workspace-search">
                    <Search size={18} />
                    <input
                        aria-label="Cari modul"
                        placeholder="Cari topik atau lesson…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </label>
            </div>
            <div className="course-grid">
                {shown.map((c, index) => (
                    <article className="course-card" key={c.id}>
                        <div
                            className={`course-icon course-color-${index % 3}`}
                        >
                            <BookOpen size={24} />
                            <span>{String(c.id).padStart(2, "0")}</span>
                        </div>
                        <span className="learning-badge">{c.difficulty}</span>
                        <h2>{c.title}</h2>
                        <p>{c.description}</p>
                        <div className="course-meta">
                            <span>
                                {c.lessons.length} lesson ·{" "}
                                {c.lessons.length * 2} soal
                            </span>
                            <span>
                                <Clock3 size={14} />
                                {c.minutes} menit
                            </span>
                        </div>
                        <progress
                            aria-label={`Progres ${c.title}`}
                            value={c.completed}
                            max={c.lessons.length}
                        />
                        <small>
                            {c.completed}/{c.lessons.length} selesai
                        </small>
                        <details>
                            <summary>Tujuan, prasyarat & sumber</summary>
                            <ul>
                                {c.outcomes.map((o) => (
                                    <li key={o}>{o}</li>
                                ))}
                            </ul>
                            <h3>Prasyarat</h3>
                            {c.prerequisites.length ? (
                                c.prerequisites.map((p) => (
                                    <Link
                                        className="source-link"
                                        key={p.id}
                                        href={`/learning/${p.slug}`}
                                    >
                                        {p.title}
                                    </Link>
                                ))
                            ) : (
                                <p>Tidak ada. Mulai dari lesson pertama.</p>
                            )}
                            <h3>Referensi primer</h3>
                            {c.sources.map((s) => (
                                <a
                                    key={s.url}
                                    className="source-link"
                                    href={s.url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {s.title} ↗
                                </a>
                            ))}
                        </details>
                        <Link
                            className="learning-button"
                            href={`/learning/${(c.lessons.find((l) => !l.completed && !l.locked) || c.lessons[0]).slug}`}
                        >
                            {c.completed === c.lessons.length
                                ? "Baca kembali"
                                : "Jelajahi modul"}
                            <ArrowRight size={16} />
                        </Link>
                    </article>
                ))}
            </div>
            {!shown.length && (
                <div className="empty-state">
                    <h2>Topik belum ditemukan</h2>
                    <button onClick={() => setSearch("")}>
                        Bersihkan pencarian
                    </button>
                </div>
            )}
            <p className="editorial-note">
                Konten adalah draft pembelajaran berbasis referensi primer,
                belum ditinjau pakar independen. Kelulusan kuis bukan bukti
                penguasaan praktik.
            </p>
        </AppShell>
    );
}
