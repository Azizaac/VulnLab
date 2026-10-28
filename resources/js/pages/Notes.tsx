import { Head, router, usePage } from "@inertiajs/react";
import { useState, useRef, useEffect, useCallback } from "react";
import {
    Plus,
    Search,
    Pin,
    Trash2,
    ArrowLeft,
    NotebookPen,
    Save,
    FileText,
    Tag,
} from "lucide-react";
import AppShell from "../components/AppShell";
import "../../css/v8-workspaces.css";
import SafeMarkdown from "../components/SafeMarkdown";
import { requestJson, RequestError } from "../learning";
import type { SharedProps } from "../types";
import {
    ConfirmDialog,
    FormFieldError,
    normalizeLaravelError,
    focusFirstError,
    useFeedback,
} from "../feedback";
type Note = {
    id: number;
    title: string;
    body_md: string;
    category: string;
    pinned: boolean;
    revision: number;
    lesson_id: number | null;
    lab_spec_id: number | null;
    updated_at: string;
    tags: string[];
};
type Props = {
    notes: {
        current_page: number;
        data: Note[];
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters: { search?: string; tag?: string; category?: string };
    initialLesson: number | null;
    lessons: { id: number; title: string }[];
    labs: { id: number; title: string }[];
    tags: string[];
    categories: string[];
};
const fields = (n: Note) => ({
    title: n.title,
    body_md: n.body_md,
    category: n.category,
    pinned: n.pinned,
    lesson_id: n.lesson_id,
    lab_spec_id: n.lab_spec_id,
    tags: n.tags,
});
export default function Notes(props: Props) {
    return (
        <Workspace
            key={JSON.stringify(props.filters) + props.notes.current_page}
            {...props}
        />
    );
}
function Workspace({
    notes,
    filters,
    initialLesson,
    lessons,
    labs,
    tags,
    categories,
}: Props) {
    const { auth } = usePage<SharedProps>().props;
    const { notify } = useFeedback();
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [items, setItems] = useState(notes.data);
    const [draft, setDraft] = useState<Note | null>(null);
    const latest = useRef<Note | null>(null);
    const saved = useRef("");
    const saving = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [status, setStatus] = useState("Pilih catatan atau buat yang baru.");
    const [error, setError] = useState("");
    const [conflict, setConflict] = useState<Note | null>(null);
    const blocked = useRef(false);
    const [preview, setPreview] = useState(false);
    const [html, setHtml] = useState("");
    const [search, setSearch] = useState(filters.search || "");
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [tagText, setTagText] = useState("");
    const dirty = useCallback(
        () =>
            !!latest.current &&
            JSON.stringify(fields(latest.current)) !== saved.current,
        [],
    );
    const save = useCallback(async (): Promise<boolean> => {
        if (blocked.current) return false;
        if (saving.current) return false;
        if (!dirty() || !latest.current) return true;
        saving.current = true;
        setBusy(true);
        setError("");
        setFieldErrors({});
        setStatus("Menyimpan…");
        try {
            // Serialize writes; edits made during the request keep their values and get the new revision.
            while (dirty() && latest.current) {
                const snapshot: Note = { ...latest.current };
                const response: Note = await requestJson<Note>(
                    `/notes/${snapshot.id}`,
                    "PATCH",
                    { ...fields(snapshot), revision: snapshot.revision },
                );
                saved.current = JSON.stringify(fields(response));
                if (latest.current?.id === response.id) {
                    latest.current =
                        JSON.stringify(fields(latest.current)) ===
                        JSON.stringify(fields(snapshot))
                            ? response
                            : {
                                  ...latest.current,
                                  revision: response.revision,
                                  updated_at: response.updated_at,
                              };
                    setDraft(latest.current);
                }
                setItems((rows) =>
                    rows.map((n) => (n.id === response.id ? response : n)),
                );
            }
            setStatus("Semua perubahan tersimpan");
            return true;
        } catch (e) {
            const failure = normalizeLaravelError(e);
            setFieldErrors(failure.errors);
            focusFirstError(failure.errors);
            if (e instanceof RequestError && e.status === 409) {
                setConflict(e.data.current as Note);
                blocked.current = true;
                setStatus("Konflik versi — perubahan lokal dipertahankan");
            } else {
                blocked.current = true;
                setStatus("Belum tersimpan");
            }
            setError(e instanceof Error ? e.message : "Gagal menyimpan.");
            return false;
        } finally {
            saving.current = false;
            setBusy(false);
        }
    }, [dirty]);
    useEffect(() => {
        const before = (e: BeforeUnloadEvent) => {
            if (dirty()) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", before);
        const unsubscribe = router.on("before", (event) => {
            // Theme writes preserve this workspace's component state and can safely run during autosave.
            if (event.detail.visit.url.pathname === "/settings/theme") return;
            if (dirty() || saving.current) {
                setError(
                    "Tunggu perubahan tersimpan sebelum meninggalkan catatan. Jika gagal, gunakan Coba simpan lagi.",
                );
                return false;
            }
        });
        return () => {
            window.removeEventListener("beforeunload", before);
            unsubscribe();
            if (timer.current) clearTimeout(timer.current);
        };
    }, [dirty]);
    const previewBody = draft?.body_md;
    const previewId = draft?.id;
    useEffect(() => {
        if (!preview || previewBody === undefined) return;
        let active = true;
        setHtml("");
        const t = setTimeout(() => {
            void requestJson<{ html: string }>("/notes/preview", "POST", {
                body_md: previewBody,
            })
                .then((result) => {
                    if (active) setHtml(result.html);
                })
                .catch(() => {
                    if (active)
                        setError(
                            "Preview gagal dimuat. Teks lokal tetap tersedia.",
                        );
                });
        }, 350);
        return () => {
            active = false;
            clearTimeout(t);
        };
    }, [preview, previewBody, previewId]);
    function edit(patch: Partial<Note>) {
        if (!latest.current) return;
        latest.current = { ...latest.current, ...patch };
        setDraft(latest.current);
        setStatus("Perubahan belum tersimpan");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void save(), 800);
    }
    function select(n: Note) {
        latest.current = n;
        saved.current = JSON.stringify(fields(n));
        setDraft(n);
        setTagText(n.tags.join(", "));
        setConflict(null);
        blocked.current = false;
        setError("");
        setStatus("Semua perubahan tersimpan");
        setPreview(false);
        setDeleteOpen(false);
    }
    async function open(n: Note) {
        if (!(await save())) return;
        try {
            select(await requestJson<Note>(`/notes/${n.id}`));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Catatan gagal dibuka.");
        }
    }
    async function create(copy = false) {
        if (!copy && !(await save())) return;
        setBusy(true);
        try {
            const data =
                copy && latest.current
                    ? {
                          ...fields(latest.current),
                          title: `Salinan ${latest.current.title}`.slice(
                              0,
                              180,
                          ),
                      }
                    : {
                          title: "Catatan baru",
                          body_md: "",
                          category: "Belajar",
                          pinned: false,
                          tags: [],
                          lesson_id: initialLesson,
                          lab_spec_id: null,
                      };
            const n = await requestJson<Note>("/notes", "POST", data);
            setItems((rows) => [n, ...rows]);
            select(n);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Catatan gagal dibuat.");
        } finally {
            setBusy(false);
        }
    }
    async function remove() {
        if (!draft || !(await save())) return;
        setBusy(true);
        try {
            await requestJson(`/notes/${latest.current!.id}`, "DELETE", {
                revision: latest.current!.revision,
            });
            setItems((rows) => rows.filter((n) => n.id !== draft.id));
            latest.current = null;
            saved.current = "";
            setDraft(null);
            setDeleteOpen(false);
            setStatus("Catatan dihapus");
            notify({ type: "success", title: "Catatan dihapus" });
        } catch (e) {
            if (e instanceof RequestError && e.status === 409) {
                setConflict(e.data.current as Note);
                blocked.current = true;
            }
            setError(e instanceof Error ? e.message : "Penghapusan gagal.");
        } finally {
            setBusy(false);
        }
    }
    async function filter(extra: Record<string, string>) {
        if (await save())
            router.get(
                "/notes",
                { ...filters, ...extra },
                { preserveState: false },
            );
    }
    async function back() {
        if (await save()) {
            latest.current = null;
            setDraft(null);
        }
    }
    return (
        <AppShell title="Catatan saya">
            <Head title="Catatan" />
            <div className="v8-workspace v8-notes">
                <div className="notes-heading">
                    <div>
                        <span className="eyebrow">KNOWLEDGE BASE</span>
                        <h1>Catatan yang bisa kamu temukan kembali.</h1>
                        <p>
                            Dokumentasi pribadi untuk konsep, eksperimen, dan
                            laporan.
                        </p>
                    </div>
                    <button
                        className="learning-button"
                        disabled={busy}
                        onClick={() => void create()}
                    >
                        <Plus size={17} />
                        Catatan baru
                    </button>
                </div>
                <div
                    className={`notes-workspace ${draft ? "has-selection" : ""}`}
                >
                    <aside className="notes-library">
                        <form
                            className="workspace-search"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void filter({ search });
                            }}
                        >
                            <Search size={17} />
                            <input
                                aria-label="Cari catatan"
                                placeholder="Cari catatan…"
                                value={search}
                                maxLength={100}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button type="submit">Cari</button>
                        </form>
                        <div className="library-columns">
                            <nav
                                className="note-folders"
                                aria-label="Filter catatan"
                            >
                                <button
                                    aria-pressed={
                                        !filters.tag && !filters.category
                                    }
                                    onClick={() =>
                                        void filter({ tag: "", category: "" })
                                    }
                                >
                                    <FileText size={15} />
                                    Semua
                                </button>
                                <h2>KATEGORI</h2>
                                {Array.from(
                                    new Set([
                                        "Belajar",
                                        ...categories,
                                        ...items.map((n) => n.category),
                                    ]),
                                ).map((c) => (
                                    <button
                                        key={c}
                                        aria-pressed={filters.category === c}
                                        onClick={() =>
                                            void filter({
                                                category: c,
                                                tag: "",
                                            })
                                        }
                                    >
                                        {c}
                                    </button>
                                ))}
                                <h2>
                                    <Tag size={12} /> TAG
                                </h2>
                                {Array.from(
                                    new Set([
                                        ...tags,
                                        ...items.flatMap((n) => n.tags),
                                    ]),
                                ).map((t) => (
                                    <button
                                        key={t}
                                        aria-pressed={filters.tag === t}
                                        onClick={() =>
                                            void filter({
                                                tag: t,
                                                category: "",
                                            })
                                        }
                                    >
                                        #{t}
                                    </button>
                                ))}
                            </nav>
                            <div className="note-list">
                                <p className="note-count">
                                    {items.length} catatan pada halaman ini
                                </p>
                                {[...items]
                                    .sort(
                                        (a, b) =>
                                            Number(b.pinned) -
                                                Number(a.pinned) ||
                                            b.updated_at.localeCompare(
                                                a.updated_at,
                                            ),
                                    )
                                    .map((n) => (
                                        <button
                                            key={n.id}
                                            className={
                                                draft?.id === n.id
                                                    ? "selected"
                                                    : ""
                                            }
                                            onClick={() => void open(n)}
                                        >
                                            <strong>
                                                {n.pinned && <Pin size={12} />}{" "}
                                                {n.title}
                                            </strong>
                                            <p>
                                                {n.body_md
                                                    .replace(/[#*`]/g, "")
                                                    .slice(0, 80) ||
                                                    "Mulai dengan satu ide…"}
                                            </p>
                                            <small>
                                                {new Date(
                                                    n.updated_at,
                                                ).toLocaleDateString("id-ID", {
                                                    timeZone:
                                                        auth.user.timezone,
                                                })}{" "}
                                                · {n.category}
                                            </small>
                                        </button>
                                    ))}
                                {!items.length && (
                                    <div className="notes-empty">
                                        <NotebookPen size={32} />
                                        <h2>
                                            {filters.search ||
                                            filters.tag ||
                                            filters.category
                                                ? "Tidak ada catatan cocok"
                                                : "Ruang untuk penemuanmu"}
                                        </h2>
                                        <p>
                                            Catat satu konsep, satu pertanyaan,
                                            atau satu hal yang ingin dicoba.
                                        </p>
                                    </div>
                                )}
                                <div className="notes-pages">
                                    {notes.prev_page_url && (
                                        <button
                                            onClick={async () => {
                                                if (await save())
                                                    router.get(
                                                        notes.prev_page_url!,
                                                    );
                                            }}
                                        >
                                            Sebelumnya
                                        </button>
                                    )}
                                    {notes.next_page_url && (
                                        <button
                                            onClick={async () => {
                                                if (await save())
                                                    router.get(
                                                        notes.next_page_url!,
                                                    );
                                            }}
                                        >
                                            Berikutnya
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>
                    <section
                        className="note-editor"
                        aria-label="Editor catatan"
                    >
                        {draft ? (
                            <>
                                <div className="editor-heading">
                                    <button
                                        className="mobile-back icon-button"
                                        aria-label="Kembali ke daftar catatan"
                                        onClick={() => void back()}
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <label
                                        className="sr-only"
                                        htmlFor="note-title"
                                    >
                                        Judul catatan
                                    </label>
                                    <input
                                        id="note-title"
                                        name="title"
                                        aria-invalid={!!fieldErrors.title}
                                        aria-describedby={
                                            fieldErrors.title
                                                ? "title-error"
                                                : undefined
                                        }
                                        value={draft.title}
                                        maxLength={180}
                                        onChange={(e) =>
                                            edit({ title: e.target.value })
                                        }
                                    />
                                    <span
                                        className="note-save-status"
                                        role="status"
                                    >
                                        {status}
                                    </span>
                                    <button
                                        className="icon-button"
                                        aria-label={
                                            draft.pinned
                                                ? "Lepas pin"
                                                : "Pin catatan"
                                        }
                                        aria-pressed={draft.pinned}
                                        onClick={() =>
                                            edit({ pinned: !draft.pinned })
                                        }
                                    >
                                        <Pin size={17} />
                                    </button>
                                    <button
                                        className="icon-button"
                                        aria-label="Hapus catatan"
                                        onClick={() =>
                                            setDeleteOpen(!deleteOpen)
                                        }
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                                <FormFieldError
                                    name="title"
                                    errors={fieldErrors}
                                />
                                <ConfirmDialog
                                    open={deleteOpen}
                                    onOpenChange={setDeleteOpen}
                                    title="Hapus catatan ini?"
                                    description={`Hapus “${draft.title}”? Tindakan tidak dapat dibatalkan.`}
                                    onConfirm={() => void remove()}
                                    confirmLabel="Ya, hapus catatan"
                                    pending={busy}
                                />
                                <div className="note-properties">
                                    <label>
                                        Kategori
                                        <input
                                            value={draft.category}
                                            maxLength={60}
                                            onChange={(e) =>
                                                edit({
                                                    category: e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                    <label>
                                        Tag (pisahkan koma)
                                        <input
                                            value={tagText}
                                            maxLength={410}
                                            onChange={(e) => {
                                                setTagText(e.target.value);
                                                edit({
                                                    tags: Array.from(
                                                        new Set(
                                                            e.target.value
                                                                .split(",")
                                                                .map((t) =>
                                                                    t.trim(),
                                                                )
                                                                .filter(
                                                                    Boolean,
                                                                ),
                                                        ),
                                                    ),
                                                });
                                            }}
                                        />
                                    </label>
                                    <label>
                                        Lesson
                                        <select
                                            aria-label="Lesson"
                                            value={draft.lesson_id || ""}
                                            onChange={(e) =>
                                                edit({
                                                    lesson_id:
                                                        Number(
                                                            e.target.value,
                                                        ) || null,
                                                })
                                            }
                                        >
                                            <option value="">
                                                Tanpa lesson
                                            </option>
                                            {lessons.map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    {l.title}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        Lab terkait
                                        <select
                                            aria-label="Lab terkait"
                                            value={draft.lab_spec_id || ""}
                                            onChange={(e) =>
                                                edit({
                                                    lab_spec_id:
                                                        Number(
                                                            e.target.value,
                                                        ) || null,
                                                })
                                            }
                                        >
                                            <option value="">Tanpa lab</option>
                                            {labs.map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    {l.title} (Sprint 3)
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className="editor-toolbar">
                                    <div>
                                        <button
                                            aria-pressed={!preview}
                                            onClick={() => setPreview(false)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            aria-pressed={preview}
                                            onClick={() => setPreview(true)}
                                        >
                                            Preview
                                        </button>
                                    </div>
                                    <span>Markdown · privat</span>
                                    <button
                                        disabled={busy}
                                        onClick={() => {
                                            blocked.current = false;
                                            void save();
                                        }}
                                    >
                                        <Save size={15} />
                                        Simpan
                                    </button>
                                </div>
                                {preview ? (
                                    <div className="note-preview">
                                        <SafeMarkdown html={html} />
                                    </div>
                                ) : (
                                    <textarea
                                        aria-label="Isi catatan Markdown"
                                        className="markdown-editor"
                                        placeholder={
                                            "# Pemahaman hari ini\n\nTulis ide, contoh, dan pertanyaanmu…"
                                        }
                                        value={draft.body_md}
                                        maxLength={60000}
                                        onChange={(e) =>
                                            edit({ body_md: e.target.value })
                                        }
                                    />
                                )}
                                <div className="editor-footer">
                                    <span>
                                        {draft.body_md.length.toLocaleString(
                                            "id-ID",
                                        )}{" "}
                                        / 60.000 karakter
                                    </span>
                                    <time dateTime={draft.updated_at}>
                                        Diedit{" "}
                                        {new Date(
                                            draft.updated_at,
                                        ).toLocaleString("id-ID", {
                                            timeZone: auth.user.timezone,
                                        })}
                                    </time>
                                </div>
                            </>
                        ) : (
                            <div className="editor-welcome">
                                <NotebookPen size={56} />
                                <h2>Pengetahuan tumbuh saat ditulis.</h2>
                                <p>
                                    Pilih catatan di samping, atau buat ruang
                                    untuk ide berikutnya.
                                </p>
                                <button
                                    className="learning-button"
                                    disabled={busy}
                                    onClick={() => void create()}
                                >
                                    <Plus size={16} />
                                    Tulis catatan pertama
                                </button>
                            </div>
                        )}
                    </section>
                </div>
                <div className="save-feedback">
                    {!draft && <p role="status">{status}</p>}
                    {error && <p role="alert">{error}</p>}
                    {conflict ? (
                        <div>
                            <button onClick={() => select(conflict)}>
                                Muat versi server (buang perubahan lokal)
                            </button>
                            <button
                                disabled={busy}
                                onClick={() => void create(true)}
                            >
                                Simpan lokal sebagai catatan baru
                            </button>
                        </div>
                    ) : (
                        error &&
                        draft && (
                            <button
                                disabled={busy}
                                onClick={() => {
                                    blocked.current = false;
                                    void save();
                                }}
                            >
                                Coba simpan lagi
                            </button>
                        )
                    )}
                </div>
                <p className="editorial-note">
                    Autosave setelah 0,8 detik tanpa mengetik. HTML aktif dan
                    gambar eksternal tidak dirender. Catatan tidak dihitung
                    sebagai kelulusan lab.
                </p>
            </div>
        </AppShell>
    );
}
