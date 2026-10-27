import { Head, Link, router } from "@inertiajs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import AppShell from "../components/AppShell";
import SafeMarkdown from "../components/SafeMarkdown";
import {
    ConfirmDialog,
    normalizeLaravelError,
    SaveStatusIndicator,
    useUnsavedChanges,
} from "../feedback";
import { requestJson } from "../learning";
import {
    ActionError,
    ChoiceLists,
    ContentData,
    Field,
    kinds,
    QuizItem,
    Revision,
    RoadTask,
    Source,
    statuses,
    StudioHeading,
    useAction,
    usePermission,
} from "../v5";
type Entry = {
    id: number;
    kind: string;
    slug: string;
    subject_id: number | null;
    is_managed: boolean;
    is_archived: boolean;
    published_revision_id: number | null;
};
type Props = {
    entry: Entry;
    revisions: Revision[];
    choices: ChoiceLists;
    reviews: {
        id: number;
        content_revision_id: number;
        reviewer_id: number;
        decision: string;
        notes: string;
        checks: string;
        created_at: string;
    }[];
    saves: {
        id: number;
        content_revision_id: number;
        lock_version: number;
        actor_id: number;
        created_at: string;
    }[];
};
type Preview = {
    title: string;
    html: string;
    questions: { question: string; choices: { text: string }[] }[];
};
export default function StudioEditor(props: Props) {
    return (
        <Editor
            key={`${props.entry.id}:${props.revisions[0].id}:${props.revisions[0].lock_version}`}
            {...props}
        />
    );
}
function Editor({ entry, revisions, choices, reviews, saves }: Props) {
    const can = usePermission();
    const action = useAction();
    const [revision, setRevision] = useState(revisions[0]);
    const [data, setData] = useState(revision.data_json);
    const [saved, setSaved] = useState(JSON.stringify(data));
    const [saveStatus, setSaveStatus] = useState<
        "saved" | "saving" | "unsaved" | "error" | "conflict"
    >("saved");
    const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
    const [saveError, setSaveError] = useState("");
    const [savedAt, setSavedAt] = useState<string | null>(revision.updated_at);
    const saving = useRef(false);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [checks, setChecks] = useState<Record<string, boolean>>({
        accuracy: false,
        clarity: false,
        safety: false,
        references: false,
        license: false,
    });
    const [archive, setArchive] = useState(false);
    const [selectedDay, setSelectedDay] = useState(1);
    const [cloning, setCloning] = useState(false);
    const [cloneSlug, setCloneSlug] = useState("");
    const [cloneLesson, setCloneLesson] = useState(choices.lessons[0]?.id);
    const editable =
        can("content.edit") &&
        ["draft", "changes_requested"].includes(revision.status) &&
        revision.id === revisions[0].id;
    const dirty = JSON.stringify(data) !== saved;
    useUnsavedChanges(dirty);
    const save = useCallback(async () => {
        if (!editable || saving.current || JSON.stringify(data) === saved)
            return;
        saving.current = true;
        setSaveStatus("saving");
        setSaveError("");
        setSaveErrors({});
        const sent = JSON.stringify(data);
        try {
            const result = await requestJson<{ revision: Revision }>(
                `/studio/revisions/${revision.id}`,
                "PATCH",
                { version: revision.lock_version, data },
            );
            setRevision(result.revision);
            setSaved(sent);
            setSavedAt(result.revision.updated_at);
            setSaveStatus("saved");
        } catch (e) {
            const failure = normalizeLaravelError(e);
            setSaveErrors(failure.errors);
            setSaveError(failure.message);
            setSaveStatus(failure.status === 409 ? "conflict" : "error");
        } finally {
            saving.current = false;
        }
    }, [editable, data, saved, revision.id, revision.lock_version]);
    useEffect(() => {
        if (!editable || !dirty) return;
        setSaveStatus("unsaved");
        const timer = setTimeout(() => void save(), 800);
        return () => clearTimeout(timer);
    }, [data, editable, dirty, save]);
    function patch(p: Partial<ContentData>) {
        setData((old) => ({ ...old, ...p }));
    }
    async function transition(actionName: string) {
        await action.run(async () => {
            const result = await requestJson<{ revision: Revision }>(
                `/studio/revisions/${revision.id}/${actionName}`,
                "POST",
                {
                    version: revision.lock_version,
                    ...(actionName === "review"
                        ? {
                              decision: checks.approve
                                  ? "approve"
                                  : "request_changes",
                              notes: reviewNotes,
                              checks: Object.fromEntries(
                                  Object.entries(checks).filter(
                                      ([key]) => key !== "approve",
                                  ),
                              ),
                          }
                        : {}),
                },
            );
            setRevision(result.revision);
            router.reload({ only: ["entry", "revisions", "reviews", "saves"] });
        }, "Status editorial diperbarui.");
    }
    const errors = { ...saveErrors, ...action.errors };
    const textField = (
        key:
            | "title"
            | "summary"
            | "audience"
            | "body_md"
            | "example_md"
            | "scenario_md"
            | "description",
        label: string,
        multiline = false,
    ) => (
        <Field name={key} label={label} errors={errors}>
            {multiline ? (
                <textarea
                    name={key}
                    value={data[key] ?? ""}
                    rows={key === "body_md" ? 18 : 5}
                    onChange={(e) => patch({ [key]: e.target.value })}
                />
            ) : (
                <input
                    name={key}
                    value={data[key] ?? ""}
                    maxLength={key === "title" ? 180 : 500}
                    onChange={(e) => patch({ [key]: e.target.value })}
                />
            )}
        </Field>
    );
    function lines(
        key: "objectives" | "tags" | "instructions" | "hints",
        label: string,
    ) {
        return (
            <Field name={key} label={label} errors={errors}>
                <textarea
                    name={key}
                    rows={4}
                    value={(data[key] ?? []).join("\n")}
                    onChange={(e) =>
                        patch({ [key]: e.target.value.split("\n") })
                    }
                />
                <small>
                    Satu item per baris. Hapus baris kosong sebelum menyimpan.
                </small>
            </Field>
        );
    }
    const referenceSource = {
        title: "",
        url: "https://",
        publisher: "",
        license: "",
    };
    const currentDay = data.days?.find((d) => d.day_number === selectedDay);
    const updateDay = (
        change: Partial<NonNullable<ContentData["days"]>[number]>,
    ) =>
        patch({
            days: data.days?.map((d) =>
                d.day_number === selectedDay ? { ...d, ...change } : d,
            ),
        });
    const updateTask = (i: number, change: Partial<RoadTask>) =>
        updateDay({
            tasks: currentDay?.tasks.map((t, index) =>
                index === i ? { ...t, ...change } : t,
            ),
        });
    function move<T>(rows: T[], index: number, delta: number): T[] {
        const copy = [...rows];
        const target = index + delta;
        if (target < 0 || target >= rows.length) return copy;
        [copy[index], copy[target]] = [copy[target], copy[index]];
        return copy;
    }
    const published = revisions.find(
        (r) => r.id === entry.published_revision_id,
    );
    function historySelect(r: Revision) {
        if (
            dirty &&
            !window.confirm(
                "Perubahan lokal belum tersimpan. Buka revisi lain?",
            )
        )
            return;
        setRevision(r);
        setData(r.data_json);
        setSaved(JSON.stringify(r.data_json));
        setSaveError("");
        setSaveStatus("saved");
    }
    return (
        <AppShell title="Editor Studio">
            <Head title={`Editor: ${data.title}`} />
            <StudioHeading title={`Editor ${kinds[entry.kind]}`} />
            <div className="v5-editor-toolbar">
                <div>
                    <span className={`v5-pill ${revision.status}`}>
                        {statuses[revision.status]}
                    </span>
                    <span>
                        {" "}
                        Revisi {revision.number} · versi {revision.lock_version}
                    </span>
                    {!entry.is_managed && (
                        <p className="v5-note">
                            Versi lama belum mendapat review manusia melalui
                            Studio.
                        </p>
                    )}
                </div>
                <div className="v5-actions">
                    <SaveStatusIndicator
                        status={saveStatus}
                        savedAt={savedAt}
                        onRetry={() => void save()}
                    />
                    <button
                        className="v5-button secondary"
                        disabled={dirty || action.busy}
                        onClick={() =>
                            void action.run(async () =>
                                setPreview(
                                    await requestJson<Preview>(
                                        `/studio/revisions/${revision.id}/preview`,
                                        "GET",
                                    ),
                                ),
                            )
                        }
                    >
                        Pratinjau pelajar
                    </button>
                    {editable ? (
                        <button
                            className="v5-button"
                            disabled={!dirty || saveStatus === "saving"}
                            onClick={() => void save()}
                        >
                            Simpan Draft
                        </button>
                    ) : (
                        can("content.edit") &&
                        !["in_review", "approved"].includes(
                            revisions[0].status,
                        ) && (
                            <button
                                className="v5-button"
                                disabled={action.busy}
                                onClick={() =>
                                    void action.run(async () => {
                                        await requestJson(
                                            `/studio/content/${entry.id}/draft`,
                                            "POST",
                                            { from_revision_id: revision.id },
                                        );
                                        router.reload();
                                    }, "Draft revisi baru dibuat.")
                                }
                            >
                                Buat revisi dari versi ini
                            </button>
                        )
                    )}
                </div>
            </div>
            <ActionError error={saveError || action.error} errors={errors} />
            {saveStatus === "conflict" && (
                <div className="v5-actions">
                    <button
                        className="v5-button secondary"
                        onClick={() => {
                            const url = URL.createObjectURL(
                                new Blob([JSON.stringify(data, null, 2)], {
                                    type: "application/json",
                                }),
                            );
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `draft-${entry.slug}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                    >
                        Unduh draft lokal
                    </button>
                    <button
                        className="v5-button secondary"
                        onClick={() => {
                            if (
                                window.confirm(
                                    "Muat versi server? Unduh draft lokal dahulu untuk menyimpan perubahan ini.",
                                )
                            )
                                window.location.reload();
                        }}
                    >
                        Muat versi server
                    </button>
                </div>
            )}
            <div className="v5-editor-grid">
                <aside className="v5-card v5-structure">
                    <h2>Struktur konten</h2>
                    <a href="#metadata">01 · Identitas</a>
                    <a href="#body">02 · Konten & aktivitas</a>
                    <a href="#references">03 · Referensi</a>
                    <a href="#editorial">04 · Review & publikasi</a>
                    <a href="#history">05 · Riwayat revisi</a>
                    <p>
                        URL stabil: <code>{entry.slug}</code>
                    </p>
                    <p>
                        Author #{revision.author_id ?? "legacy"}
                        {revision.approved_by
                            ? ` · Reviewer #${revision.approved_by}`
                            : ""}
                    </p>
                    <Link href="/studio/content">Lihat perpustakaan →</Link>
                </aside>
                <div className="v5-editor-main">
                    <fieldset
                        disabled={!editable}
                        className="v5-card v5-form"
                        id="metadata"
                    >
                        <legend className="sr-only">Data konten</legend>
                        <h2>Identitas {kinds[entry.kind]}</h2>
                        {textField("title", "Judul")}
                        <Field name="slug" label="Slug stabil">
                            <input value={data.slug} readOnly />
                        </Field>
                        {["lesson", "quiz", "lab", "module"].includes(
                            entry.kind,
                        ) && (
                            <Field
                                name="parent"
                                label={
                                    entry.kind === "lesson"
                                        ? "Modul"
                                        : entry.kind === "module"
                                          ? "Jalur belajar"
                                          : "Lesson terkait"
                                }
                            >
                                <select
                                    disabled={entry.kind === "quiz"}
                                    value={
                                        entry.kind === "quiz" &&
                                        data.lesson_entry_id
                                            ? `draft:${data.lesson_entry_id}`
                                            : entry.kind === "quiz"
                                              ? `lesson:${data.lesson_id}`
                                              : entry.kind === "lesson"
                                                ? data.module_id
                                                : entry.kind === "module"
                                                  ? data.path_id
                                                  : data.lesson_id
                                    }
                                    onChange={(e) =>
                                        patch({
                                            [entry.kind === "lesson"
                                                ? "module_id"
                                                : entry.kind === "module"
                                                  ? "path_id"
                                                  : "lesson_id"]: Number(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                >
                                    {entry.kind === "quiz" ? (
                                        <>
                                            {choices.lessons.map((m) => (
                                                <option
                                                    key={`lesson:${m.id}`}
                                                    value={`lesson:${m.id}`}
                                                >
                                                    {m.title}
                                                </option>
                                            ))}
                                            {choices.lessonEntries.map((m) => (
                                                <option
                                                    key={`draft:${m.id}`}
                                                    value={`draft:${m.id}`}
                                                >
                                                    {m.title} (
                                                    {m.published
                                                        ? "terbit"
                                                        : "draft"}
                                                    )
                                                </option>
                                            ))}
                                        </>
                                    ) : (
                                        (entry.kind === "lesson"
                                            ? choices.modules
                                            : entry.kind === "module"
                                              ? choices.paths
                                              : choices.lessons
                                        ).map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.title}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {entry.kind === "quiz" &&
                                    data.lesson_entry_id && (
                                        <small>
                                            Lesson terkait harus terbit sebelum
                                            kuis dapat diterbitkan.
                                        </small>
                                    )}
                            </Field>
                        )}
                        {["lesson", "path", "lab"].includes(entry.kind) && (
                            <div className="v5-grid two">
                                <Field name="difficulty" label="Tingkat">
                                    <select
                                        name="difficulty"
                                        value={data.difficulty}
                                        onChange={(e) =>
                                            patch({
                                                difficulty: e.target.value,
                                            })
                                        }
                                    >
                                        {(entry.kind === "lab"
                                            ? ["Easy", "Medium", "Hard"]
                                            : ["Pemula", "Menengah", "Lanjutan"]
                                        ).map((d) => (
                                            <option key={d}>{d}</option>
                                        ))}
                                    </select>
                                </Field>
                                {entry.kind !== "path" && (
                                    <Field
                                        name="minutes"
                                        label="Durasi (menit)"
                                    >
                                        <input
                                            name="minutes"
                                            type="number"
                                            min={1}
                                            max={480}
                                            value={data.minutes}
                                            onChange={(e) =>
                                                patch({
                                                    minutes: Number(
                                                        e.target.value,
                                                    ),
                                                })
                                            }
                                        />
                                    </Field>
                                )}
                            </div>
                        )}
                        <div id="body" className="v5-form">
                            {entry.kind === "lesson" && (
                                <>
                                    {textField("summary", "Ringkasan")}
                                    {textField("audience", "Audiens")}
                                    {lines("objectives", "Tujuan belajar")}
                                    {lines("tags", "Tag")}
                                    <Field
                                        name="prerequisite_ids"
                                        label="Lesson prasyarat (Ctrl/Cmd untuk memilih beberapa)"
                                    >
                                        <select
                                            multiple
                                            value={data.prerequisite_ids?.map(
                                                String,
                                            )}
                                            onChange={(e) =>
                                                patch({
                                                    prerequisite_ids:
                                                        Array.from(
                                                            e.target
                                                                .selectedOptions,
                                                        ).map((o) =>
                                                            Number(o.value),
                                                        ),
                                                })
                                            }
                                        >
                                            {choices.lessons
                                                .filter(
                                                    (l) =>
                                                        l.id !==
                                                        entry.subject_id,
                                                )
                                                .map((l) => (
                                                    <option
                                                        key={l.id}
                                                        value={l.id}
                                                    >
                                                        {l.title}
                                                    </option>
                                                ))}
                                        </select>
                                    </Field>
                                    {textField(
                                        "body_md",
                                        "Konten Markdown",
                                        true,
                                    )}
                                    {textField(
                                        "example_md",
                                        "Contoh lokal (Markdown)",
                                        true,
                                    )}
                                </>
                            )}
                            {entry.kind === "path" && (
                                <>
                                    {textField(
                                        "description",
                                        "Deskripsi jalur",
                                        true,
                                    )}
                                    {lines("objectives", "Hasil belajar")}
                                </>
                            )}
                            {entry.kind === "quiz" && (
                                <>
                                    <div className="v5-grid two">
                                        <Field
                                            name="passing_score"
                                            label="Ambang lulus (%)"
                                        >
                                            <input
                                                type="number"
                                                name="passing_score"
                                                min={1}
                                                max={100}
                                                value={data.passing_score}
                                                onChange={(e) =>
                                                    patch({
                                                        passing_score: Number(
                                                            e.target.value,
                                                        ),
                                                    })
                                                }
                                            />
                                        </Field>
                                        <label className="v5-check">
                                            <input
                                                type="checkbox"
                                                checked={data.randomize}
                                                onChange={(e) =>
                                                    patch({
                                                        randomize:
                                                            e.target.checked,
                                                    })
                                                }
                                            />
                                            Acak soal dan pilihan
                                        </label>
                                    </div>
                                    <p className="v5-note">
                                        Setiap soal memerlukan 2–6 pilihan
                                        berbeda, tepat satu jawaban benar,
                                        penjelasan, dan sumber. Kunci hanya
                                        terlihat dalam editor staf.
                                    </p>
                                    {(data.questions ?? []).map((q, i) => (
                                        <QuizQuestion
                                            key={i}
                                            errors={errors}
                                            question={q}
                                            index={i}
                                            onChange={(question) =>
                                                patch({
                                                    questions:
                                                        data.questions?.map(
                                                            (old, index) =>
                                                                index === i
                                                                    ? question
                                                                    : old,
                                                        ),
                                                })
                                            }
                                            remove={() =>
                                                patch({
                                                    questions:
                                                        data.questions?.filter(
                                                            (_, index) =>
                                                                index !== i,
                                                        ),
                                                })
                                            }
                                            reorder={(delta) =>
                                                patch({
                                                    questions: move(
                                                        data.questions ?? [],
                                                        i,
                                                        delta,
                                                    ),
                                                })
                                            }
                                        />
                                    ))}
                                    <button
                                        type="button"
                                        className="v5-button secondary"
                                        onClick={() =>
                                            patch({
                                                questions: [
                                                    ...(data.questions ?? []),
                                                    {
                                                        question: "",
                                                        explanation: "",
                                                        difficulty: "Pemula",
                                                        source_url: "https://",
                                                        choices: [
                                                            {
                                                                text: "",
                                                                is_correct: true,
                                                            },
                                                            {
                                                                text: "",
                                                                is_correct: false,
                                                            },
                                                        ],
                                                    },
                                                ],
                                            })
                                        }
                                    >
                                        + Tambah soal
                                    </button>
                                </>
                            )}
                            {entry.kind === "lab" && (
                                <>
                                    <p className="v5-note">
                                        Batas metadata: runner, endpoint,
                                        Docker, flag, solusi runtime, dan poin
                                        dikelola oleh kode terpisah. Runner key:{" "}
                                        <code>
                                            {entry.subject_id
                                                ? entry.slug
                                                : "Belum diverifikasi"}
                                        </code>
                                        .
                                    </p>
                                    <Field name="category_id" label="Kategori">
                                        <select
                                            value={data.category_id}
                                            onChange={(e) =>
                                                patch({
                                                    category_id: Number(
                                                        e.target.value,
                                                    ),
                                                })
                                            }
                                        >
                                            {choices.categories.map((c) => (
                                                <option value={c.id} key={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    {textField(
                                        "scenario_md",
                                        "Skenario Markdown",
                                        true,
                                    )}
                                    {lines("objectives", "Tujuan latihan")}
                                    {lines("instructions", "Instruksi")}
                                    {lines(
                                        "hints",
                                        "Petunjuk bertahap (maksimal 3)",
                                    )}
                                    <label className="v5-check">
                                        <input
                                            type="checkbox"
                                            checked={data.visibility}
                                            onChange={(e) =>
                                                patch({
                                                    visibility:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                        Tampilkan dalam katalog setelah publish
                                    </label>
                                </>
                            )}
                            {entry.kind === "roadmap" && (
                                <>
                                    <p className="v5-note">
                                        Snapshot rencana lama tetap tersimpan.
                                        Tugas kuis/lab/laporan hanya selesai
                                        dari bukti server.
                                    </p>
                                    <h3>Tahap & urutan</h3>
                                    {data.stages?.map((stage, i) => (
                                        <div
                                            className="v5-subcard v5-form"
                                            key={stage.key}
                                        >
                                            <Field
                                                name={`stage_${stage.key}`}
                                                label={`Tahap ${i + 1}`}
                                            >
                                                <input
                                                    value={stage.title}
                                                    onChange={(e) =>
                                                        patch({
                                                            stages: data.stages?.map(
                                                                (s, n) =>
                                                                    n === i
                                                                        ? {
                                                                              ...s,
                                                                              title: e
                                                                                  .target
                                                                                  .value,
                                                                          }
                                                                        : s,
                                                            ),
                                                        })
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                name={`milestone_${stage.key}`}
                                                label="Milestone"
                                            >
                                                <textarea
                                                    rows={2}
                                                    value={stage.milestone}
                                                    onChange={(e) =>
                                                        patch({
                                                            stages: data.stages?.map(
                                                                (s, n) =>
                                                                    n === i
                                                                        ? {
                                                                              ...s,
                                                                              milestone:
                                                                                  e
                                                                                      .target
                                                                                      .value,
                                                                          }
                                                                        : s,
                                                            ),
                                                        })
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                name={`category_${stage.key}`}
                                                label="Kategori tahap"
                                            >
                                                <input
                                                    value={stage.category}
                                                    onChange={(e) =>
                                                        patch({
                                                            stages: data.stages?.map(
                                                                (s, n) =>
                                                                    n === i
                                                                        ? {
                                                                              ...s,
                                                                              category:
                                                                                  e
                                                                                      .target
                                                                                      .value,
                                                                          }
                                                                        : s,
                                                            ),
                                                        })
                                                    }
                                                />
                                            </Field>
                                            <div className="v5-actions">
                                                <button
                                                    type="button"
                                                    className="v5-button secondary"
                                                    disabled={i === 0}
                                                    aria-label={`Naikkan tahap ${stage.title}`}
                                                    onClick={() =>
                                                        patch({
                                                            stages: move(
                                                                data.stages ??
                                                                    [],
                                                                i,
                                                                -1,
                                                            ),
                                                        })
                                                    }
                                                >
                                                    ↑ Naik
                                                </button>
                                                <button
                                                    type="button"
                                                    className="v5-button secondary"
                                                    disabled={
                                                        i ===
                                                        (data.stages?.length ??
                                                            0) -
                                                            1
                                                    }
                                                    aria-label={`Turunkan tahap ${stage.title}`}
                                                    onClick={() =>
                                                        patch({
                                                            stages: move(
                                                                data.stages ??
                                                                    [],
                                                                i,
                                                                1,
                                                            ),
                                                        })
                                                    }
                                                >
                                                    ↓ Turun
                                                </button>
                                                <button
                                                    type="button"
                                                    className="v5-button secondary"
                                                    disabled={
                                                        (data.stages?.length ??
                                                            0) <= 1 ||
                                                        data.days?.some(
                                                            (d) =>
                                                                d.stage_key ===
                                                                stage.key,
                                                        )
                                                    }
                                                    onClick={() =>
                                                        patch({
                                                            stages: data.stages?.filter(
                                                                (s) =>
                                                                    s.key !==
                                                                    stage.key,
                                                            ),
                                                        })
                                                    }
                                                >
                                                    Hapus tahap kosong
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="v5-button secondary"
                                        disabled={
                                            (data.stages?.length ?? 0) >= 12
                                        }
                                        onClick={() =>
                                            patch({
                                                stages: [
                                                    ...(data.stages ?? []),
                                                    {
                                                        key: `stage_${crypto.randomUUID().slice(0, 8)}`,
                                                        title: "Tahap baru",
                                                        milestone:
                                                            "Tentukan capaian belajar tahap ini.",
                                                        category:
                                                            "Web Security",
                                                    },
                                                ],
                                            })
                                        }
                                    >
                                        + Tambah tahap
                                    </button>
                                    <p>
                                        Pindahkan hari ke tahap lain sebelum
                                        menghapus sebuah tahap. Penambahan dan
                                        pengurutan hanya berlaku bagi rencana
                                        baru setelah publish.
                                    </p>
                                    <Field
                                        name="selected_day"
                                        label="Edit hari"
                                    >
                                        <select
                                            value={selectedDay}
                                            onChange={(e) =>
                                                setSelectedDay(
                                                    Number(e.target.value),
                                                )
                                            }
                                        >
                                            {data.days?.map((d) => (
                                                <option
                                                    key={d.day_number}
                                                    value={d.day_number}
                                                >
                                                    Hari {d.day_number} ·{" "}
                                                    {d.title}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    {currentDay && (
                                        <>
                                            <Field
                                                name="day_title"
                                                label="Judul hari"
                                            >
                                                <input
                                                    value={currentDay.title}
                                                    onChange={(e) =>
                                                        updateDay({
                                                            title: e.target
                                                                .value,
                                                        })
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                name="day_objective"
                                                label="Tujuan hari"
                                            >
                                                <textarea
                                                    value={currentDay.objective}
                                                    onChange={(e) =>
                                                        updateDay({
                                                            objective:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                name="stage_key"
                                                label="Tahap hari"
                                            >
                                                <select
                                                    value={currentDay.stage_key}
                                                    onChange={(e) =>
                                                        updateDay({
                                                            stage_key:
                                                                e.target.value,
                                                        })
                                                    }
                                                >
                                                    {data.stages?.map((s) => (
                                                        <option
                                                            key={s.key}
                                                            value={s.key}
                                                        >
                                                            {s.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </Field>
                                            {currentDay.tasks.map((task, i) => (
                                                <div
                                                    key={task.key}
                                                    className="v5-subcard v5-form"
                                                >
                                                    <h3>
                                                        Tugas {i + 1} ·{" "}
                                                        {task.key}
                                                    </h3>
                                                    <Field
                                                        name={`task_${task.key}`}
                                                        label="Judul tugas"
                                                    >
                                                        <input
                                                            value={task.title}
                                                            onChange={(e) =>
                                                                updateTask(i, {
                                                                    title: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            }
                                                        />
                                                    </Field>
                                                    <Field
                                                        name={`kind_${task.key}`}
                                                        label="Jenis tugas"
                                                    >
                                                        <select
                                                            value={task.kind}
                                                            onChange={(e) =>
                                                                updateTask(i, {
                                                                    kind: e
                                                                        .target
                                                                        .value,
                                                                    subject_id:
                                                                        null,
                                                                })
                                                            }
                                                        >
                                                            {[
                                                                "theory",
                                                                "practice",
                                                                "reflection",
                                                                "quiz",
                                                                "lab",
                                                                "report",
                                                            ].map((k) => (
                                                                <option key={k}>
                                                                    {k}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </Field>
                                                    <Field
                                                        name={`description_${task.key}`}
                                                        label="Instruksi"
                                                    >
                                                        <textarea
                                                            value={
                                                                task.description
                                                            }
                                                            onChange={(e) =>
                                                                updateTask(i, {
                                                                    description:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                        />
                                                    </Field>
                                                    <Field
                                                        name={`minutes_${task.key}`}
                                                        label="Durasi menit"
                                                    >
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={480}
                                                            value={task.minutes}
                                                            onChange={(e) =>
                                                                updateTask(i, {
                                                                    minutes:
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                })
                                                            }
                                                        />
                                                    </Field>
                                                    {["quiz", "lab"].includes(
                                                        task.kind,
                                                    ) && (
                                                        <Field
                                                            name={`subject_${task.key}`}
                                                            label={
                                                                task.kind ===
                                                                "quiz"
                                                                    ? "Lesson kuis"
                                                                    : "ID lab terbit (lihat daftar Lab)"
                                                            }
                                                        >
                                                            {task.kind ===
                                                            "quiz" ? (
                                                                <select
                                                                    value={
                                                                        task.subject_id ??
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateTask(
                                                                            i,
                                                                            {
                                                                                subject_id:
                                                                                    Number(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    ),
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <option value="">
                                                                        Pilih
                                                                        lesson
                                                                    </option>
                                                                    {choices.lessons.map(
                                                                        (l) => (
                                                                            <option
                                                                                key={
                                                                                    l.id
                                                                                }
                                                                                value={
                                                                                    l.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    l.title
                                                                                }
                                                                            </option>
                                                                        ),
                                                                    )}
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    value={
                                                                        task.subject_id ??
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateTask(
                                                                            i,
                                                                            {
                                                                                subject_id:
                                                                                    Number(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    ),
                                                                            },
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                        </Field>
                                                    )}
                                                    <Field
                                                        name={`prerequisite_${task.key}`}
                                                        label="Prasyarat tugas"
                                                    >
                                                        <select
                                                            value={
                                                                task.prerequisite_key ??
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                updateTask(i, {
                                                                    prerequisite_key:
                                                                        e.target
                                                                            .value ||
                                                                        null,
                                                                })
                                                            }
                                                        >
                                                            <option value="">
                                                                Tanpa prasyarat
                                                            </option>
                                                            {data.days
                                                                ?.flatMap(
                                                                    (d) =>
                                                                        d.tasks,
                                                                )
                                                                .filter(
                                                                    (t) =>
                                                                        t.key !==
                                                                        task.key,
                                                                )
                                                                .map((t) => (
                                                                    <option
                                                                        value={
                                                                            t.key
                                                                        }
                                                                        key={
                                                                            t.key
                                                                        }
                                                                    >
                                                                        {t.key}{" "}
                                                                        ·{" "}
                                                                        {
                                                                            t.title
                                                                        }
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </Field>
                                                    <div className="v5-actions">
                                                        <button
                                                            type="button"
                                                            className="v5-button secondary"
                                                            disabled={i === 0}
                                                            onClick={() =>
                                                                updateDay({
                                                                    tasks: move(
                                                                        currentDay.tasks,
                                                                        i,
                                                                        -1,
                                                                    ),
                                                                })
                                                            }
                                                        >
                                                            ↑ Naikkan tugas
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="v5-button secondary"
                                                            disabled={
                                                                i ===
                                                                currentDay.tasks
                                                                    .length -
                                                                    1
                                                            }
                                                            onClick={() =>
                                                                updateDay({
                                                                    tasks: move(
                                                                        currentDay.tasks,
                                                                        i,
                                                                        1,
                                                                    ),
                                                                })
                                                            }
                                                        >
                                                            ↓ Turunkan tugas
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="v5-button secondary"
                                                            onClick={() =>
                                                                updateDay({
                                                                    tasks: currentDay.tasks.filter(
                                                                        (
                                                                            _,
                                                                            n,
                                                                        ) =>
                                                                            n !==
                                                                            i,
                                                                    ),
                                                                })
                                                            }
                                                        >
                                                            Hapus tugas
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                className="v5-button secondary"
                                                disabled={
                                                    currentDay.tasks.length >= 8
                                                }
                                                onClick={() =>
                                                    updateDay({
                                                        tasks: [
                                                            ...currentDay.tasks,
                                                            {
                                                                key: `day_${selectedDay}_${crypto.randomUUID().slice(0, 8)}`,
                                                                kind: "reflection",
                                                                title: "Refleksi hari ini",
                                                                description:
                                                                    "Tulis hal yang dipahami dan pertanyaan berikutnya.",
                                                                minutes: 10,
                                                                subject_id:
                                                                    null,
                                                                prerequisite_key:
                                                                    null,
                                                            },
                                                        ],
                                                    })
                                                }
                                            >
                                                + Tambah tugas
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </fieldset>
                    <section className="v5-card v5-form" id="editorial">
                        <h2>Review & publikasi</h2>
                        <p>
                            Draft → Review → Disetujui → Terbit. Penulis dan
                            kontributor dilarang menyetujui revisinya sendiri.
                        </p>
                        {editable && (
                            <button
                                className="v5-button"
                                disabled={
                                    dirty || action.busy || saving.current
                                }
                                onClick={() => void transition("submit")}
                            >
                                Kirim Review
                            </button>
                        )}
                        {["in_review", "approved"].includes(revision.status) &&
                            can("content.review") && (
                                <>
                                    <div className="v5-form">
                                        {Object.entries({
                                            accuracy: "Akurasi teknis",
                                            clarity: "Kejelasan bahasa",
                                            safety: "Keamanan latihan lokal",
                                            references:
                                                "Sumber diperiksa manual",
                                            license:
                                                "Lisensi / atribusi diperiksa",
                                        }).map(([key, label]) => (
                                            <label
                                                key={key}
                                                className="v5-check"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checks[key]}
                                                    onChange={(e) =>
                                                        setChecks({
                                                            ...checks,
                                                            [key]: e.target
                                                                .checked,
                                                        })
                                                    }
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                    <Field
                                        name="notes"
                                        label="Catatan reviewer"
                                        errors={errors}
                                    >
                                        <textarea
                                            name="notes"
                                            value={reviewNotes}
                                            onChange={(e) =>
                                                setReviewNotes(e.target.value)
                                            }
                                        />
                                    </Field>
                                    <label className="v5-check">
                                        <input
                                            type="checkbox"
                                            checked={checks.approve ?? false}
                                            onChange={(e) =>
                                                setChecks({
                                                    ...checks,
                                                    approve: e.target.checked,
                                                })
                                            }
                                        />
                                        Setujui revisi (kosongkan untuk meminta
                                        perubahan)
                                    </label>
                                    <button
                                        className="v5-button"
                                        disabled={action.busy}
                                        onClick={() =>
                                            void transition("review")
                                        }
                                    >
                                        Simpan keputusan review
                                    </button>
                                </>
                            )}
                        {revision.status === "approved" &&
                            can("content.publish") && (
                                <button
                                    className="v5-button"
                                    disabled={action.busy}
                                    onClick={() => void transition("publish")}
                                >
                                    Terbitkan revisi
                                </button>
                            )}
                        {revision.status === "approved" &&
                            !can("content.publish") && (
                                <p>
                                    Disetujui. Menunggu publisher yang memiliki
                                    izin publish.
                                </p>
                            )}
                        {reviews.map((review) => (
                            <article className="v5-subcard" key={review.id}>
                                <strong>
                                    {review.decision === "approve"
                                        ? "Disetujui"
                                        : "Perubahan diminta"}{" "}
                                    · Reviewer #{review.reviewer_id}
                                </strong>
                                <p>{review.notes}</p>
                                <small>
                                    Revisi ID {review.content_revision_id} ·{" "}
                                    {new Date(review.created_at).toLocaleString(
                                        "id-ID",
                                    )}
                                </small>
                            </article>
                        ))}
                    </section>
                    <section className="v5-card v5-form" id="history">
                        <h2>Riwayat revisi & perubahan</h2>
                        <div className="v5-actions">
                            {revisions.map((r) => (
                                <button
                                    className="v5-button secondary"
                                    key={r.id}
                                    aria-pressed={r.id === revision.id}
                                    onClick={() => historySelect(r)}
                                >
                                    r{r.number} · {statuses[r.status]}
                                </button>
                            ))}
                        </div>
                        {published && published.id !== revision.id && (
                            <div className="v5-diff">
                                {Object.keys(data)
                                    .filter(
                                        (key) =>
                                            JSON.stringify(
                                                data[key as keyof ContentData],
                                            ) !==
                                            JSON.stringify(
                                                published.data_json[
                                                    key as keyof ContentData
                                                ],
                                            ),
                                    )
                                    .map((key) => (
                                        <details key={key}>
                                            <summary>
                                                {key} berubah sejak versi terbit
                                            </summary>
                                            <div className="v5-grid two">
                                                <div>
                                                    <strong>
                                                        Terbit r
                                                        {published.number}
                                                    </strong>
                                                    <pre>
                                                        {display(
                                                            published.data_json[
                                                                key as keyof ContentData
                                                            ],
                                                        )}
                                                    </pre>
                                                </div>
                                                <div>
                                                    <strong>
                                                        Revisi r
                                                        {revision.number}
                                                    </strong>
                                                    <pre>
                                                        {display(
                                                            data[
                                                                key as keyof ContentData
                                                            ],
                                                        )}
                                                    </pre>
                                                </div>
                                            </div>
                                        </details>
                                    ))}
                            </div>
                        )}
                        <details>
                            <summary>
                                Catatan penyimpanan draft ({saves.length}{" "}
                                terakhir)
                            </summary>
                            {saves.map((s) => (
                                <p key={s.id}>
                                    Revisi ID {s.content_revision_id} · versi{" "}
                                    {s.lock_version} · editor #{s.actor_id} ·{" "}
                                    {new Date(s.created_at).toLocaleString(
                                        "id-ID",
                                    )}
                                </p>
                            ))}
                        </details>
                        {can("content.edit") && entry.kind !== "roadmap" && (
                            <>
                                <button
                                    className="v5-button secondary"
                                    onClick={() => setCloning(!cloning)}
                                >
                                    Salin menjadi konten baru
                                </button>
                                {cloning && (
                                    <div className="v5-form">
                                        <Field
                                            name="clone_slug"
                                            label="Slug salinan"
                                        >
                                            <input
                                                value={cloneSlug}
                                                onChange={(e) =>
                                                    setCloneSlug(e.target.value)
                                                }
                                            />
                                        </Field>
                                        {entry.kind === "quiz" && (
                                            <Field
                                                name="clone_lesson"
                                                label="Lesson tujuan (harus belum memiliki bank kuis)"
                                            >
                                                <select
                                                    value={cloneLesson}
                                                    onChange={(e) =>
                                                        setCloneLesson(
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    {choices.lessons.map(
                                                        (l) => (
                                                            <option
                                                                value={l.id}
                                                                key={l.id}
                                                            >
                                                                {l.title}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </Field>
                                        )}
                                        <button
                                            className="v5-button"
                                            disabled={action.busy}
                                            onClick={() =>
                                                void action.run(async () => {
                                                    const result =
                                                        await requestJson<{
                                                            entry_id: number;
                                                        }>(
                                                            "/studio/content",
                                                            "POST",
                                                            {
                                                                kind: entry.kind,
                                                                data: {
                                                                    ...data,
                                                                    slug: cloneSlug,
                                                                    title: `${data.title} (Salinan)`,
                                                                    ...(entry.kind ===
                                                                    "quiz"
                                                                        ? {
                                                                              lesson_id:
                                                                                  cloneLesson,
                                                                          }
                                                                        : {}),
                                                                },
                                                            },
                                                        );
                                                    router.visit(
                                                        `/studio/content/${result.entry_id}/edit`,
                                                    );
                                                })
                                            }
                                        >
                                            Buat salinan draft
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                        {can("content.publish") && !entry.is_archived && (
                            <button
                                className="v5-button danger"
                                onClick={() => setArchive(true)}
                            >
                                Arsipkan konten
                            </button>
                        )}
                    </section>
                </div>
                <aside className="v5-card v5-form v5-reference" id="references">
                    <h2>Referensi terpercaya</h2>
                    <p>
                        URL hanya menjadi referensi; server tidak mengambil
                        halaman eksternal.
                    </p>
                    <fieldset disabled={!editable} className="v5-form">
                        <legend className="sr-only">Daftar referensi</legend>
                        {data.sources.map((source, i) => (
                            <div className="v5-subcard v5-form" key={i}>
                                {(
                                    [
                                        ["title", "Judul sumber"],
                                        ["url", "URL HTTPS"],
                                        ["publisher", "Penerbit"],
                                        ["license", "Lisensi / atribusi"],
                                    ] as const
                                ).map(([key, label]) => (
                                    <Field
                                        key={key}
                                        name={`sources.${i}.${key}`}
                                        label={`${label} ${i + 1}`}
                                        errors={errors}
                                    >
                                        <input
                                            name={`sources.${i}.${key}`}
                                            value={source[key]}
                                            onChange={(e) =>
                                                patch({
                                                    sources: data.sources.map(
                                                        (s, n) =>
                                                            n === i
                                                                ? {
                                                                      ...s,
                                                                      [key]: e
                                                                          .target
                                                                          .value,
                                                                  }
                                                                : s,
                                                    ),
                                                })
                                            }
                                        />
                                    </Field>
                                ))}
                                <button
                                    type="button"
                                    className="v5-button secondary"
                                    onClick={() =>
                                        patch({
                                            sources: data.sources.filter(
                                                (_, n) => n !== i,
                                            ),
                                        })
                                    }
                                >
                                    Hapus sumber {i + 1}
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            className="v5-button secondary"
                            onClick={() =>
                                patch({
                                    sources: [
                                        ...data.sources,
                                        referenceSource as Source,
                                    ],
                                })
                            }
                        >
                            + Tambah Sumber
                        </button>
                    </fieldset>
                    <h3>Kualitas konten</h3>
                    <p>
                        {data.sources.length} sumber tercatat. Keberadaan sumber
                        belum membuktikan kualitas atau pemeriksaan manusia.
                    </p>
                    <p>
                        Persetujuan hanya tercatat melalui keputusan reviewer
                        pada alur editorial.
                    </p>
                </aside>
            </div>
            <Dialog.Root
                open={!!preview}
                onOpenChange={(open) => !open && setPreview(null)}
            >
                <Dialog.Portal>
                    <Dialog.Overlay className="drawer-overlay" />
                    <Dialog.Content className="v5-preview">
                        <Dialog.Title>{preview?.title}</Dialog.Title>
                        <Dialog.Description>
                            Pratinjau pelajar dari revisi tersimpan. Hasil
                            penilaian tidak ditampilkan.
                        </Dialog.Description>
                        <SafeMarkdown html={preview?.html ?? ""} />
                        {preview?.questions.map((q, i) => (
                            <fieldset className="v5-subcard" key={i}>
                                <legend>{q.question}</legend>
                                {q.choices.map((c, n) => (
                                    <label className="v5-check" key={n}>
                                        <input
                                            type="radio"
                                            name={`preview_${i}`}
                                        />
                                        {c.text}
                                    </label>
                                ))}
                            </fieldset>
                        ))}
                        <Dialog.Close className="v5-button secondary">
                            Tutup pratinjau
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
            <ConfirmDialog
                open={archive}
                onOpenChange={setArchive}
                title="Arsipkan konten?"
                description="Konten disembunyikan dari katalog. Riwayat revisi dan progres pelajar tetap tersimpan. Konten yang masih menjadi prasyarat tidak dapat diarsipkan."
                confirmLabel="Arsipkan"
                pending={action.busy}
                onConfirm={() =>
                    void action.run(async () => {
                        await requestJson(
                            `/studio/content/${entry.id}/archive`,
                            "POST",
                        );
                        setArchive(false);
                        router.reload();
                    }, "Konten diarsipkan.")
                }
            />
        </AppShell>
    );
}
function display(value: unknown): string {
    if (value == null) return "—";
    if (Array.isArray(value)) return value.map(display).join("\n\n");
    if (typeof value === "object")
        return Object.entries(value)
            .map(([key, content]) => `${key}: ${display(content)}`)
            .join("\n");
    return String(value);
}
function QuizQuestion({
    question: q,
    index,
    onChange,
    remove,
    reorder,
    errors,
}: {
    question: QuizItem;
    index: number;
    onChange: (question: QuizItem) => void;
    remove: () => void;
    reorder: (delta: number) => void;
    errors: Record<string, string>;
}) {
    return (
        <section className="v5-subcard v5-form">
            <h3>Soal {index + 1}</h3>
            {q.source_key && (
                <p>
                    ID sumber: <code>{q.source_key}</code>
                </p>
            )}
            <Field
                name={`questions.${index}.question`}
                label="Pertanyaan"
                errors={errors}
            >
                <textarea
                    value={q.question}
                    onChange={(e) =>
                        onChange({ ...q, question: e.target.value })
                    }
                />
            </Field>
            {q.choices.map((c, i) => (
                <div className="v5-quiz-choice" key={i}>
                    <label className="v5-check">
                        <input
                            type="radio"
                            name={`correct_${index}`}
                            checked={c.is_correct}
                            onChange={() =>
                                onChange({
                                    ...q,
                                    choices: q.choices.map((old, n) => ({
                                        ...old,
                                        is_correct: n === i,
                                    })),
                                })
                            }
                        />
                        <span className="sr-only">
                            Jawaban benar pilihan {i + 1}
                        </span>
                    </label>
                    <Field
                        name={`questions.${index}.choices.${i}.text`}
                        label={`Pilihan ${i + 1}`}
                        errors={errors}
                    >
                        <input
                            value={c.text}
                            onChange={(e) =>
                                onChange({
                                    ...q,
                                    choices: q.choices.map((old, n) =>
                                        n === i
                                            ? { ...old, text: e.target.value }
                                            : old,
                                    ),
                                })
                            }
                        />
                    </Field>
                    <button
                        type="button"
                        className="v5-button secondary"
                        disabled={q.choices.length <= 2}
                        aria-label={`Hapus pilihan ${i + 1}`}
                        onClick={() =>
                            onChange({
                                ...q,
                                choices: q.choices.filter((_, n) => n !== i),
                            })
                        }
                    >
                        ×
                    </button>
                </div>
            ))}
            <button
                type="button"
                className="v5-button secondary"
                disabled={q.choices.length >= 6}
                onClick={() =>
                    onChange({
                        ...q,
                        choices: [
                            ...q.choices,
                            { text: "", is_correct: false },
                        ],
                    })
                }
            >
                + Tambah pilihan
            </button>
            <Field
                name={`questions.${index}.explanation`}
                label="Penjelasan jawaban"
                errors={errors}
            >
                <textarea
                    value={q.explanation}
                    onChange={(e) =>
                        onChange({ ...q, explanation: e.target.value })
                    }
                />
            </Field>
            <Field
                name={`questions.${index}.source_url`}
                label="Sumber soal (HTTPS)"
                errors={errors}
            >
                <input
                    value={q.source_url}
                    onChange={(e) =>
                        onChange({ ...q, source_url: e.target.value })
                    }
                />
            </Field>
            <Field
                name={`questions.${index}.difficulty`}
                label="Kesulitan soal"
                errors={errors}
            >
                <select
                    value={q.difficulty}
                    onChange={(e) =>
                        onChange({ ...q, difficulty: e.target.value })
                    }
                >
                    {["Pemula", "Menengah", "Lanjutan"].map((d) => (
                        <option key={d}>{d}</option>
                    ))}
                </select>
            </Field>
            <div className="v5-actions">
                <button
                    className="v5-button secondary"
                    type="button"
                    onClick={() => reorder(-1)}
                    disabled={index === 0}
                >
                    ↑ Soal
                </button>
                <button
                    className="v5-button secondary"
                    type="button"
                    onClick={() => reorder(1)}
                >
                    ↓ Soal
                </button>
                <button
                    className="v5-button secondary"
                    type="button"
                    onClick={remove}
                    disabled={!!q.source_key}
                    title={
                        q.source_key
                            ? "Soal impor mempertahankan ID sumber."
                            : undefined
                    }
                >
                    Hapus soal
                </button>
            </div>
        </section>
    );
}
