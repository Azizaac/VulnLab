import { Head, Link, router } from "@inertiajs/react";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type FormEvent,
} from "react";
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    FilePenLine,
    Paperclip,
    Save,
    Send,
    Trash2,
    Upload,
} from "lucide-react";
import AppShell from "../components/AppShell";
import "../../css/v8-workspaces.css";
import SafeMarkdown from "../components/SafeMarkdown";
import ReportGuidance from "../components/ReportGuidance";
import ReportRubric from "../components/ReportRubric";
import ReportExportActions from "../components/ReportExportActions";
import {
    ConfirmDialog,
    ErrorState,
    FormFieldError,
    LoadingButton,
    SaveStatusIndicator,
    normalizeLaravelError,
    useFeedback,
    useUnsavedChanges,
} from "../feedback";
import { requestJson, RequestError } from "../learning";
import {
    reportFields,
    reportMarkdown,
    severityLabels,
    statusLabels,
    type Report,
    type ReportEvidence,
    type ReportFields,
    type ReportLab,
    type ReportStatus,
} from "../reports";

type Props = {
    report: Report | null;
    prefill?: Partial<Report>;
    labs: ReportLab[];
    statuses: { value: ReportStatus; label: string }[];
    severities: string[];
    readOnly: boolean;
};
type SaveState = "saved" | "saving" | "unsaved" | "error" | "conflict";
const initialReport = (prefill?: Partial<Report>): Report => ({
    id: 0,
    title: "",
    cwe_id: "",
    lab_id: null,
    endpoint: "",
    severity: "medium",
    status: "draft",
    version: 0,
    summary: "",
    prerequisites: "",
    reproduction_md: "",
    expected_md: "",
    actual_md: "",
    evidence_md: "",
    impact_md: "",
    remediation_md: "",
    references_md: "",
    created_at: "",
    updated_at: "",
    reviewed_at: null,
    evidence: [],
    evaluations: [],
    ...prefill,
});

export default function ReportEditor(props: Props) {
    return <Editor key={props.report?.id || "new"} {...props} />;
}

function Editor({
    report: original,
    prefill,
    labs,
    severities,
    readOnly,
}: Props) {
    const [draft, setDraft] = useState<Report>(
        () => original || initialReport(prefill),
    );
    const latest = useRef(draft);
    const saved = useRef(JSON.stringify(reportFields(draft)));
    const saving = useRef<Promise<boolean> | null>(null);
    const blocked = useRef(false);
    const [status, setStatus] = useState<SaveState>(
        original ? "saved" : "unsaved",
    );
    const [busy, setBusy] = useState(false);
    const [action, setAction] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [failure, setFailure] = useState("");
    const [conflict, setConflict] = useState<Report | null>(null);
    const [preview, setPreview] = useState(false);
    const [html, setHtml] = useState("");
    const [previewError, setPreviewError] = useState("");
    const [previewRetry, setPreviewRetry] = useState(0);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [deleteEvidence, setDeleteEvidence] = useState<ReportEvidence | null>(
        null,
    );
    const [leaving, setLeaving] = useState(false);
    const { notify } = useFeedback();
    const dirty = JSON.stringify(reportFields(draft)) !== saved.current;
    const canEdit =
        !readOnly && ["draft", "needs_revision"].includes(draft.status);
    useUnsavedChanges(!leaving && dirty);

    function applyReport(response: Report) {
        saved.current = JSON.stringify(reportFields(response));
        latest.current = response;
        setDraft(response);
        setStatus("saved");
        setErrors({});
        setFailure("");
        blocked.current = false;
    }
    const save = useCallback(
        async (manual = false): Promise<boolean> => {
            if (saving.current) {
                const result = await saving.current;
                if (manual && result)
                    notify({
                        type: "success",
                        title: "Laporan disimpan",
                        message: "Draft berhasil diperbarui.",
                    });
                return result;
            }
            if (blocked.current && !manual) return false;
            if (!latest.current.title.trim() && !manual) return false;
            if (
                latest.current.id &&
                JSON.stringify(reportFields(latest.current)) === saved.current
            ) {
                if (manual)
                    notify({
                        type: "success",
                        title: "Laporan disimpan",
                        message: "Draft sudah tersimpan.",
                    });
                return true;
            }
            blocked.current = false;
            const operation = async () => {
                setBusy(true);
                setStatus("saving");
                setFailure("");
                setErrors({});
                try {
                    do {
                        const snapshot = { ...latest.current };
                        const response = await requestJson<Report>(
                            snapshot.id
                                ? `/reports/${snapshot.id}`
                                : "/reports",
                            snapshot.id ? "PATCH" : "POST",
                            {
                                ...reportFields(snapshot),
                                ...(snapshot.id
                                    ? { version: snapshot.version }
                                    : {}),
                            },
                        );
                        saved.current = JSON.stringify(reportFields(response));
                        latest.current =
                            JSON.stringify(reportFields(latest.current)) ===
                            JSON.stringify(reportFields(snapshot))
                                ? response
                                : {
                                      ...latest.current,
                                      id: response.id,
                                      version: response.version,
                                      created_at: response.created_at,
                                      updated_at: response.updated_at,
                                  };
                        setDraft(latest.current);
                    } while (
                        JSON.stringify(reportFields(latest.current)) !==
                        saved.current
                    );
                    setStatus("saved");
                    if (manual)
                        notify({
                            type: "success",
                            title: "Laporan disimpan",
                            message: "Draft berhasil diperbarui.",
                        });
                    return true;
                } catch (error) {
                    const normalized = normalizeLaravelError(error);
                    setErrors(normalized.errors);
                    setFailure(normalized.message);
                    blocked.current = true;
                    if (error instanceof RequestError && error.status === 409) {
                        setConflict(error.data.current as Report);
                        setStatus("conflict");
                    } else setStatus("error");
                    if (manual || !Object.keys(normalized.errors).length)
                        notify({
                            type: "error",
                            key: "report-save-failed",
                            title: "Gagal menyimpan laporan",
                            message:
                                "Periksa isian atau koneksi lalu coba lagi. Draft tetap tersedia.",
                        });
                    const first = Object.keys(normalized.errors)[0];
                    if (first) {
                        setPreview(false);
                        requestAnimationFrame(() =>
                            document.getElementById(first)?.focus(),
                        );
                    }
                    return false;
                } finally {
                    setBusy(false);
                    saving.current = null;
                }
            };
            saving.current = operation();
            return saving.current;
        },
        [notify],
    );

    useEffect(() => {
        if (!canEdit || !dirty || blocked.current) return;
        const timer = setTimeout(() => {
            void save();
        }, 800);
        return () => clearTimeout(timer);
    }, [draft, canEdit, dirty, save]);
    useEffect(() => {
        if (!original && draft.id && !dirty && !busy && !action)
            router.visit(`/reports/${draft.id}/edit`, {
                replace: true,
                preserveScroll: true,
            });
    }, [original, draft.id, dirty, busy, action]);
    useEffect(() => {
        if (leaving) router.visit("/reports");
    }, [leaving]);
    const previewBody = reportMarkdown(draft);
    useEffect(() => {
        if (!preview) return;
        let active = true;
        setHtml("");
        setPreviewError("");
        const timer = setTimeout(() => {
            void requestJson<{ html: string }>("/notes/preview", "POST", {
                body_md: previewBody,
            })
                .then((response) => {
                    if (active) setHtml(response.html);
                })
                .catch((error) => {
                    if (active)
                        setPreviewError(normalizeLaravelError(error).message);
                });
        }, 300);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [preview, previewBody, previewRetry]);

    function edit(patch: Partial<ReportFields>) {
        latest.current = { ...latest.current, ...patch };
        setDraft(latest.current);
        setStatus("unsaved");
    }
    async function perform(verb: "submit-for-review" | "evaluate" | "archive") {
        if (action || busy) return;
        setAction(verb);
        try {
            if (canEdit && !(await save())) return;
            const current = latest.current;
            const response = await requestJson<Report>(
                `/reports/${current.id}/${verb}`,
                "POST",
                { version: current.version },
            );
            applyReport(response);
            notify({
                type: "success",
                title:
                    verb === "evaluate"
                        ? "Evaluasi internal selesai"
                        : verb === "archive"
                          ? "Laporan diarsipkan"
                          : "Siap untuk tinjauan internal",
                message:
                    verb === "evaluate"
                        ? `${statusLabels[response.status]}. ${response.xp_delta || 0} XP baru. Evaluasi ini memeriksa kelengkapan otomatis.`
                        : verb === "archive"
                          ? "Laporan tetap tersedia melalui filter Arsip."
                          : "Status tersimpan. Belum ada reward sebelum validasi penerimaan latihan.",
            });
        } catch (error) {
            const normalized = normalizeLaravelError(error);
            setErrors(normalized.errors);
            setFailure(normalized.message);
            notify({
                type: "error",
                title: normalized.title,
                message: normalized.message,
            });
            const first = Object.keys(normalized.errors)[0];
            if (first)
                requestAnimationFrame(() =>
                    document.getElementById(first)?.focus(),
                );
        } finally {
            setAction("");
        }
    }
    async function upload(file: File) {
        if (action) return;
        if (file.size > 5 * 1024 * 1024) {
            notify({
                type: "error",
                title: "Bukti terlalu besar",
                message: "Ukuran maksimal setiap file adalah 5 MiB.",
            });
            return;
        }
        setAction("upload");
        try {
            if (!(await save())) return;
            const current = latest.current;
            const form = new FormData();
            form.append("file", file);
            form.append("version", String(current.version));
            const cookie = document.cookie
                .split("; ")
                .find((row) => row.startsWith("XSRF-TOKEN="));
            const response = await fetch(`/reports/${current.id}/evidence`, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    ...(cookie
                        ? {
                              "X-XSRF-TOKEN": decodeURIComponent(
                                  cookie.slice(11),
                              ),
                          }
                        : {}),
                },
                body: form,
            });
            const data = await response.json();
            if (!response.ok) throw new RequestError(response.status, data);
            applyReport(data as Report);
            notify({
                type: "success",
                title: "Bukti ditambahkan",
                message: "File tersimpan secara privat untuk laporan ini.",
            });
        } catch (error) {
            const normalized = normalizeLaravelError(error);
            setErrors(normalized.errors);
            setFailure(normalized.message);
            notify({
                type: "error",
                title: "Gagal mengunggah bukti",
                message: normalized.message,
            });
        } finally {
            setAction("");
        }
    }
    async function removeEvidence() {
        if (!deleteEvidence || action) return;
        setAction("remove-evidence");
        try {
            if (!(await save())) return;
            const response = await requestJson<Report>(
                `/reports/${latest.current.id}/evidence/${deleteEvidence.id}`,
                "DELETE",
                { version: latest.current.version },
            );
            applyReport(response);
            setDeleteEvidence(null);
            notify({ type: "success", title: "Bukti dihapus" });
        } catch (error) {
            const normalized = normalizeLaravelError(error);
            notify({
                type: "error",
                title: normalized.title,
                message: normalized.message,
            });
        } finally {
            setAction("");
        }
    }
    async function removeReport() {
        if (action) return;
        setAction("delete");
        try {
            await requestJson(`/reports/${latest.current.id}`, "DELETE", {
                version: latest.current.version,
            });
            notify({ type: "success", title: "Laporan dihapus" });
            setDeleteOpen(false);
            setLeaving(true);
        } catch (error) {
            const normalized = normalizeLaravelError(error);
            notify({
                type: "error",
                title: normalized.title,
                message: normalized.message,
            });
        } finally {
            setAction("");
        }
    }
    const fields: {
        key: keyof ReportFields;
        label: string;
        hint?: string;
        rows?: number;
    }[] = [
        {
            key: "summary",
            label: "Ringkasan",
            hint: "Jelaskan celah, letak masalah, dan hasil pengujian pada data dummy.",
            rows: 4,
        },
        {
            key: "prerequisites",
            label: "Prasyarat",
            hint: "Akun dummy, role, dan kondisi awal yang dibutuhkan.",
            rows: 3,
        },
        {
            key: "reproduction_md",
            label: "Langkah untuk Reproduksi",
            hint: "1. Mulai sesi sandbox\n2. Gunakan akun dummy yang disediakan\n3. Ulangi request dan catat hasilnya",
            rows: 6,
        },
        {
            key: "expected_md",
            label: "Perilaku Diharapkan",
            hint: "Jelaskan kontrol keamanan yang seharusnya diterapkan.",
            rows: 3,
        },
        {
            key: "actual_md",
            label: "Perilaku Aktual",
            hint: "Apa yang benar-benar diberikan server sandbox?",
            rows: 3,
        },
        {
            key: "evidence_md",
            label: "Bukti / Proof of Concept (PoC) Tersanitasi",
            hint: "Tempel request/response minimal. Hapus token, cookie, password, dan flag.",
            rows: 6,
        },
        {
            key: "impact_md",
            label: "Dampak",
            hint: "Batasi klaim pada dampak yang terbukti.",
            rows: 4,
        },
        {
            key: "remediation_md",
            label: "Rekomendasi Mitigasi",
            hint: "Tuliskan perbaikan spesifik beserta cara mengujinya.",
            rows: 4,
        },
        {
            key: "references_md",
            label: "Referensi",
            hint: "Tautan sumber ditampilkan sebagai teks/tautan; server tidak mengunjunginya.",
            rows: 3,
        },
    ];
    function input(key: keyof ReportFields, label: string, placeholder = "") {
        return (
            <label className="s4-form-field">
                <span id={`${key}-label`}>{label}</span>
                <input
                    id={key}
                    name={key}
                    aria-labelledby={`${key}-label`}
                    value={String(draft[key] || "")}
                    onChange={(e) => edit({ [key]: e.target.value })}
                    readOnly={!canEdit}
                    placeholder={placeholder}
                    aria-invalid={!!errors[key]}
                    aria-describedby={errors[key] ? `${key}-error` : undefined}
                />
                <FormFieldError name={key} errors={errors} />
            </label>
        );
    }
    return (
        <AppShell title="Studio laporan latihan">
            <Head
                title={
                    draft.id ? draft.title || "Laporan latihan" : "Laporan Baru"
                }
            />
            <div className="s4-page s4-report-editor v8-workspace v8-report-editor">
                <Link href="/reports" className="s4-back-link">
                    <ArrowLeft size={17} />
                    Semua laporan
                </Link>
                <header className="s4-page-heading">
                    <div>
                        <span className="eyebrow">PRACTICE REPORTS</span>
                        <h1>Tulis temuan yang mudah direproduksi.</h1>
                        <p>
                            Laporan latihan, bukan submission ke program
                            eksternal.
                        </p>
                    </div>
                    <Link
                        href="/reports/create"
                        className="learning-button secondary"
                    >
                        <FilePenLine size={17} />
                        Laporan Baru
                    </Link>
                </header>
                <div className="s4-report-status-row">
                    <span className={`s4-status-badge ${draft.status}`}>
                        {statusLabels[draft.status]}
                    </span>
                    <SaveStatusIndicator
                        status={
                            dirty && status === "saved" ? "unsaved" : status
                        }
                        savedAt={draft.updated_at || undefined}
                        onRetry={
                            canEdit
                                ? () => {
                                      void save(true);
                                  }
                                : undefined
                        }
                    />
                    {draft.id > 0 && (
                        <span className="s4-caption">
                            Versi {draft.version}
                        </span>
                    )}
                </div>
                {failure && (
                    <ErrorState
                        title={
                            conflict
                                ? "Konflik versi laporan"
                                : "Perubahan belum dikonfirmasi"
                        }
                        message={failure}
                        onRetry={
                            canEdit && !conflict
                                ? () => {
                                      void save(true);
                                  }
                                : undefined
                        }
                    />
                )}
                {conflict && (
                    <div className="s4-conflict" role="alert">
                        <p>
                            Versi server sudah berubah. Draft lokal tetap
                            tersedia. Salin teksmu sebelum memilih versi server.
                        </p>
                        <button
                            className="learning-button secondary"
                            onClick={() => {
                                void navigator.clipboard
                                    .writeText(reportMarkdown(draft))
                                    .then(() =>
                                        notify({
                                            type: "success",
                                            title: "Draft lokal disalin",
                                        }),
                                    )
                                    .catch(() =>
                                        notify({
                                            type: "error",
                                            title: "Gagal menyalin",
                                            message:
                                                "Pilih dan salin teks draft secara manual.",
                                        }),
                                    );
                            }}
                        >
                            Salin draft lokal
                        </button>
                        <button
                            className="learning-button secondary"
                            onClick={() => setDiscardOpen(true)}
                        >
                            Gunakan versi server
                        </button>
                    </div>
                )}
                <div className="s4-report-workspace">
                    <div className="s4-report-main">
                        <form
                            onSubmit={(e: FormEvent) => {
                                e.preventDefault();
                                void save(true);
                            }}
                            noValidate
                        >
                            <div
                                className="s4-editor-tabs"
                                role="group"
                                aria-label="Tampilan laporan"
                            >
                                <button
                                    type="button"
                                    aria-pressed={!preview}
                                    onClick={() => setPreview(false)}
                                >
                                    <FilePenLine size={16} />
                                    {canEdit ? "Edit laporan" : "Isi laporan"}
                                </button>
                                <button
                                    type="button"
                                    aria-pressed={preview}
                                    onClick={() => setPreview(true)}
                                >
                                    <Eye size={16} />
                                    Preview aman
                                </button>
                            </div>
                            {preview ? (
                                <section
                                    className="s4-panel s4-report-preview"
                                    aria-label="Preview laporan"
                                >
                                    {previewError ? (
                                        <ErrorState
                                            message={previewError}
                                            onRetry={() =>
                                                setPreviewRetry((n) => n + 1)
                                            }
                                        />
                                    ) : !html ? (
                                        <p role="status">
                                            Menyiapkan preview...
                                        </p>
                                    ) : (
                                        <SafeMarkdown html={html} />
                                    )}
                                </section>
                            ) : (
                                <div className="s4-report-fields">
                                    <div className="s4-form-title-row">
                                        {input(
                                            "title",
                                            "Judul laporan",
                                            "Contoh: Akses pesanan akun lain pada sandbox VulnShop",
                                        )}
                                        <label className="s4-form-field">
                                            <span id="severity-label">
                                                Severity Usulan
                                            </span>
                                            <select
                                                id="severity"
                                                aria-labelledby="severity-label"
                                                value={draft.severity}
                                                onChange={(e) =>
                                                    edit({
                                                        severity:
                                                            e.target.value,
                                                    })
                                                }
                                                disabled={!canEdit}
                                                aria-invalid={!!errors.severity}
                                                aria-describedby={
                                                    errors.severity
                                                        ? "severity-error"
                                                        : undefined
                                                }
                                            >
                                                {severities.map((item) => (
                                                    <option
                                                        key={item}
                                                        value={item}
                                                    >
                                                        {severityLabels[item] ||
                                                            item}
                                                    </option>
                                                ))}
                                            </select>
                                            <FormFieldError
                                                name="severity"
                                                errors={errors}
                                            />
                                        </label>
                                    </div>
                                    <div className="s4-form-pair">
                                        {input(
                                            "cwe_id",
                                            "Kategori / CWE",
                                            "Contoh: CWE-639",
                                        )}
                                        <label className="s4-form-field">
                                            <span id="lab_id-label">
                                                Lab Terkait
                                            </span>
                                            <select
                                                id="lab_id"
                                                aria-labelledby="lab_id-label"
                                                value={draft.lab_id || ""}
                                                disabled={!canEdit}
                                                onChange={(e) => {
                                                    const lab = labs.find(
                                                        (item) =>
                                                            item.id ===
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                    );
                                                    edit({
                                                        lab_id: lab?.id || null,
                                                        ...(lab
                                                            ? {
                                                                  endpoint:
                                                                      lab.endpoint,
                                                                  cwe_id:
                                                                      draft.cwe_id ||
                                                                      lab.cwe_id ||
                                                                      "",
                                                              }
                                                            : {}),
                                                    });
                                                }}
                                                aria-invalid={!!errors.lab_id}
                                                aria-describedby={
                                                    errors.lab_id
                                                        ? "lab_id-error"
                                                        : undefined
                                                }
                                            >
                                                <option value="">
                                                    Tanpa lab terkait
                                                </option>
                                                {labs.map((lab) => (
                                                    <option
                                                        key={lab.id}
                                                        value={lab.id}
                                                    >
                                                        {lab.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <FormFieldError
                                                name="lab_id"
                                                errors={errors}
                                            />
                                        </label>
                                    </div>
                                    {input(
                                        "endpoint",
                                        "Endpoint Sandbox",
                                        "Contoh: /api/orders/101",
                                    )}
                                    <p className="s4-caption">
                                        Endpoint hanya dokumentasi. Tidak ada
                                        request otomatis atau pengujian target
                                        eksternal.
                                    </p>
                                    <div className="s4-report-body-fields">
                                        {fields.map((field) => (
                                            <label
                                                className={`s4-form-field field-${field.key}`}
                                                key={field.key}
                                            >
                                                <span id={`${field.key}-label`}>
                                                    {field.label}
                                                </span>
                                                <textarea
                                                    id={field.key}
                                                    aria-labelledby={`${field.key}-label`}
                                                    name={field.key}
                                                    rows={field.rows}
                                                    value={String(
                                                        draft[field.key] || "",
                                                    )}
                                                    onChange={(e) =>
                                                        edit({
                                                            [field.key]:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder={field.hint}
                                                    readOnly={!canEdit}
                                                    aria-invalid={
                                                        !!errors[field.key]
                                                    }
                                                    aria-describedby={
                                                        errors[field.key]
                                                            ? `${field.key}-error`
                                                            : undefined
                                                    }
                                                />
                                                <FormFieldError
                                                    name={field.key}
                                                    errors={errors}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="s4-report-savebar">
                                {canEdit ? (
                                    <>
                                        <LoadingButton
                                            type="submit"
                                            loading={busy}
                                            loadingText="Menyimpan..."
                                            disabled={!!action || !!conflict}
                                            className="learning-button secondary"
                                        >
                                            <Save size={17} />
                                            Simpan Draft
                                        </LoadingButton>
                                        <LoadingButton
                                            type="button"
                                            loading={
                                                action === "submit-for-review"
                                            }
                                            loadingText="Mengirim..."
                                            disabled={
                                                busy || !!action || !!conflict
                                            }
                                            onClick={() => {
                                                void perform(
                                                    "submit-for-review",
                                                );
                                            }}
                                            className="learning-button"
                                        >
                                            <Send size={17} />
                                            Kirim untuk Tinjauan Internal
                                        </LoadingButton>
                                    </>
                                ) : ["draft", "needs_revision"].includes(
                                      draft.status,
                                  ) ? (
                                    <Link
                                        href={`/reports/${draft.id}/edit`}
                                        className="learning-button"
                                    >
                                        <FilePenLine size={16} />
                                        Edit Draft
                                    </Link>
                                ) : [
                                      "ready_for_review",
                                      "under_internal_review",
                                  ].includes(draft.status) ? (
                                    <LoadingButton
                                        type="button"
                                        className="learning-button"
                                        loading={action === "evaluate"}
                                        loadingText="Mengevaluasi..."
                                        disabled={!!action}
                                        onClick={() => {
                                            void perform("evaluate");
                                        }}
                                    >
                                        <CheckCircle2 size={17} />
                                        Evaluasi Kelengkapan Otomatis
                                    </LoadingButton>
                                ) : (
                                    <p className="s4-caption">
                                        Laporan{" "}
                                        {draft.status === "archived"
                                            ? "sudah diarsipkan"
                                            : "sudah diterima untuk latihan"}
                                        . Isi tetap tersedia untuk ditinjau dan
                                        diekspor.
                                    </p>
                                )}
                            </div>
                        </form>
                        <section className="s4-panel s4-evidence-section">
                            <div className="s4-panel-heading">
                                <h2>
                                    <Paperclip size={18} />
                                    Bukti Privat
                                </h2>
                                <span>{draft.evidence.length}/5 file</span>
                            </div>
                            <p className="s4-caption">
                                PNG, JPEG, TXT atau LOG · maksimal 5 MiB/file,
                                total 20 MiB. Hapus rahasia dari bukti sebelum
                                mengunggah.
                            </p>
                            {draft.evidence.length ? (
                                <ul className="s4-evidence-list">
                                    {draft.evidence.map((item) => (
                                        <li key={item.id}>
                                            <a href={item.download_url}>
                                                {item.original_filename}
                                            </a>
                                            <small>
                                                {(item.size / 1024).toFixed(1)}{" "}
                                                KiB
                                            </small>
                                            {canEdit && (
                                                <button
                                                    className="s4-icon-button"
                                                    onClick={() =>
                                                        setDeleteEvidence(item)
                                                    }
                                                    disabled={!!action}
                                                    aria-label={`Hapus bukti ${item.original_filename}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="s4-caption">
                                    Belum ada file bukti. PoC teks dapat ditulis
                                    pada form di atas.
                                </p>
                            )}
                            {canEdit && (
                                <label
                                    className={`s4-upload-label ${action ? "disabled" : ""}`}
                                >
                                    <Upload size={17} />
                                    {action === "upload"
                                        ? "Mengunggah..."
                                        : "Tambahkan Bukti Privat"}
                                    <input
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.txt,.log"
                                        disabled={
                                            !!action ||
                                            busy ||
                                            draft.evidence.length >= 5
                                        }
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) void upload(file);
                                            e.target.value = "";
                                        }}
                                    />
                                    <span className="sr-only">
                                        Pilih satu file bukti
                                    </span>
                                </label>
                            )}
                            <FormFieldError name="file" errors={errors} />
                        </section>
                        <ReportRubric evaluations={draft.evaluations} />
                        <ReportExportActions
                            id={draft.id}
                            disabled={dirty || busy}
                        />
                        {draft.id > 0 && (
                            <div className="s4-report-secondary-actions">
                                {draft.status !== "archived" && (
                                    <button
                                        className="learning-button secondary"
                                        disabled={!!action || busy}
                                        onClick={() => {
                                            void perform("archive");
                                        }}
                                    >
                                        Arsipkan Laporan
                                    </button>
                                )}
                                <button
                                    className="s4-danger-button"
                                    disabled={!!action || busy}
                                    onClick={() => setDeleteOpen(true)}
                                >
                                    <Trash2 size={16} />
                                    Hapus Laporan
                                </button>
                            </div>
                        )}
                    </div>
                    <ReportGuidance report={draft} />
                </div>
                <ConfirmDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title="Hapus laporan ini?"
                    description="Laporan dan seluruh bukti privatnya akan dihapus. Tindakan tidak dapat dibatalkan."
                    onConfirm={removeReport}
                    confirmLabel="Hapus Laporan"
                    pending={action === "delete"}
                    destructive
                />
                <ConfirmDialog
                    open={!!deleteEvidence}
                    onOpenChange={(open) => {
                        if (!open) setDeleteEvidence(null);
                    }}
                    title="Hapus bukti ini?"
                    description="File bukti akan dihapus dari laporan pribadi ini."
                    onConfirm={removeEvidence}
                    confirmLabel="Hapus Bukti"
                    pending={action === "remove-evidence"}
                    destructive
                />
                <ConfirmDialog
                    open={discardOpen}
                    onOpenChange={setDiscardOpen}
                    title="Gunakan versi server?"
                    description="Isi lokal akan diganti. Salin draft lokal terlebih dahulu jika masih dibutuhkan."
                    onConfirm={() => {
                        if (conflict) applyReport(conflict);
                        setConflict(null);
                        setDiscardOpen(false);
                    }}
                    confirmLabel="Gunakan versi server"
                />
            </div>
        </AppShell>
    );
}
