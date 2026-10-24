import { Head, Link, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import {
    Play,
    RotateCcw,
    Send,
    Flag,
    Lightbulb,
    CheckCircle2,
    ShieldCheck,
    BookOpen,
    Copy,
    Square,
    Clock3,
} from "lucide-react";
import AppShell from "../components/AppShell";
import SafeMarkdown from "../components/SafeMarkdown";
import CodePanel from "../components/CodePanel";
import { LabCompletionDialog, normalizeLaravelError } from "../feedback";
import { requestJson, RequestError } from "../learning";
import {
    difficultyLabel,
    type LabCard,
    type LabSession,
    type LabHistory,
    type LabResponse,
} from "../labs";
type Hint = { level: number; body: string };
type Solution = { html: string; code: string };
type Lab = LabCard & {
    scenario_html: string;
    instructions: { position: number; body: string }[];
    sources: { title: string; url: string }[];
    classification: string;
    default_body: Record<string, unknown>;
    default_headers: Record<string, string>;
    authored_at: string;
    reviewed_at: string | null;
    routes: Record<string, { path: string; methods: string[] }>;
};
type Props = {
    lab: Lab;
    session: LabSession | null;
    hints: Hint[];
    history: LabHistory[];
    attempts: {
        id: number;
        generation: number;
        success: boolean;
        created_at: string;
    }[];
    solution: Solution | null;
    recommendations: LabCard[];
};
export default function LabWorkspace(props: Props) {
    return <Workspace key={props.lab.id} {...props} />;
}
function Workspace({
    lab,
    session: initial,
    hints: initialHints,
    history: initialHistory,
    attempts,
    solution: initialSolution,
    recommendations,
}: Props) {
    const [session, setSession] = useState(initial);
    const [hints, setHints] = useState(initialHints);
    const [history, setHistory] = useState(initialHistory);
    const [response, setResponse] = useState<LabResponse | null>(
        initialHistory[0]?.response || null,
    );
    const [endpoint, setEndpoint] = useState(Object.keys(lab.routes)[0]);
    const [method, setMethod] = useState(
        lab.routes[Object.keys(lab.routes)[0]].methods[0],
    );
    const [headers, setHeaders] = useState(
        JSON.stringify(
            {
                ...lab.default_headers,
                ...(initial?.fixtures?.jwt_token
                    ? { Authorization: `Bearer ${initial.fixtures.jwt_token}` }
                    : {}),
            },
            null,
            2,
        ),
    );
    const [body, setBody] = useState(JSON.stringify(lab.default_body, null, 2));
    const [mode, setMode] = useState<"vulnerable" | "secure">("vulnerable");
    const [tab, setTab] = useState("Deskripsi");
    const [mobilePanel, setMobilePanel] = useState("Instruksi");
    const [editorTab, setEditorTab] = useState("Headers");
    const [responseTab, setResponseTab] = useState("Body");
    const [flag, setFlag] = useState("");
    const [submission, setSubmission] = useState(() => crypto.randomUUID());
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [flagError, setFlagError] = useState("");
    const [completionXp, setCompletionXp] = useState<number | null>(null);
    const [resetConfirm, setResetConfirm] = useState(false);
    const [reveal, setReveal] = useState(false);
    const [solution, setSolution] = useState(initialSolution);
    const [checks, setChecks] = useState<number[]>([]);
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    const active =
        !!session &&
        ["running", "solved"].includes(session.status) &&
        new Date(session.expires_at).getTime() > now;
    const solved = lab.status === "solved";
    async function action(label: string, work: () => Promise<void>) {
        if (busy) return;
        setBusy(label);
        setError("");
        setNotice("");
        try {
            await work();
        } catch (e) {
            const failure = normalizeLaravelError(e);
            setError(
                [401, 403, 404, 410, 419, 429, 500, 503, 0].includes(
                    failure.status,
                )
                    ? `${failure.title} — ${failure.message}`
                    : e instanceof Error
                      ? e.message
                      : failure.message,
            );
            if (label === "flag")
                setFlagError(
                    Object.values(failure.errors)[0] || failure.message,
                );
            if (e instanceof RequestError && [409, 410].includes(e.status))
                router.reload({ only: ["session", "lab", "attempts"] });
        } finally {
            setBusy("");
        }
    }
    function adopt(s: LabSession) {
        setSession(s);
        setResponse(null);
        setHistory([]);
        setFlag("");
        setSubmission(crypto.randomUUID());
        setHeaders(
            JSON.stringify(
                {
                    ...lab.default_headers,
                    ...(s.fixtures?.jwt_token
                        ? { Authorization: `Bearer ${s.fixtures.jwt_token}` }
                        : {}),
                },
                null,
                2,
            ),
        );
    }
    function start() {
        void action("start", async () => {
            const data = await requestJson<{ session: LabSession }>(
                `/labs/${lab.slug}/sessions`,
                "POST",
                {},
            );
            adopt(data.session);
            setNotice(
                "Sandbox siap. Semua request dibatasi pada fixture sesi ini.",
            );
        });
    }
    function reset() {
        if (!session) return;
        void action("reset", async () => {
            const result = await requestJson<{ session: LabSession }>(
                `/lab-sessions/${session.id}/reset`,
                "POST",
                { generation: session.generation },
            );
            adopt(result.session);
            setChecks([]);
            setResetConfirm(false);
            setNotice(
                "Data dummy direset dan flag diganti. Riwayat kelulusan tetap tersimpan.",
            );
        });
    }
    function send() {
        if (!session) return;
        void action("request", async () => {
            const request = {
                generation: session.generation,
                endpoint,
                method,
                headers_json: headers,
                body_json: body,
                mode,
            };
            const result = await requestJson<LabResponse>(
                `/lab-sessions/${session.id}/request`,
                "POST",
                request,
            );
            setResponse(result);
            setHistory((prev) =>
                [
                    {
                        id: result.history_id!,
                        created_at: new Date().toISOString(),
                        request: {
                            endpoint,
                            method,
                            headers: JSON.parse(headers),
                            body: JSON.parse(body),
                            mode,
                        },
                        response: result,
                    },
                    ...prev,
                ].slice(0, 20),
            );
            setResponseTab("Body");
            if (window.innerWidth < 768) setMobilePanel("Response");
        });
    }
    function submitFlag() {
        if (!session) return;
        setFlagError("");
        void action("flag", async () => {
            const result = await requestJson<{
                success: boolean;
                message: string;
                xp_delta: number;
            }>(`/lab-sessions/${session.id}/flag`, "POST", {
                generation: session.generation,
                submission_id: submission,
                flag,
            });
            setNotice(result.message);
            if (result.success) {
                setCompletionXp(result.xp_delta || 0);
                setSession({
                    ...session,
                    status: "solved",
                    solved_at: new Date().toISOString(),
                });
                router.reload({
                    only: ["lab", "solution", "attempts", "recommendations"],
                    onSuccess: (page) =>
                        setSolution(page.props.solution as Solution),
                });
            } else {
                setFlagError(
                    `Flag belum cocok. Periksa hasil lab atau buka petunjuk. ${result.message}`,
                );
            }
        });
    }
    function hint() {
        if (!session) return;
        void action("hint", async () => {
            const result = await requestJson<{ hints: Hint[] }>(
                `/labs/${lab.slug}/hints`,
                "POST",
                { generation: session.generation },
            );
            setHints(result.hints);
            setTab("Petunjuk");
        });
    }
    async function copy() {
        if (!response) return;
        try {
            await navigator.clipboard.writeText(response.body);
            setNotice("Respons tersalin.");
        } catch {
            setError(
                "Salin ditolak browser. Pilih teks respons secara manual.",
            );
        }
    }
    function forgeDummyToken() {
        try {
            const parsed = JSON.parse(headers);
            const token = String(parsed.Authorization || "").replace(
                /^Bearer /,
                "",
            );
            const [head, payload, signature] = token.split(".");
            const claims = JSON.parse(
                atob(payload.replaceAll("-", "+").replaceAll("_", "/")),
            );
            const changed = btoa(JSON.stringify({ ...claims, role: "admin" }))
                .replaceAll("=", "")
                .replaceAll("+", "-")
                .replaceAll("/", "_");
            setHeaders(
                JSON.stringify(
                    {
                        ...parsed,
                        Authorization: `Bearer ${head}.${changed}.${signature}`,
                    },
                    null,
                    2,
                ),
            );
            setNotice(
                "Claim role dummy diubah; signature lama dipertahankan. Bandingkan vulnerable dan secure.",
            );
        } catch {
            setError(
                "Token dummy belum tersedia atau header bukan JSON valid.",
            );
        }
    }
    const flagForm = (inputId: string) => (
        <div className="lab-flag-box">
            <h2>
                <Flag size={17} />
                Validasi temuanmu
            </h2>
            <p>
                Flag harus berasal dari sesi aktif dan kondisi lab harus
                terverifikasi oleh sandbox.
            </p>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    submitFlag();
                }}
            >
                <label className="sr-only" htmlFor={inputId}>
                    Flag sesi
                </label>
                <input
                    id={inputId}
                    name="flag"
                    aria-invalid={!!flagError}
                    aria-describedby={
                        flagError ? `${inputId}-error` : undefined
                    }
                    placeholder="VULNLAB{…}"
                    value={flag}
                    maxLength={128}
                    onChange={(e) => {
                        setFlag(e.target.value);
                        setFlagError("");
                        setSubmission(crypto.randomUUID());
                    }}
                    disabled={!active || !!busy}
                    autoComplete="off"
                />
                <button
                    className="learning-button"
                    disabled={!active || !!busy || !flag.trim()}
                >
                    <Flag size={15} />
                    Kirim Flag
                </button>
            </form>
            {flagError && (
                <p className="field-error" id={`${inputId}-error`} role="alert">
                    {flagError}
                </p>
            )}
            {solved && (
                <p className="lab-solved-note">
                    <CheckCircle2 size={16} />
                    Selesai · {lab.earned_xp} XP tersimpan sekali
                </p>
            )}
            {solved && (
                <Link
                    className="learning-button secondary"
                    href={`/reports/create?lab=${lab.id}`}
                >
                    Tulis laporan latihan
                </Link>
            )}
        </div>
    );
    let responseText = response?.body || "";
    try {
        responseText = JSON.stringify(JSON.parse(responseText), null, 2);
    } catch {
        /* HTML and text are displayed verbatim as escaped code. */
    }
    return (
        <AppShell title={lab.title}>
            <LabCompletionDialog
                open={completionXp !== null}
                onOpenChange={(open) => {
                    if (!open) setCompletionXp(null);
                }}
                title={lab.title}
                xp={completionXp || 0}
                labId={lab.id}
                nextHref={
                    recommendations[0]
                        ? `/labs/${recommendations[0].slug}`
                        : undefined
                }
            />
            <Head title={lab.title} />
            <div className="lab-breadcrumb">
                <Link href="/labs">Lab</Link>
                <span>›</span>
                <span>{lab.category}</span>
                <span>›</span>
                <span>{lab.code}</span>
            </div>
            <div className="lab-workspace-heading">
                <div>
                    <h1>{lab.title}</h1>
                    <div className="lab-heading-meta">
                        <span
                            className={`difficulty difficulty-${lab.difficulty}`}
                        >
                            {difficultyLabel[lab.difficulty]}
                        </span>
                        <span>
                            <Clock3 size={13} />
                            {lab.minutes} menit
                        </span>
                        <span>{lab.points} XP · sekali</span>
                        <span className="lab-live-status">
                            {solved
                                ? "Selesai"
                                : active
                                  ? "Sandbox berjalan"
                                  : session?.status === "error"
                                    ? "Sandbox gagal disiapkan"
                                    : "Sandbox belum berjalan"}
                        </span>
                    </div>
                </div>
                <div className="lab-lifecycle">
                    {!active && (
                        <button
                            className="learning-button"
                            disabled={!!busy || !lab.available}
                            onClick={start}
                        >
                            <Play size={15} />
                            {busy === "start"
                                ? "Menyiapkan…"
                                : session
                                  ? "Mulai kembali"
                                  : "Mulai Sandbox"}
                        </button>
                    )}
                    {session && (
                        <>
                            <button
                                className="learning-button secondary"
                                disabled={!!busy || !lab.available}
                                onClick={() => setResetConfirm(!resetConfirm)}
                            >
                                <RotateCcw size={14} />
                                Reset Lab
                            </button>
                            {active && (
                                <button
                                    className="icon-button"
                                    aria-label="Hentikan sandbox"
                                    disabled={!!busy}
                                    onClick={() =>
                                        void action("stop", async () => {
                                            await requestJson(
                                                `/lab-sessions/${session.id}/stop`,
                                                "POST",
                                                {
                                                    generation:
                                                        session.generation,
                                                },
                                            );
                                            setSession({
                                                ...session,
                                                status: "stopped",
                                            });
                                            setNotice("Sandbox dihentikan.");
                                        })
                                    }
                                >
                                    <Square size={15} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
            {resetConfirm && (
                <div className="lab-reset-confirm">
                    <p>
                        Reset menghapus perubahan fixture sesi ini dan mengganti
                        flag. Kelulusan dan XP historis tetap tersimpan.
                    </p>
                    <button
                        className="learning-button"
                        disabled={!!busy}
                        onClick={reset}
                    >
                        Ya, reset data dummy
                    </button>
                    <button onClick={() => setResetConfirm(false)}>
                        Batal
                    </button>
                </div>
            )}
            <div className="lab-workspace-links">
                <Link href={`/learning/${lab.lesson.slug}`}>
                    <BookOpen size={15} />
                    Lesson terkait
                </Link>
                <Link href={`/notes?lesson=${lab.lesson.id}`}>
                    Catat temuan
                </Link>
                {session && (
                    <span>
                        Sisa sesi:{" "}
                        {Math.max(
                            0,
                            Math.ceil(
                                (new Date(session.expires_at).getTime() - now) /
                                    60000,
                            ),
                        )}{" "}
                        menit · bukan waktu belajar terverifikasi
                    </span>
                )}
            </div>
            <div className="lab-feedback" aria-live="polite">
                {notice && <p role="status">{notice}</p>}
                {error && <p role="alert">{error}</p>}
            </div>
            {!lab.available && (
                <div className="prerequisite-callout">
                    Instruksi dapat dibaca. Sandbox lokal belum diaktifkan;
                    ikuti dokumentasi setup sebelum mengirim request.
                </div>
            )}
            <nav className="lab-mobile-tabs" aria-label="Panel lab">
                {["Instruksi", "Request", "Response", "Flag"].map((p) => (
                    <button
                        key={p}
                        aria-pressed={mobilePanel === p}
                        onClick={() => setMobilePanel(p)}
                    >
                        {p}
                    </button>
                ))}
            </nav>
            <div
                className={`lab-layout lab-panel-${mobilePanel.toLowerCase()}`}
            >
                <section className="lab-challenge" aria-label="Instruksi lab">
                    <div className="lab-section-tabs">
                        {["Deskripsi", "Petunjuk", "Solusi"].map((t) => (
                            <button
                                key={t}
                                aria-pressed={tab === t}
                                onClick={() => setTab(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    {tab === "Deskripsi" && (
                        <>
                            <h2>Tantangan</h2>
                            <SafeMarkdown html={lab.scenario_html} />
                            <h2>Target dalam scope</h2>
                            <div className="lab-target-chip">
                                <ShieldCheck size={16} />
                                <code>
                                    VulnShop · {lab.code} · sesi sendiri
                                </code>
                            </div>
                            <p className="lab-small">
                                Hanya endpoint pada pemilih request. Akun
                                customer_a, customer_b, dan admin adalah
                                identitas dummy, terpisah dari akun VulnLab.
                            </p>
                            <h2>Tujuan belajar</h2>
                            <ul className="lab-objectives">
                                {lab.objectives.map((o) => (
                                    <li key={o}>
                                        <CheckCircle2 size={15} />
                                        {o}
                                    </li>
                                ))}
                            </ul>
                            <details className="lab-guidance">
                                <summary>
                                    Langkah terarah ({lab.instructions.length})
                                </summary>
                                <ol className="lab-steps">
                                    {lab.instructions.map((s) => (
                                        <li key={s.position}>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={checks.includes(
                                                        s.position,
                                                    )}
                                                    onChange={() =>
                                                        setChecks((prev) =>
                                                            prev.includes(
                                                                s.position,
                                                            )
                                                                ? prev.filter(
                                                                      (i) =>
                                                                          i !==
                                                                          s.position,
                                                                  )
                                                                : [
                                                                      ...prev,
                                                                      s.position,
                                                                  ],
                                                        )
                                                    }
                                                />
                                                <span>{s.body}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ol>
                            </details>
                            <p className="lab-small">
                                Checklist adalah penanda lokal. Kelulusan hanya
                                lewat validasi flag.
                            </p>
                        </>
                    )}
                    {tab === "Petunjuk" && (
                        <>
                            <h2>Petunjuk bertahap</h2>
                            <p className="lab-small">
                                Penggunaan petunjuk dicatat terpisah dari
                                kelulusan.
                            </p>
                            {hints.length ? (
                                hints.map((h) => (
                                    <div className="lab-hint" key={h.level}>
                                        <strong>Hint {h.level}</strong>
                                        <p>{h.body}</p>
                                    </div>
                                ))
                            ) : (
                                <p>Belum ada petunjuk dibuka.</p>
                            )}
                        </>
                    )}
                    {tab === "Solusi" && (
                        <>
                            <h2>Mengapa celah ini terjadi?</h2>
                            {solution ? (
                                <>
                                    <SafeMarkdown html={solution.html} />
                                    <h3>Contoh implementasi aman</h3>
                                    <CodePanel
                                        text={solution.code}
                                        language={
                                            lab.slug === "search-xss"
                                                ? "javascript"
                                                : "php"
                                        }
                                    />
                                    <p className="lab-small">
                                        Contoh menjelaskan kontrol yang
                                        diperlukan; adaptasikan policy dan
                                        validasi pada aplikasi sendiri.
                                    </p>
                                </>
                            ) : (
                                <div className="solution-gate">
                                    <p>
                                        Solusi akan terbuka setelah lab selesai.
                                        Kamu juga dapat membukanya untuk belajar
                                        tanpa memperoleh kelulusan atau XP.
                                    </p>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={reveal}
                                            onChange={(e) =>
                                                setReveal(e.target.checked)
                                            }
                                        />
                                        Saya ingin melihat pembahasan sebelum
                                        menyelesaikan tantangan.
                                    </label>
                                    <button
                                        className="learning-button secondary"
                                        disabled={!reveal || !!busy}
                                        onClick={() =>
                                            void action("solution", async () =>
                                                setSolution(
                                                    await requestJson<Solution>(
                                                        `/labs/${lab.slug}/solution`,
                                                        "POST",
                                                        { acknowledged: true },
                                                    ),
                                                ),
                                            )
                                        }
                                    >
                                        Buka pembahasan
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    <button
                        className="lab-hint-button"
                        disabled={!active || !!busy || hints.length >= 3}
                        onClick={hint}
                    >
                        <Lightbulb size={18} />
                        Hint ({hints.length}/3)
                        {hints.length < 3 ? " · buka berikutnya" : ""}
                    </button>
                    <div className="lab-desktop-flag">
                        {flagForm("lab-flag-desktop")}
                    </div>
                    <details className="lab-sources">
                        <summary>Referensi & status editorial</summary>
                        {lab.sources.map((s) => (
                            <a
                                key={s.url}
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {s.title} ↗
                            </a>
                        ))}
                        <p>
                            {lab.classification} · Disusun {lab.authored_at} ·{" "}
                            {lab.reviewed_at ||
                                "Belum ditinjau pakar independen"}
                        </p>
                    </details>
                </section>
                <section className="lab-http" aria-label="HTTP workspace">
                    <div className="lab-request-pane">
                        <div className="http-panel-title">
                            <h2>Request</h2>
                            <button
                                className="icon-button"
                                aria-label="Reset request editor"
                                onClick={() => {
                                    setEndpoint(Object.keys(lab.routes)[0]);
                                    setMethod(
                                        lab.routes[Object.keys(lab.routes)[0]]
                                            .methods[0],
                                    );
                                    setBody(
                                        JSON.stringify(
                                            lab.default_body,
                                            null,
                                            2,
                                        ),
                                    );
                                    setHeaders(
                                        JSON.stringify(
                                            {
                                                ...lab.default_headers,
                                                ...(session?.fixtures?.jwt_token
                                                    ? {
                                                          Authorization: `Bearer ${session.fixtures.jwt_token}`,
                                                      }
                                                    : {}),
                                            },
                                            null,
                                            2,
                                        ),
                                    );
                                }}
                            >
                                <RotateCcw size={14} />
                            </button>
                        </div>
                        <div className="http-target-controls">
                            <label className="sr-only" htmlFor="lab-method">
                                HTTP method
                            </label>
                            <select
                                id="lab-method"
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                            >
                                {lab.routes[endpoint].methods.map((m) => (
                                    <option key={m}>{m}</option>
                                ))}
                            </select>
                            <label className="sr-only" htmlFor="lab-endpoint">
                                Endpoint latihan
                            </label>
                            <select
                                id="lab-endpoint"
                                value={endpoint}
                                onChange={(e) => {
                                    setEndpoint(e.target.value);
                                    setMethod(
                                        lab.routes[e.target.value].methods[0],
                                    );
                                }}
                            >
                                {Object.entries(lab.routes).map(([key, r]) => (
                                    <option key={key} value={key}>
                                        {r.path}
                                    </option>
                                ))}
                            </select>
                            <button
                                className="learning-button"
                                disabled={!active || !!busy}
                                onClick={send}
                            >
                                <Send size={14} />
                                {busy === "request" ? "Mengirim…" : "Send"}
                            </button>
                        </div>
                        <label className="lab-mode">
                            Mode latihan
                            <select
                                aria-label="Mode latihan"
                                value={mode}
                                onChange={(e) =>
                                    setMode(
                                        e.target.value as
                                            "vulnerable" | "secure",
                                    )
                                }
                            >
                                <option value="vulnerable">Vulnerable</option>
                                <option value="secure">
                                    Secure (bandingkan perbaikan)
                                </option>
                            </select>
                        </label>
                        <div className="http-editor-tabs">
                            {["Headers", "Body / Params"].map((t) => (
                                <button
                                    key={t}
                                    aria-pressed={editorTab === t}
                                    onClick={() => setEditorTab(t)}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        {editorTab === "Headers" ? (
                            <textarea
                                aria-label="Request headers JSON"
                                spellCheck={false}
                                value={headers}
                                maxLength={4096}
                                onChange={(e) => setHeaders(e.target.value)}
                            />
                        ) : (
                            <textarea
                                aria-label="Request body atau query JSON"
                                spellCheck={false}
                                value={body}
                                maxLength={8192}
                                onChange={(e) => setBody(e.target.value)}
                            />
                        )}
                        <p className="lab-small">
                            Header dan body memakai objek JSON. Pada GET, body
                            editor dikirim sebagai query params. Host, cookie
                            aplikasi dan target URL bebas ditolak.
                        </p>
                        {lab.slug === "jwt-validation" &&
                            session?.fixtures?.jwt_token && (
                                <button
                                    className="learning-button secondary"
                                    onClick={forgeDummyToken}
                                >
                                    Ubah role token dummy → admin
                                </button>
                            )}
                    </div>
                    <div className="lab-response-pane">
                        <div className="http-panel-title">
                            <h2>Response</h2>
                            {response ? (
                                <span
                                    className={
                                        response.status < 400
                                            ? "http-status-success"
                                            : "http-status-error"
                                    }
                                >
                                    Status: {response.status} ·{" "}
                                    {response.elapsed_ms} ms
                                </span>
                            ) : (
                                <span>Belum ada respons</span>
                            )}
                            <button
                                className="icon-button"
                                aria-label="Salin respons"
                                disabled={!response}
                                onClick={() => void copy()}
                            >
                                <Copy size={15} />
                            </button>
                        </div>
                        <div className="http-editor-tabs">
                            {["Body", "Headers", "Riwayat"].map((t) => (
                                <button
                                    key={t}
                                    aria-pressed={responseTab === t}
                                    onClick={() => setResponseTab(t)}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        {responseTab === "Riwayat" ? (
                            <div className="lab-history">
                                {history.length ? (
                                    history.map((h) => (
                                        <button
                                            key={h.id}
                                            onClick={() => {
                                                setResponse(h.response);
                                                setEndpoint(h.request.endpoint);
                                                setMethod(h.request.method);
                                                setHeaders(
                                                    JSON.stringify(
                                                        h.request.headers,
                                                        null,
                                                        2,
                                                    ),
                                                );
                                                setBody(
                                                    JSON.stringify(
                                                        h.request.body,
                                                        null,
                                                        2,
                                                    ),
                                                );
                                                setMode(h.request.mode);
                                                setResponseTab("Body");
                                            }}
                                        >
                                            <span>
                                                {h.request.method}{" "}
                                                {
                                                    lab.routes[
                                                        h.request.endpoint
                                                    ]?.path
                                                }
                                            </span>
                                            <small>
                                                {h.response.status} ·{" "}
                                                {h.request.mode} ·{" "}
                                                {new Date(
                                                    h.created_at,
                                                ).toLocaleTimeString("id-ID")}
                                            </small>
                                        </button>
                                    ))
                                ) : (
                                    <p>
                                        Request yang dikirim akan tersimpan di
                                        sini. Menampilkan 20 terakhir pada
                                        generasi sesi ini.
                                    </p>
                                )}
                            </div>
                        ) : response ? (
                            <CodePanel
                                text={
                                    responseTab === "Headers"
                                        ? JSON.stringify(
                                              response.headers,
                                              null,
                                              2,
                                          )
                                        : responseText
                                }
                                language={
                                    responseTab === "Headers"
                                        ? "json"
                                        : response.headers[
                                                "content-type"
                                            ]?.includes("html")
                                          ? "xml"
                                          : "json"
                                }
                            />
                        ) : (
                            <div className="lab-response-empty">
                                <Send size={26} />
                                <p>
                                    Mulai sandbox, pilih request dalam scope,
                                    lalu tekan Send.
                                </p>
                                <small>
                                    Respons berasal dari VulnShop yang
                                    terisolasi.
                                </small>
                            </div>
                        )}
                        {lab.slug === "search-xss" && (
                            <p className="lab-small">
                                HTML ditampilkan sebagai teks aman. Eksekusi
                                labProof() diuji oleh Chromium dalam container
                                terisolasi, bukan pada origin aplikasi ini.
                            </p>
                        )}
                    </div>
                </section>
                <div className="lab-mobile-flag">
                    {flagForm("lab-flag-mobile")}
                </div>
            </div>
            <section className="lab-completion-summary">
                <div>
                    <h2>
                        {solved
                            ? "Temuan tersimpan. Perdalam pemahamanmu."
                            : "Satu request, satu hipotesis."}
                    </h2>
                    <p>
                        {solved
                            ? "Lab selesai terverifikasi. Status membaca dan kuis tetap dinilai terpisah."
                            : "Bandingkan baseline, perilaku vulnerable, dan perbaikan secure. Hanya gunakan data dummy."}
                    </p>
                </div>
                <Link
                    className="learning-button secondary"
                    href={`/learning/${lab.lesson.slug}`}
                >
                    Kembali ke lesson
                </Link>
                {solved && recommendations[0] && (
                    <Link
                        className="learning-button"
                        href={`/labs/${recommendations[0].slug}`}
                    >
                        Lab berikutnya
                    </Link>
                )}
            </section>
            <details className="lab-attempts">
                <summary>
                    Riwayat validasi flag ({attempts.length} terakhir)
                </summary>
                {attempts.length ? (
                    attempts.map((a) => (
                        <p key={a.id}>
                            Generasi {a.generation} ·{" "}
                            {a.success ? "Tervalidasi" : "Belum valid"} ·{" "}
                            {new Date(a.created_at).toLocaleString("id-ID")}
                        </p>
                    ))
                ) : (
                    <p>Belum ada pengiriman flag.</p>
                )}
            </details>
        </AppShell>
    );
}
