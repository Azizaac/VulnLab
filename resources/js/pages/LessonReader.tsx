import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import {
    BookOpen,
    CheckCircle2,
    Circle,
    LockKeyhole,
    ChevronLeft,
    ChevronRight,
    NotebookPen,
    ShieldCheck,
    Copy,
} from "lucide-react";
import AppShell from "../components/AppShell";
import SafeMarkdown from "../components/SafeMarkdown";
import {
    QuizResultPanel,
    normalizeLaravelError,
    focusFirstError,
} from "../feedback";
import {
    requestJson,
    type Course,
    type Source,
    type Attempt,
} from "../learning";
type Lesson = {
    id: number;
    slug: string;
    title: string;
    html: string;
    minutes: number;
    enrichment: {
        objectives: string[];
        technical: string;
        mistakes: string[];
        classification: string;
        updated_at: string;
    };
    sources: Source[];
    labs: {
        id: number;
        title: string;
        goal: string;
        slug: string | null;
        available: boolean;
        solved: boolean;
    }[];
    authored_at: string;
    reviewed_at: string | null;
};
type Question = {
    id: number;
    question: string;
    choices: { id: number; text: string }[];
};
export default function LessonReader(props: {
    quiz_context: string;
    passing_score: number;
    courses: Course[];
    lesson: Lesson;
    questions: Question[];
    attempts: Attempt[];
    exampleHtml: string;
}) {
    return <Reader key={props.lesson.id} {...props} />;
}
function Reader({
    quiz_context,
    passing_score,
    courses,
    lesson,
    questions,
    attempts: initialAttempts,
    exampleHtml,
}: {
    quiz_context: string;
    passing_score: number;
    courses: Course[];
    lesson: Lesson;
    questions: Question[];
    attempts: Attempt[];
    exampleHtml: string;
}) {
    const all = courses.flatMap((c) => c.lessons).sort((a, b) => a.id - b.id);
    const current = all.find((l) => l.id === lesson.id)!;
    const course = courses.find((c) =>
        c.lessons.some((l) => l.id === lesson.id),
    )!;
    const index = all.findIndex((l) => l.id === lesson.id);
    const [tab, setTab] = useState("Materi");
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [attempts, setAttempts] = useState(initialAttempts);
    const [result, setResult] = useState<Attempt | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [submission, setSubmission] = useState(() => crypto.randomUUID());
    const codes = new DOMParser()
        .parseFromString(exampleHtml || lesson.html, "text/html")
        .querySelectorAll("pre");
    const codeHtml = Array.from(codes)
        .map((c) => c.outerHTML)
        .join("");
    async function grade() {
        setBusy(true);
        setError("");
        try {
            const a = await requestJson<Attempt>(
                `/learning/${lesson.slug}/quiz`,
                "POST",
                {
                    submission_id: submission,
                    quiz_context,
                    answers: questions.map((q) => ({
                        question_id: q.id,
                        choice_id: answers[q.id],
                    })),
                },
            );
            setResult(a);
            setAttempts((prev) =>
                [a, ...prev.filter((x) => x.id !== a.id)].slice(0, 20),
            );
            router.reload({ only: ["courses"] });
        } catch (e) {
            const failure = normalizeLaravelError(e);
            setError(`${failure.title} — ${failure.message}`);
            focusFirstError(failure.errors);
        } finally {
            setBusy(false);
        }
    }
    function read() {
        setError("");
        router.post(
            `/learning/${lesson.slug}/read`,
            {},
            {
                preserveScroll: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
                onError: (errors) => setError(Object.values(errors).join(" ")),
            },
        );
    }
    const outline = (
        <>
            <div className="outline-heading">
                <BookOpen size={20} />
                <strong>Perjalanan belajarmu</strong>
            </div>
            <p className="muted">
                {all.filter((l) => l.completed).length} / {all.length} lesson
                selesai
            </p>
            <progress
                aria-label="Progres seluruh lesson"
                value={all.filter((l) => l.completed).length}
                max={all.length}
            />
            {courses.map((c, i) => (
                <details key={c.id} open={c.id === course.id}>
                    <summary>
                        <span className="outline-number">{i + 1}</span>
                        <span>{c.title}</span>
                        <small>
                            {c.completed}/{c.lessons.length}
                        </small>
                    </summary>
                    <div className="outline-lessons">
                        {c.lessons.map((l) => (
                            <Link
                                key={l.id}
                                href={`/learning/${l.slug}`}
                                aria-current={
                                    l.id === lesson.id ? "page" : undefined
                                }
                            >
                                {l.completed ? (
                                    <CheckCircle2 size={16} />
                                ) : l.locked ? (
                                    <LockKeyhole size={16} />
                                ) : (
                                    <Circle size={16} />
                                )}
                                <span>
                                    {l.title}
                                    <small>
                                        {l.minutes} menit ·{" "}
                                        {l.completed
                                            ? "Selesai"
                                            : l.read
                                              ? "Bacaan selesai"
                                              : l.locked
                                                ? "Prasyarat belum selesai"
                                                : "Siap dibaca"}
                                    </small>
                                </span>
                            </Link>
                        ))}
                    </div>
                </details>
            ))}
        </>
    );
    const refs = (
        <>
            <h3>Sumber Terpercaya</h3>
            {lesson.sources.map((s) => (
                <a
                    className="reference-item"
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                >
                    <ShieldCheck size={22} />
                    <span>
                        {s.title}
                        <small>Dokumentasi primer ↗</small>
                    </span>
                </a>
            ))}
            <h3>Klasifikasi</h3>
            <span className="learning-badge">
                {lesson.enrichment.classification}
            </span>
            <h3>Praktik terkait</h3>
            {lesson.labs.length ? (
                lesson.labs.map((l) => (
                    <details key={l.id} id={`lab-spec-${l.id}`}>
                        <summary>{l.title}</summary>
                        <p>{l.goal}</p>
                        {l.slug ? (
                            <Link
                                className="source-link"
                                href={`/labs/${l.slug}`}
                            >
                                {l.solved
                                    ? "✓ Lab selesai terverifikasi · tinjau kembali"
                                    : l.available
                                      ? "Buka lab interaktif"
                                      : "Lihat instruksi · sandbox belum aktif"}
                            </Link>
                        ) : (
                            <p>
                                Spesifikasi tersimpan. Belum ada runtime
                                interaktif untuk topik ini.
                            </p>
                        )}
                    </details>
                ))
            ) : (
                <p>
                    Gunakan pengamatan lokal yang dijelaskan pada materi. Belum
                    ada lab khusus.
                </p>
            )}
            <Link className="note-shortcut" href={`/notes?lesson=${lesson.id}`}>
                <NotebookPen size={20} />
                Catat pemahamanmu
            </Link>
            <div className="editorial-note">
                <strong>Draft · belum ditinjau pakar</strong>
                <p>
                    Disusun {lesson.authored_at}. Pelengkap{" "}
                    {lesson.enrichment.updated_at}.
                </p>
                <p>
                    Review independen: {lesson.reviewed_at || "belum dilakukan"}
                    .
                </p>
            </div>
        </>
    );
    return (
        <AppShell title={lesson.title}>
            <Head title={lesson.title} />
            <div className="reader-layout">
                <aside
                    className="reader-outline desktop-rail"
                    aria-label="Daftar lesson"
                >
                    {outline}
                </aside>
                <div className="reader-center">
                    <details className="mobile-rail">
                        <summary>Daftar lesson & progres</summary>
                        {outline}
                    </details>
                    <nav className="lesson-breadcrumb" aria-label="Breadcrumb">
                        <Link href="/learning">Modul</Link>
                        <ChevronRight size={12} />
                        <span>{course.title}</span>
                    </nav>
                    <div className="lesson-title">
                        <span className="lesson-mark">
                            <BookOpen size={21} />
                        </span>
                        <h1>{lesson.title}</h1>
                    </div>
                    <div className="lesson-facts">
                        <span>{lesson.minutes} menit</span>
                        <span className="learning-badge">Pemula</span>
                        <span>
                            {current.completed
                                ? "Bacaan & kuis selesai"
                                : current.read
                                  ? "Sudah dibaca"
                                  : "Belum dibaca"}
                        </span>
                    </div>
                    {current.locked && (
                        <div className="prerequisite-callout">
                            <LockKeyhole size={18} />
                            <div>
                                Materi boleh dipratinjau. Untuk mencatat
                                progres, selesaikan:
                                {current.prerequisites.map((p) => (
                                    <Link
                                        key={p.id}
                                        href={`/learning/${p.slug}`}
                                    >
                                        {p.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                    <div
                        className="lesson-tabs"
                        role="tablist"
                        aria-label="Isi lesson"
                    >
                        {["Materi", "Contoh Kode", "Referensi", "Kuis"].map(
                            (t) => (
                                <button
                                    key={t}
                                    id={`tab-${t.replace(" ", "-")}`}
                                    role="tab"
                                    aria-selected={tab === t}
                                    tabIndex={tab === t ? 0 : -1}
                                    aria-controls="lesson-panel"
                                    onClick={() => setTab(t)}
                                    onKeyDown={(event) => {
                                        const tabs = [
                                            "Materi",
                                            "Contoh Kode",
                                            "Referensi",
                                            "Kuis",
                                        ];
                                        const position = tabs.indexOf(t);
                                        const next =
                                            event.key === "ArrowRight"
                                                ? (position + 1) % tabs.length
                                                : event.key === "ArrowLeft"
                                                  ? (position +
                                                        tabs.length -
                                                        1) %
                                                    tabs.length
                                                  : event.key === "Home"
                                                    ? 0
                                                    : event.key === "End"
                                                      ? tabs.length - 1
                                                      : null;
                                        if (next !== null) {
                                            event.preventDefault();
                                            setTab(tabs[next]);
                                            document
                                                .getElementById(
                                                    `tab-${tabs[next].replace(" ", "-")}`,
                                                )
                                                ?.focus();
                                        }
                                    }}
                                >
                                    {t}
                                </button>
                            ),
                        )}
                    </div>
                    <section
                        id="lesson-panel"
                        role="tabpanel"
                        aria-labelledby={`tab-${tab.replace(" ", "-")}`}
                    >
                        {tab === "Materi" && (
                            <>
                                <section className="objectives">
                                    <h2>Yang akan kamu pelajari</h2>
                                    <ul>
                                        {lesson.enrichment.objectives.map(
                                            (o) => (
                                                <li key={o}>{o}</li>
                                            ),
                                        )}
                                    </ul>
                                    <p>
                                        <strong>Bekal awal:</strong>{" "}
                                        {current.prerequisites.length
                                            ? current.prerequisites
                                                  .map((p) => p.title)
                                                  .join(", ")
                                            : "Tidak ada. Cukup browser dan rasa ingin tahu."}
                                    </p>
                                </section>
                                <SafeMarkdown html={lesson.html} />
                                <section className="technical-note">
                                    <h2>Di balik konsep</h2>
                                    <p>{lesson.enrichment.technical}</p>
                                    <h3>Kesalahan yang sering terjadi</h3>
                                    <ul>
                                        {lesson.enrichment.mistakes.map((m) => (
                                            <li key={m}>{m}</li>
                                        ))}
                                    </ul>
                                </section>
                                <button
                                    className="learning-button"
                                    disabled={
                                        busy || current.locked || current.read
                                    }
                                    onClick={read}
                                >
                                    <CheckCircle2 size={17} />
                                    {current.read
                                        ? "Bacaan tersimpan"
                                        : "Tandai sudah dibaca"}
                                </button>
                            </>
                        )}
                        {tab === "Contoh Kode" && (
                            <>
                                <h2>Contoh request & kode</h2>
                                <p>
                                    Data fiktif untuk latihan lokal. Baca
                                    konteks dan perbaikan pada tab Materi.
                                </p>
                                <div className="code-toolbar">
                                    <span>CONTOH LATIHAN</span>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(
                                                    Array.from(codes)
                                                        .map(
                                                            (c) =>
                                                                c.textContent,
                                                        )
                                                        .join("\n"),
                                                );
                                                setCopied(true);
                                            } catch {
                                                setError(
                                                    "Penyalinan ditolak browser. Pilih teks kode secara manual.",
                                                );
                                            }
                                        }}
                                    >
                                        <Copy size={14} />
                                        {copied ? "Tersalin" : "Salin"}
                                    </button>
                                </div>
                                <SafeMarkdown
                                    html={
                                        codeHtml ||
                                        "<p>Lesson ini berfokus pada metodologi. Lihat contoh dalam materi.</p>"
                                    }
                                />
                            </>
                        )}
                        {tab === "Referensi" && (
                            <div className="reader-references">{refs}</div>
                        )}
                        {tab === "Kuis" && (
                            <div className="quiz-panel">
                                <h2>Cek pemahamanmu</h2>
                                <p>
                                    {questions.length} soal · ambang lulus{" "}
                                    {passing_score}%. Boleh mencoba ulang. Hasil
                                    bukan bukti lab selesai atau skill
                                    terverifikasi.
                                </p>
                                {!questions.length && (
                                    <p className="v5-note">
                                        Bank kuis belum diterbitkan. Bacaan
                                        tetap tersedia; penyelesaian kuis
                                        menunggu materi penilaian.
                                    </p>
                                )}
                                {!current.read && (
                                    <p className="prerequisite-callout">
                                        Baca materi dan tandai sudah dibaca
                                        terlebih dahulu.
                                    </p>
                                )}
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        void grade();
                                    }}
                                >
                                    {questions.map((q, i) => (
                                        <fieldset
                                            disabled={
                                                busy ||
                                                !!result ||
                                                !current.read ||
                                                current.locked
                                            }
                                            key={q.id}
                                        >
                                            <legend>
                                                {i + 1}. {q.question}
                                            </legend>
                                            {q.choices.map((c) => (
                                                <label key={c.id}>
                                                    <input
                                                        type="radio"
                                                        name={`question-${q.id}`}
                                                        required
                                                        value={c.id}
                                                        checked={
                                                            answers[q.id] ===
                                                            c.id
                                                        }
                                                        onChange={() => {
                                                            setAnswers({
                                                                ...answers,
                                                                [q.id]: c.id,
                                                            });
                                                            setSubmission(
                                                                crypto.randomUUID(),
                                                            );
                                                        }}
                                                    />
                                                    {c.text}
                                                </label>
                                            ))}
                                        </fieldset>
                                    ))}
                                    {!result && (
                                        <button
                                            className="learning-button"
                                            disabled={
                                                busy ||
                                                !current.read ||
                                                current.locked
                                            }
                                        >
                                            {busy
                                                ? "Menilai…"
                                                : "Periksa jawaban"}
                                        </button>
                                    )}
                                </form>
                                {result && (
                                    <div className="quiz-result" role="status">
                                        <QuizResultPanel
                                            passed={result.passed}
                                            score={result.score}
                                            correct={
                                                result.correct_count ??
                                                result.feedback.filter(
                                                    (answer) => answer.correct,
                                                ).length
                                            }
                                            total={
                                                result.total_questions ??
                                                result.feedback.length
                                            }
                                            xp={result.xp_delta || 0}
                                        />
                                        {result.feedback.map((f, i) => (
                                            <div key={i}>
                                                <strong>
                                                    {f.correct
                                                        ? "✓ Benar"
                                                        : "Belum tepat"}
                                                    : {f.question}
                                                </strong>
                                                <p>Jawabanmu: {f.selected}</p>
                                                <p>
                                                    Jawaban tepat: {f.answer}.{" "}
                                                    {f.explanation}
                                                </p>
                                            </div>
                                        ))}
                                        <button
                                            className="learning-button secondary"
                                            onClick={() => {
                                                setResult(null);
                                                setAnswers({});
                                                setSubmission(
                                                    crypto.randomUUID(),
                                                );
                                            }}
                                        >
                                            Ulangi kuis
                                        </button>
                                    </div>
                                )}
                                <h3>Riwayat percobaan</h3>
                                {attempts.length ? (
                                    <ol className="attempt-list">
                                        {attempts.map((a) => (
                                            <li key={a.id}>
                                                <details>
                                                    <summary>
                                                        {a.score}/100 ·{" "}
                                                        {a.passed
                                                            ? "Lulus"
                                                            : "Belum lulus"}{" "}
                                                        ·{" "}
                                                        {new Date(
                                                            a.created_at,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </summary>
                                                    {a.feedback.map((f, i) => (
                                                        <p key={i}>
                                                            {f.question} —{" "}
                                                            {f.explanation}
                                                        </p>
                                                    ))}
                                                </details>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p>
                                        Belum ada percobaan. Hasil akan
                                        tersimpan di akunmu.
                                    </p>
                                )}
                                <p className="muted">
                                    Menampilkan 20 percobaan terakhir; seluruh
                                    riwayat tetap tersimpan.
                                </p>
                            </div>
                        )}
                    </section>
                    {error && (
                        <p className="field-error" role="alert">
                            {error}
                        </p>
                    )}
                    <div className="quick-quiz">
                        <ShieldCheck size={30} />
                        <div>
                            <h3>Kuis Cepat</h3>
                            <p>Hubungkan yang dibaca dengan yang dipahami.</p>
                        </div>
                        <button onClick={() => setTab("Kuis")}>
                            Buka Kuis <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="lesson-evidence">
                        <span>{current.read ? "✓" : "○"} Dibaca</span>
                        <span>
                            {current.quiz_passed ? "✓" : "○"} Kuis lulus
                        </span>
                        <span>
                            {lesson.labs.some((l) => l.solved)
                                ? "✓ Lab selesai terverifikasi"
                                : lesson.labs.some((l) => l.available)
                                  ? "○ Lab belum selesai"
                                  : "○ Sandbox belum tersedia"}
                        </span>
                        <span>○ Skill belum diverifikasi</span>
                    </div>
                    <nav
                        className="lesson-pagination"
                        aria-label="Navigasi lesson"
                    >
                        {index > 0 ? (
                            <Link href={`/learning/${all[index - 1].slug}`}>
                                <ChevronLeft size={16} />
                                Materi sebelumnya
                            </Link>
                        ) : (
                            <Link href="/learning">Semua modul</Link>
                        )}
                        {index < all.length - 1 && (
                            <Link href={`/learning/${all[index + 1].slug}`}>
                                Materi berikutnya
                                <ChevronRight size={16} />
                            </Link>
                        )}
                    </nav>
                    <details className="mobile-rail">
                        <summary>Sumber, lab & catatan</summary>
                        {refs}
                    </details>
                </div>
                <aside
                    className="reader-sources desktop-rail"
                    aria-label="Referensi lesson"
                >
                    {refs}
                </aside>
            </div>
        </AppShell>
    );
}
