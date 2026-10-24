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
function LabArt() {
    return (
        <svg
            className="lab-art"
            viewBox="0 0 320 170"
            fill="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient
                    id="labGlow"
                    x1="70"
                    y1="140"
                    x2="260"
                    y2="30"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#03d5d5" />
                    <stop offset="1" stopColor="#8460ff" />
                </linearGradient>
            </defs>
            <path d="M10 155 88 40l43 68 52-89 126 136Z" fill="#132b58" />
            <path d="m85 155 98-136 126 136Z" fill="#1f3f72" />
            <path d="m154 61 29-42 36 49-32-13-17 12Z" fill="#70c9f4" />
            <path
                d="M45 155c110-12 102-32 130-45 30-15 17-36 34-43"
                stroke="url(#labGlow)"
                strokeWidth="5"
            />
            <path
                d="M187 20V1m0 0 29 5-29 8"
                stroke="#ac8aff"
                strokeWidth="3"
            />
            <circle cx="59" cy="31" r="2" fill="#9aefff" />
            <circle cx="258" cy="20" r="2" fill="#9aefff" />
            <circle cx="32" cy="79" r="1" fill="#9aefff" />
        </svg>
    );
}
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
    const featured =
        labs.find((l) => l.status !== "solved" && l.available) || labs[0];
    return (
        <AppShell title="Laboratorium keamanan">
            <Head title="Lab Praktik" />
            <section className="lab-catalog-hero">
                <div>
                    <span className="eyebrow">VULNSHOP · LAB LOKAL</span>
                    <h1>Belajar. Uji. Pahami.</h1>
                    <p>
                        Temukan celah pada data dummy, telusuri penyebabnya, dan
                        pelajari perbaikannya.
                    </p>
                    <span className="learning-badge">
                        {labs.filter((l) => l.status === "solved").length} /{" "}
                        {labs.length} lab selesai
                    </span>
                </div>
                <LabArt />
            </section>
            {featured && (
                <section className="featured-lab">
                    <span className="lab-feature-icon">
                        <FlaskConical size={28} />
                    </span>
                    <div>
                        <span className="eyebrow">LAB PILIHAN</span>
                        <h2>{featured.title}</h2>
                        <p>{featured.objectives[0]}</p>
                    </div>
                    <Link
                        className="learning-button"
                        href={`/labs/${featured.slug}`}
                    >
                        {featured.status === "in_progress"
                            ? "Lanjutkan Lab"
                            : "Jelajahi tantangan"}
                        <ArrowRight size={16} />
                    </Link>
                </section>
            )}
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
            <div className="course-grid lab-grid">
                {shown.map((l) => (
                    <article className="course-card" key={l.id}>
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
                                    {new Date(l.solved_at).toLocaleDateString(
                                        "id-ID",
                                    )}{" "}
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
                            {l.status === "solved"
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
                <ShieldCheck size={15} /> Pengujian hanya memakai sandbox lokal
                dan akun dummy. Konten disusun dari referensi primer, belum
                ditinjau pakar independen.
            </p>
        </AppShell>
    );
}
