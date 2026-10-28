import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import { ArrowRight, BookOpen, Clock3, Search } from "lucide-react";
import AppShell from "../components/AppShell";
import type { Course } from "../learning";
import "../../css/v8-learning-labs.css";

export default function Learning({ courses }: { courses: Course[] }) {
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState("Semua");
    const totalLessons = courses.reduce((n, c) => n + c.lessons.length, 0);
    const completed = courses.reduce((n, c) => n + c.completed, 0);
    const levels = [...new Set(courses.map((c) => c.difficulty))];
    const shown = courses.filter(
        (c) =>
            (difficulty === "Semua" || c.difficulty === difficulty) &&
            [c.title, c.description, ...c.lessons.map((l) => l.title)]
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase()),
    );
    return (
        <AppShell title="Modul pembelajaran">
            <Head title="Modul" />
            <div className="v8-learning-catalog">
                <header className="v8-catalog-heading">
                    <div>
                        <span className="eyebrow">Learning Modules</span>
                        <h1>Belajar yang benar-benar dipahami.</h1>
                        <p>
                            Penjelasan, contoh teknis, cek pemahaman, lalu
                            praktik.
                        </p>
                    </div>
                    <span className="v8-catalog-summary">
                        {completed} / {totalLessons} lesson selesai
                    </span>
                </header>
                <div className="v8-catalog-controls">
                    <label className="workspace-search">
                        <Search size={18} aria-hidden="true" />
                        <input
                            aria-label="Cari modul"
                            placeholder="Cari topik atau lesson…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </label>
                    <label className="v8-filter-label">
                        Tingkat
                        <select
                            aria-label="Tingkat modul"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option>Semua</option>
                            {levels.map((level) => (
                                <option key={level}>{level}</option>
                            ))}
                        </select>
                    </label>
                    <span className="v8-result-count">
                        {shown.length} jalur belajar
                    </span>
                </div>
                <div className="course-grid v8-course-grid">
                    {shown.map((c) => {
                        const next =
                            c.lessons.find((l) => !l.completed && !l.locked) ||
                            c.lessons[0];
                        return (
                            <article
                                className="course-card v8-course-card"
                                key={c.id}
                            >
                                <div className="v8-card-top">
                                    <span className="v8-tile-icon">
                                        <BookOpen
                                            size={20}
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <span className="learning-badge">
                                        {c.difficulty}
                                    </span>
                                </div>
                                <span className="v8-card-kicker">
                                    Jalur belajar
                                </span>
                                <h2>{c.title}</h2>
                                <p>{c.description}</p>
                                <div className="course-meta">
                                    <span>{c.lessons.length} lesson</span>
                                    <span>
                                        <Clock3 size={14} /> {c.minutes} menit
                                    </span>
                                </div>
                                <progress
                                    aria-label={`Progres ${c.title}`}
                                    value={c.completed}
                                    max={Math.max(c.lessons.length, 1)}
                                />
                                <small>
                                    {c.completed}/{c.lessons.length} selesai
                                </small>
                                <details>
                                    <summary>
                                        Tujuan, prasyarat &amp; sumber
                                    </summary>
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
                                        <p>
                                            Tidak ada. Mulai dari lesson
                                            pertama.
                                        </p>
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
                                {next ? (
                                    <Link
                                        className="learning-button"
                                        href={`/learning/${next.slug}`}
                                    >
                                        {c.completed === c.lessons.length
                                            ? "Baca kembali"
                                            : "Jelajahi modul"}
                                        <ArrowRight size={16} />
                                    </Link>
                                ) : (
                                    <p className="v8-empty-course">
                                        Lesson belum tersedia.
                                    </p>
                                )}
                            </article>
                        );
                    })}
                </div>
                {!shown.length && (
                    <div className="empty-state">
                        <h2>Topik belum ditemukan</h2>
                        <button
                            onClick={() => {
                                setSearch("");
                                setDifficulty("Semua");
                            }}
                        >
                            Bersihkan pencarian
                        </button>
                    </div>
                )}
                <p className="editorial-note">
                    Konten adalah draft pembelajaran berbasis referensi primer,
                    belum ditinjau pakar independen. Kelulusan kuis bukan bukti
                    penguasaan praktik.
                </p>
            </div>
        </AppShell>
    );
}
