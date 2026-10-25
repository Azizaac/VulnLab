import { Head, Link, router } from "@inertiajs/react";
import { FormEvent, useState } from "react";
import AppShell from "../components/AppShell";
import { requestJson } from "../learning";
import {
    ActionError,
    ChoiceLists,
    ContentData,
    Field,
    kinds,
    statuses,
    StudioHeading,
    useAction,
    usePermission,
} from "../v5";
type Entry = {
    id: number;
    kind: string;
    title: string;
    status: string;
    revision: number;
    updated_at: string;
    legacy: boolean;
};
type ManagedUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    suspended_at: string | null;
    can_publish: boolean;
};
type Paged<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
type Props = {
    section: string;
    entries: Paged<Entry>;
    counts: Record<string, number>;
    choices: ChoiceLists;
    filters: Record<string, string>;
    users: Paged<ManagedUser> | null;
    reviewQueue: {
        entry_id: number;
        title: string;
        author_id: number | null;
        updated_at: string;
    }[];
    audit: {
        id: number;
        actor_id: number | null;
        action: string;
        subject_type: string;
        subject_id: number;
        created_at: string;
        metadata_json: string;
    }[];
};
export default function Studio({
    section,
    entries,
    counts,
    choices,
    filters,
    users,
    audit,
    reviewQueue,
}: Props) {
    const can = usePermission();
    const action = useAction();
    const [creating, setCreating] = useState(false);
    const [kind, setKind] = useState(
        section === "quizzes" ? "quiz" : section === "labs" ? "lab" : "lesson",
    );
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [createLesson, setCreateLesson] = useState(choices.lessons[0]?.id);
    const [search, setSearch] = useState(filters.q ?? "");
    const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
    const [password, setPassword] = useState("");
    const titles: Record<string, string> = {
        overview: "Konten yang baik, belajar lebih mudah.",
        content: "Perpustakaan konten",
        quizzes: "Quiz Builder",
        labs: "Metadata lab",
        roadmap: "Template roadmap",
        reviews: "Antrean editorial",
        users: "Kelola pengguna",
        audit: "Jejak audit",
    };
    async function create(e: FormEvent) {
        e.preventDefault();
        await action.run(async () => {
            const base = { title, slug, sources: [] };
            const defaultLesson = createLesson;
            let data: ContentData = base;
            if (kind === "lesson")
                data = {
                    ...base,
                    module_id: choices.modules[0]?.id,
                    summary: "",
                    audience: "",
                    difficulty: "Pemula",
                    minutes: 15,
                    objectives: [],
                    tags: [],
                    prerequisite_ids: [],
                    body_md: "",
                    example_md: "",
                };
            if (kind === "quiz")
                data = {
                    ...base,
                    lesson_id: defaultLesson,
                    passing_score: 70,
                    randomize: true,
                    questions: [],
                };
            if (kind === "lab")
                data = {
                    ...base,
                    lesson_id: defaultLesson,
                    category_id: choices.categories[0]?.id,
                    difficulty: "Easy",
                    minutes: 20,
                    scenario_md: "",
                    objectives: [],
                    instructions: [],
                    hints: [],
                    visibility: true,
                };
            if (kind === "path")
                data = {
                    ...base,
                    description: "",
                    difficulty: "Pemula",
                    objectives: [],
                };
            if (kind === "module")
                data = { ...base, path_id: choices.paths[0]?.id };
            const result = await requestJson<{ entry_id: number }>(
                "/studio/content",
                "POST",
                { kind, data },
            );
            router.visit(`/studio/content/${result.entry_id}/edit`);
        });
    }
    const list = (
        <section className="v5-card">
            <div className="v5-row">
                <div>
                    <h2>
                        {section === "reviews"
                            ? "Menunggu reviewer"
                            : "Konten tersimpan"}
                    </h2>
                    <p>
                        Materi lama tetap tersedia dengan label belum direview
                        ulang.
                    </p>
                </div>
                {can("content.edit") && (
                    <button
                        className="v5-button"
                        onClick={() => setCreating(!creating)}
                    >
                        + Konten Baru
                    </button>
                )}
            </div>
            <form
                className="v5-filter"
                onSubmit={(e) => {
                    e.preventDefault();
                    router.get(
                        `/studio/${section === "overview" ? "content" : section}`,
                        { ...filters, q: search, page: 1 },
                    );
                }}
            >
                <Field name="q" label="Cari konten">
                    <input
                        name="q"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Judul materi…"
                    />
                </Field>
                <Field name="status" label="Status">
                    <select
                        name="status"
                        defaultValue={filters.status ?? ""}
                        onChange={(e) =>
                            router.get(
                                `/studio/${section === "overview" ? "content" : section}`,
                                { ...filters, status: e.target.value, page: 1 },
                            )
                        }
                    >
                        <option value="">Semua status</option>
                        {Object.entries(statuses).map(([key, label]) => (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field name="difficulty" label="Kesulitan">
                    <select
                        value={filters.difficulty ?? ""}
                        onChange={(e) =>
                            router.get(
                                `/studio/${section === "overview" ? "content" : section}`,
                                {
                                    ...filters,
                                    difficulty: e.target.value,
                                    page: 1,
                                },
                            )
                        }
                    >
                        <option value="">Semua tingkat</option>
                        {[
                            "Pemula",
                            "Menengah",
                            "Lanjutan",
                            "Easy",
                            "Medium",
                            "Hard",
                        ].map((d) => (
                            <option key={d}>{d}</option>
                        ))}
                    </select>
                </Field>
                <Field name="sort" label="Urutkan">
                    <select
                        value={filters.sort ?? "updated"}
                        onChange={(e) =>
                            router.get(
                                `/studio/${section === "overview" ? "content" : section}`,
                                { ...filters, sort: e.target.value, page: 1 },
                            )
                        }
                    >
                        <option value="updated">Terakhir diperbarui</option>
                        <option value="title">Judul A–Z</option>
                    </select>
                </Field>
                <button className="v5-button secondary">Cari</button>
            </form>
            <details>
                <summary>Filter jalur & reviewer</summary>
                <div className="v5-grid two">
                    <Field name="path_id" label="Jalur belajar">
                        <select
                            value={filters.path_id ?? ""}
                            onChange={(e) =>
                                router.get(
                                    `/studio/${section === "overview" ? "content" : section}`,
                                    {
                                        ...filters,
                                        path_id: e.target.value,
                                        page: 1,
                                    },
                                )
                            }
                        >
                            <option value="">Semua jalur</option>
                            {choices.paths.map((p) => (
                                <option value={p.id} key={p.id}>
                                    {p.title}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field name="reviewer_id" label="Reviewer persetujuan">
                        <select
                            value={filters.reviewer_id ?? ""}
                            onChange={(e) =>
                                router.get(
                                    `/studio/${section === "overview" ? "content" : section}`,
                                    {
                                        ...filters,
                                        reviewer_id: e.target.value,
                                        page: 1,
                                    },
                                )
                            }
                        >
                            <option value="">Semua reviewer</option>
                            {choices.reviewers.map((p) => (
                                <option value={p.id} key={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>
            </details>
            {!entries.data.length && (
                <p className="v5-empty">
                    Belum ada konten yang cocok dengan filter ini.
                </p>
            )}
            <div className="v5-content-list">
                {entries.data.map((entry) => (
                    <Link
                        href={`/studio/content/${entry.id}/edit`}
                        key={entry.id}
                        className="v5-row"
                    >
                        <span className="v5-content-icon" aria-hidden="true">
                            {entry.kind === "lesson"
                                ? "▤"
                                : entry.kind === "lab"
                                  ? "⚗"
                                  : "◇"}
                        </span>
                        <div className="v5-grow">
                            <strong>{entry.title}</strong>
                            <p>
                                {kinds[entry.kind]} · Revisi {entry.revision} ·{" "}
                                {entry.legacy
                                    ? "Versi lama, belum direview ulang"
                                    : "Alur editorial V5"}
                            </p>
                        </div>
                        <span className={`v5-pill ${entry.status}`}>
                            {statuses[entry.status]}
                        </span>
                    </Link>
                ))}
            </div>
            <Pagination page={entries} />
        </section>
    );
    return (
        <AppShell title="Admin Studio">
            <Head title="Admin Studio" />
            <StudioHeading title={titles[section]} />
            {section === "overview" && (
                <div className="v5-grid four">
                    {[
                        "draft",
                        "in_review",
                        "published",
                        "changes_requested",
                    ].map((s) => (
                        <Link
                            href={`/studio/content?status=${s}`}
                            className="v5-card v5-stat"
                            key={s}
                        >
                            <p>{statuses[s]}</p>
                            <strong>{counts[s] ?? 0}</strong>
                            <span className={`v5-pill ${s}`}>
                                Dari database
                            </span>
                        </Link>
                    ))}
                </div>
            )}
            {section === "overview" && (
                <div className="v5-grid two">
                    <section className="v5-card">
                        <h2>Antrean editorial</h2>
                        <p>Revisi yang benar-benar menunggu pemeriksaan.</p>
                        {reviewQueue.length ? (
                            reviewQueue.map((item) => (
                                <Link
                                    className="v5-row"
                                    href={`/studio/content/${item.entry_id}/edit`}
                                    key={item.entry_id}
                                >
                                    <div>
                                        <strong>{item.title}</strong>
                                        <p>
                                            Author #{item.author_id} ·{" "}
                                            {new Date(
                                                item.updated_at,
                                            ).toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                    <span className="v5-pill in_review">
                                        Review
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <p className="v5-empty">
                                Antrean review sedang kosong.
                            </p>
                        )}
                        <Link
                            className="v5-button secondary"
                            href="/studio/reviews"
                        >
                            Lihat antrean review
                        </Link>
                    </section>
                    <section className="v5-card v5-form">
                        <h2>Aksi cepat</h2>
                        <div className="v5-grid two">
                            <Link
                                className="v5-button secondary"
                                href="/studio/content"
                            >
                                Kelola materi
                            </Link>
                            <Link
                                className="v5-button secondary"
                                href="/studio/quizzes"
                            >
                                Quiz Builder
                            </Link>
                            <Link
                                className="v5-button secondary"
                                href="/studio/labs"
                            >
                                Metadata lab
                            </Link>
                            <Link
                                className="v5-button secondary"
                                href="/studio/roadmap"
                            >
                                Template roadmap
                            </Link>
                        </div>
                        <p className="v5-note">
                            Draft dan publikasi dipisahkan. Versi yang sedang
                            tayang tetap tersedia selama revisi berikutnya
                            diperiksa.
                        </p>
                        {can("audit.read") && (
                            <>
                                <h3>Aktivitas terbaru</h3>
                                {audit.slice(0, 4).map((event) => (
                                    <p key={event.id}>
                                        {event.action} ·{" "}
                                        {new Date(
                                            event.created_at,
                                        ).toLocaleString("id-ID")}
                                    </p>
                                ))}
                                <Link href="/studio/audit">
                                    Buka jejak audit →
                                </Link>
                            </>
                        )}
                    </section>
                </div>
            )}
            {section === "labs" && (
                <p className="v5-note">
                    Studio mengelola instruksi, sumber, dan petunjuk.
                    Konfigurasi runner, Docker, flag, endpoint, serta poin tidak
                    dapat diedit di sini. Metadata baru belum memiliki runtime.
                </p>
            )}
            {section === "roadmap" && (
                <p className="v5-note">
                    Publikasi berlaku untuk rencana baru. Rencana 90 hari dan
                    progres pelajar yang sudah terdaftar tetap memakai snapshot
                    sebelumnya.
                </p>
            )}
            {creating && (
                <form className="v5-card v5-form" onSubmit={create}>
                    <h2>Konten baru</h2>
                    <Field name="kind" label="Jenis konten">
                        <select
                            value={kind}
                            onChange={(e) => setKind(e.target.value)}
                        >
                            {Object.entries(kinds)
                                .filter(([key]) => key !== "roadmap")
                                .map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {value}
                                    </option>
                                ))}
                        </select>
                    </Field>
                    {kind === "quiz" && (
                        <Field name="create_lesson" label="Lesson untuk kuis">
                            <select
                                value={createLesson}
                                onChange={(e) =>
                                    setCreateLesson(Number(e.target.value))
                                }
                            >
                                {choices.lessons.map((lesson) => (
                                    <option key={lesson.id} value={lesson.id}>
                                        {lesson.title}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    )}
                    <div className="v5-grid two">
                        <Field
                            name="title"
                            label="Judul"
                            errors={action.errors}
                        >
                            <input
                                name="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </Field>
                        <Field
                            name="slug"
                            label="Slug URL stabil"
                            errors={action.errors}
                        >
                            <input
                                name="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="materi-baru"
                            />
                        </Field>
                    </div>
                    <p>
                        Pilih lesson di editor kuis. Bank kuis yang sudah ada
                        diperbarui melalui revisi; tidak dapat diduplikasi.
                    </p>
                    <button className="v5-button" disabled={action.busy}>
                        Buat Draft
                    </button>
                </form>
            )}
            <ActionError error={action.error} errors={action.errors} />
            {section === "users" && users ? (
                <>
                    <form
                        className="v5-filter"
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.get("/studio/users", { q: search });
                        }}
                    >
                        <Field name="q" label="Cari pengguna">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </Field>
                        <button className="v5-button">Cari</button>
                    </form>
                    <section className="v5-card">
                        <h2>Pengguna terdaftar</h2>
                        {users.data.map((user) => (
                            <div className="v5-row" key={user.id}>
                                <div>
                                    <strong>{user.name}</strong>
                                    <p>
                                        {user.email} · {user.role}
                                        {user.suspended_at
                                            ? " · Ditangguhkan"
                                            : " · Aktif"}
                                    </p>
                                </div>
                                <button
                                    className="v5-button secondary"
                                    onClick={() => setSelectedUser(user)}
                                >
                                    Kelola izin {user.id}
                                </button>
                            </div>
                        ))}
                        <Pagination page={users} />
                    </section>
                    {selectedUser && (
                        <form
                            className="v5-card v5-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void action.run(async () => {
                                    await requestJson(
                                        `/studio/users/${selectedUser.id}`,
                                        "PATCH",
                                        {
                                            role: selectedUser.role,
                                            suspended:
                                                !!selectedUser.suspended_at,
                                            can_publish:
                                                selectedUser.can_publish,
                                            current_password: password,
                                        },
                                    );
                                    setSelectedUser(null);
                                    setPassword("");
                                    router.reload({ only: ["users", "audit"] });
                                }, "Izin pengguna diperbarui.");
                            }}
                        >
                            <h2>Izin {selectedUser.name}</h2>
                            <Field name="role" label="Peran">
                                <select
                                    value={selectedUser.role}
                                    onChange={(e) =>
                                        setSelectedUser({
                                            ...selectedUser,
                                            role: e.target.value,
                                        })
                                    }
                                >
                                    {[
                                        "learner",
                                        "editor",
                                        "reviewer",
                                        "admin",
                                    ].map((r) => (
                                        <option key={r}>{r}</option>
                                    ))}
                                </select>
                            </Field>
                            <label className="v5-check">
                                <input
                                    type="checkbox"
                                    checked={!!selectedUser.suspended_at}
                                    onChange={(e) =>
                                        setSelectedUser({
                                            ...selectedUser,
                                            suspended_at: e.target.checked
                                                ? "pending"
                                                : null,
                                        })
                                    }
                                />
                                Tangguhkan akun
                            </label>
                            {selectedUser.role === "reviewer" && (
                                <label className="v5-check">
                                    <input
                                        type="checkbox"
                                        checked={selectedUser.can_publish}
                                        onChange={(e) =>
                                            setSelectedUser({
                                                ...selectedUser,
                                                can_publish: e.target.checked,
                                            })
                                        }
                                    />
                                    Izin publish eksplisit untuk reviewer
                                </label>
                            )}
                            <Field
                                name="current_password"
                                label="Password admin saat ini"
                                errors={action.errors}
                            >
                                <input
                                    name="current_password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                            </Field>
                            <p>
                                Perubahan mencabut seluruh sesi lama pengguna.
                                Admin aktif terakhir dilindungi.
                            </p>
                            <div className="v5-actions">
                                <button
                                    type="button"
                                    className="v5-button secondary"
                                    onClick={() => setSelectedUser(null)}
                                >
                                    Batal
                                </button>
                                <button
                                    className="v5-button"
                                    disabled={action.busy}
                                >
                                    Simpan izin
                                </button>
                            </div>
                        </form>
                    )}
                </>
            ) : section === "audit" ? (
                <section className="v5-card">
                    <h2>100 kejadian terbaru</h2>
                    <p>
                        Audit hanya menyimpan identitas tindakan dan metadata
                        izin/versi.
                    </p>
                    {audit.map((a) => (
                        <div className="v5-row" key={a.id}>
                            <div>
                                <strong>{a.action}</strong>
                                <p>
                                    Operator {a.actor_id ?? "CLI"} ·{" "}
                                    {a.subject_type} #{a.subject_id}
                                </p>
                                <code>{a.metadata_json}</code>
                            </div>
                            <time>
                                {new Date(a.created_at).toLocaleString("id-ID")}
                            </time>
                        </div>
                    ))}
                </section>
            ) : (
                list
            )}
        </AppShell>
    );
}
function Pagination({
    page,
}: {
    page: {
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
}) {
    return (
        <nav className="v5-actions" aria-label="Halaman daftar">
            {page.prev_page_url && (
                <Link className="v5-button secondary" href={page.prev_page_url}>
                    Sebelumnya
                </Link>
            )}
            <span>
                Halaman {page.current_page} dari {page.last_page}
            </span>
            {page.next_page_url && (
                <Link className="v5-button secondary" href={page.next_page_url}>
                    Berikutnya
                </Link>
            )}
        </nav>
    );
}
