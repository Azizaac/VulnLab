import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import {
    FlaskConical,
    ArrowRight,
    Search,
    ShieldCheck,
    Clock3,
    CheckCircle2,
    Sparkles,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { difficultyLabel, labStatus, type LabCard } from "../labs";
import "../../css/v8-learning-labs.css";

export default function Labs({ labs }: { labs: LabCard[] }) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("Semua");
    const [difficulty, setDifficulty] = useState("Semua");
    const [status, setStatus] = useState("Semua");
    const [availability, setAvailability] = useState("Semua");

    const playableCount = labs.filter((l) => l.available).length;
    const solvedCount = labs.filter((l) => l.status === "solved").length;
    const recommended =
        labs.find((l) => l.available && l.status === "in_progress") ||
        labs.find((l) => l.available && l.status === "not_started") ||
        null;

    const shown = labs.filter(
        (l) =>
            (category === "Semua" || l.category === category) &&
            (difficulty === "Semua" || l.difficulty === difficulty) &&
            (status === "Semua" || l.status === status) &&
            (availability === "Semua" ||
                (availability === "Playable" ? l.available : !l.available)) &&
            [l.title, l.category, l.code, ...l.objectives]
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase()),
    );
    const categories = [
        "Semua",
        ...Array.from(
            new Set([
                "Web Security",
                "Authentication",
                "Access Control",
                "API Security",
                "Injection",
                "Business Logic",
                ...labs.map((l) => l.category),
            ]),
        ),
    ];

    return (
        <AppShell title="Laboratorium keamanan">
            <Head title="Lab Praktik" />
            <div className="v8-lab-catalog v9-catalog-page">
                <header className="v8-catalog-heading v9-catalog-banner">
                    <div>
                        <span className="eyebrow">
                            GUIDED LABS · SANDBOX LOKAL TERISOLASI
                        </span>
                        <h1>Belajar dengan membuktikan.</h1>
                        <p>
                            Latihan terisolasi dengan perbandingan mode
                            vulnerable vs secure, bukti sesi server, dan
                            mitigasi kode.
                        </p>
                    </div>
                    <div className="v9-catalog-pills">
                        <span className="v9-stat-chip teal">
                            <FlaskConical size={15} aria-hidden="true" />
                            {playableCount} playable lokal
                            {labs.length > playableCount
                                ? ` · ${labs.length} di katalog`
                                : ""}
                        </span>
                        <span className="v8-catalog-summary">
                            {solvedCount} / {labs.length} lab selesai
                        </span>
                    </div>
                </header>

                {recommended &&
                    !search &&
                    category === "Semua" &&
                    difficulty === "Semua" &&
                    status === "Semua" &&
                    availability === "Semua" && (
                        <section
                            className="v9-featured-lab"
                            aria-label="Rekomendasi lab berikutnya"
                        >
                            <div className="v9-featured-copy">
                                <span className="v9-featured-kicker">
                                    <Sparkles size={14} aria-hidden="true" />{" "}
                                    REKOMENDASI PRAKTIK BERIKUTNYA ·{" "}
                                    {recommended.code}
                                </span>
                                <h2>{recommended.title}</h2>
                                <p>{recommended.objectives[0]}</p>
                                <div className="course-meta">
                                    <span
                                        className={`difficulty difficulty-${recommended.difficulty}`}
                                    >
                                        {
                                            difficultyLabel[
                                                recommended.difficulty
                                            ]
                                        }
                                    </span>
                                    <span>{recommended.category}</span>
                                    <span>
                                        <Clock3 size={14} />{" "}
                                        {recommended.minutes} menit
                                    </span>
                                    <span>
                                        {recommended.points} XP · sekali
                                    </span>
                                </div>
                            </div>
                            <Link
                                className="learning-button"
                                href={`/labs/${recommended.slug}`}
                            >
                                {recommended.status === "in_progress"
                                    ? "Lanjutkan Lab"
                                    : "Mulai Lab Sekarang"}
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
                <div className="lab-filters v9-lab-filters">
                    <label>
                        Kategori
                        <select
                            aria-label="Kategori"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {categories.map((c) => (
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
                    <label>
                        Ketersediaan
                        <select
                            aria-label="Ketersediaan"
                            value={availability}
                            onChange={(e) => setAvailability(e.target.value)}
                        >
                            <option value="Semua">Semua</option>
                            <option value="Playable">Playable lokal</option>
                            <option value="Unavailable">
                                Segera hadir / nonaktif
                            </option>
                        </select>
                    </label>
                    <span>{shown.length} lab ditemukan</span>
                </div>
                <div className="course-grid lab-grid v8-course-grid">
                    {shown.map((l) => (
                        <article
                            className={`course-card v8-course-card v9-lab-card ${l.status === "solved" ? "is-solved" : ""} ${!l.available ? "is-unavailable" : ""}`}
                            key={l.id}
                        >
                            <div className="lab-card-top">
                                <span
                                    className={`lab-card-icon ${l.status === "solved" ? "solved" : ""}`}
                                >
                                    {l.status === "solved" ? (
                                        <CheckCircle2 size={21} />
                                    ) : (
                                        <FlaskConical size={21} />
                                    )}
                                </span>
                                <span className="v9-lab-code">{l.code}</span>
                                <span
                                    className={`difficulty difficulty-${l.difficulty}`}
                                >
                                    {difficultyLabel[l.difficulty]}
                                </span>
                            </div>
                            <div className="v9-lab-badges">
                                <span className="learning-badge">
                                    {l.category}
                                </span>
                                <span
                                    className={`v9-runtime-pill ${l.available ? "ready" : "pending"}`}
                                >
                                    {l.available
                                        ? "● Playable lokal"
                                        : "◌ Belum aktif"}
                                </span>
                            </div>
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
                                <summary>Tujuan &amp; bekal awal</summary>
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
                                    Coming soon (belum diverifikasi di runtime
                                    lokal).
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
                                setAvailability("Semua");
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
