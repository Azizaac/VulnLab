import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import {
    FlaskConical,
    ArrowRight,
    Search,
    ShieldCheck,
    Clock3,
    CheckCircle2,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { difficultyLabel, labStatus, type LabCard } from "../labs";
import "../../css/v8-learning-labs.css";
export default function Labs({ labs }: { labs: LabCard[] }) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("Semua");
    const [difficulty, setDifficulty] = useState("Semua");
    const [status, setStatus] = useState("Semua");
    const shown = labs.filter(
        (l) =>
            (category === "Semua" || l.category === category) &&
            (difficulty === "Semua" || l.difficulty === difficulty) &&
            (status === "Semua" || l.status === status) &&
            [l.title, l.category, l.code, ...l.objectives]
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase()),
    );
    return (
        <AppShell title="Laboratorium keamanan">
            <Head title="Lab Praktik" />
            <div className="v8-lab-catalog">
                <header className="v8-catalog-heading">
                    <div>
                        <span className="eyebrow">Guided Labs · Lokal</span>
                        <h1>Belajar dengan membuktikan.</h1>
                        <p>
                            Latihan terisolasi, instruksi bertahap, dan
                            perbaikan yang dapat dipelajari.
                        </p>
                    </div>
                    <span className="v8-catalog-summary">
                        {labs.filter((l) => l.status === "solved").length} /{" "}
                        {labs.length} lab selesai
                    </span>
                </header>
                <div className="catalog-heading">
                    <h2>Temukan tantanganmu</h2>
                    <label className="workspace-search">
                        <Search size={17} />
                        <input
                            aria-label="Cari lab"
                            placeholder="Cari lab, konsep, atau ID…"
                            maxLength={100}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </label>
                </div>
                <div className="lab-filters">
                    <label>
                        Kategori
                        <select
                            aria-label="Kategori"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {[
                                "Semua",
                                "Web Security",
                                "Authentication",
                                "Access Control",
                                "API Security",
                                "Injection",
                                "Business Logic",
                            ].map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Tingkat kesulitan
                        <select
                            aria-label="Tingkat kesulitan"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="Semua">Semua</option>
                            {Object.entries(difficultyLabel).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Status lab
                        <select
                            aria-label="Status lab"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="Semua">Semua</option>
                            {Object.entries(labStatus).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </label>
                    <span>{shown.length} lab ditemukan</span>
                </div>
                <div className="course-grid lab-grid v8-course-grid">
                    {shown.map((l) => (
                        <article
                            className="course-card v8-course-card"
                            key={l.id}
                        >
                            <div className="lab-card-top">
                                <span className="lab-card-icon">
                                    {l.status === "solved" ? (
                                        <CheckCircle2 size={23} />
                                    ) : (
                                        <FlaskConical size={23} />
                                    )}
                                </span>
                                <span className="muted">{l.code}</span>
                                <span
                                    className={`difficulty difficulty-${l.difficulty}`}
                                >
                                    {difficultyLabel[l.difficulty]}
                                </span>
                            </div>
                            <span className="learning-badge">{l.category}</span>
                            <h2>{l.title}</h2>
                            <p>{l.objectives[0]}</p>
                            <div className="course-meta">
                                <span>
                                    <Clock3 size={14} />
                                    {l.minutes} menit
                                </span>
                                <span>{l.points} XP · sekali</span>
                            </div>
                            <p className="lab-card-progress">
                                {labStatus[l.status]}
                                {l.solved_at && (
                                    <>
                                        {" "}
                                        ·{" "}
                                        {new Date(
                                            l.solved_at,
                                        ).toLocaleDateString("id-ID")}{" "}
                                        · {l.earned_xp} XP
                                    </>
                                )}
                            </p>
                            <details>
                                <summary>Tujuan & bekal awal</summary>
                                <ul>
                                    {l.objectives.map((o) => (
                                        <li key={o}>{o}</li>
                                    ))}
                                </ul>
                                <p>Disarankan membaca:</p>
                                <Link
                                    className="source-link"
                                    href={`/learning/${l.lesson.slug}`}
                                >
                                    {l.lesson.title}
                                </Link>
                            </details>
                            <Link
                                className="learning-button"
                                href={`/labs/${l.slug}`}
                            >
                                {!l.available
                                    ? "Lihat instruksi"
                                    : l.status === "solved"
                                      ? "Tinjau lab"
                                      : l.status === "in_progress"
                                        ? "Lanjutkan Lab"
                                        : "Mulai Lab"}
                                <ArrowRight size={16} />
                            </Link>
                            {!l.available && (
                                <small>
                                    Instruksi tersedia. Sandbox belum aktif.
                                </small>
                            )}
                        </article>
                    ))}
                </div>
                {!shown.length && (
                    <div className="empty-state">
                        <h2>Tidak ada lab yang cocok</h2>
                        <button
                            onClick={() => {
                                setSearch("");
                                setCategory("Semua");
                                setDifficulty("Semua");
                                setStatus("Semua");
                            }}
                        >
                            Bersihkan filter
                        </button>
                    </div>
                )}
                <p className="editorial-note">
                    <ShieldCheck size={15} /> Pengujian hanya memakai sandbox
                    lokal dan akun dummy. Konten disusun dari referensi primer,
                    belum ditinjau pakar independen.
                </p>
            </div>
        </AppShell>
    );
}
