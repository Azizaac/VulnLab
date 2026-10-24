import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type ReactNode,
} from "react";
import { Link, router } from "@inertiajs/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
    AlertCircle,
    CheckCircle2,
    Info,
    LoaderCircle,
    X,
    Trophy,
} from "lucide-react";

export type Notice = {
    type: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
    key?: string;
    action?: { label: string; onClick: () => void };
};
type Toast = Notice & { id: string };
type NormalizedError = {
    status: number;
    title: string;
    message: string;
    errors: Record<string, string>;
    retryAfter?: string;
    needsLogin: boolean;
};
export function normalizeLaravelError(error: unknown): NormalizedError {
    const source =
        error && typeof error === "object"
            ? (error as {
                  status?: number;
                  data?: Record<string, unknown>;
                  message?: string;
              })
            : {};
    const status = source.status || 0;
    const data = source.data || {};
    const errors: Record<string, string> = {};
    if (data.errors && typeof data.errors === "object") {
        for (const [key, value] of Object.entries(data.errors))
            errors[key] = Array.isArray(value)
                ? String(value[0])
                : String(value);
    }
    const copy: Record<number, [string, string]> = {
        401: ["Sesi berakhir", "Masuk kembali untuk melanjutkan."],
        419: [
            "Sesi berakhir",
            "Masuk kembali untuk melanjutkan. Simpan salinan perubahan lokal terlebih dahulu.",
        ],
        403: ["Akses ditolak", "Kamu tidak memiliki izin untuk tindakan ini."],
        404: [
            "Konten tidak ditemukan",
            "Konten mungkin telah dihapus atau tidak tersedia untuk akunmu.",
        ],
        409: [
            "Versi telah berubah",
            "Perubahan lokal tetap tersedia. Periksa versi tersimpan sebelum mencoba lagi.",
        ],
        410: ["Sesi lab berakhir", "Mulai ulang lab untuk mencoba lagi."],
        413: [
            "Bukti terlalu besar",
            "Ukuran maksimal setiap file adalah 5 MiB. Pilih file yang lebih kecil lalu coba lagi.",
        ],
        422: [
            "Periksa formulir",
            Object.values(errors)[0] ||
                String(data.message || "Periksa isian yang ditandai."),
        ],
        429: ["Terlalu banyak percobaan", "Coba lagi sebentar."],
    };
    const [title, message] = copy[status] || [
        "Layanan sedang bermasalah",
        "Tidak ada perubahan yang dikonfirmasi. Periksa koneksi lalu coba lagi.",
    ];
    return {
        status,
        title,
        message:
            status === 429 && /^\d+$/.test(String(data.retry_after ?? ""))
                ? `Coba lagi setelah ${data.retry_after} detik.`
                : message,
        errors,
        needsLogin: status === 401 || status === 419,
        retryAfter:
            typeof data.retry_after === "string" ? data.retry_after : undefined,
    };
}
export function focusFirstError(
    errors: Record<string, unknown>,
    scope: ParentNode = document,
) {
    const name = Object.keys(errors)[0];
    if (!name) return;
    requestAnimationFrame(() => {
        const controls = Array.from(
            scope.querySelectorAll<HTMLElement>(
                "input,select,textarea,button,[tabindex]",
            ),
        );
        const control = controls.find(
            (item) =>
                item.getAttribute("name") === name ||
                item.id === name ||
                item.getAttribute("aria-invalid") === "true",
        );
        control?.focus();
        control?.scrollIntoView?.({ block: "center", behavior: "instant" });
    });
}
const FeedbackContext = createContext<{
    notify: (notice: Notice) => string;
    dismiss: (id: string) => void;
}>({ notify: () => "", dismiss: () => {} });
export const useFeedback = () => useContext(FeedbackContext);
export function GlobalToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const recent = useRef(new Map<string, number>());
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    const dismiss = useCallback((id: string) => {
        setToasts((current) => current.filter((item) => item.id !== id));
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
    }, []);
    const notify = useCallback(
        (notice: Notice) => {
            const key =
                notice.key ||
                `${notice.type}:${notice.title}:${notice.message || ""}`;
            const now = Date.now();
            if (now - (recent.current.get(key) || 0) < 6000) return key;
            recent.current.set(key, now);
            for (const [oldKey, time] of recent.current)
                if (now - time > 60000) recent.current.delete(oldKey);
            setToasts((current) =>
                [
                    ...current.filter((item) => item.id !== key),
                    { ...notice, id: key },
                ].slice(-3),
            );
            if (
                !notice.action &&
                notice.type !== "error" &&
                notice.type !== "warning"
            )
                timers.current.set(
                    key,
                    setTimeout(() => dismiss(key), 5000),
                );
            return key;
        },
        [dismiss],
    );
    useEffect(() => {
        const failure = (event: Event) => {
            const error = normalizeLaravelError((event as CustomEvent).detail);
            notify({
                type: "error",
                title: error.title,
                message: error.message,
                key: `http:${error.status}:${error.title}`,
                ...(error.needsLogin
                    ? {
                          action: {
                              label: "Masuk kembali",
                              onClick: () => {
                                  window.location.assign("/login");
                              },
                          },
                      }
                    : {}),
            });
        };
        window.addEventListener("vulnlab:request-error", failure);
        const validation = router.on("error", (event) => {
            focusFirstError(event.detail.errors);
        });
        const exception = router.on("exception", (event) => {
            event.preventDefault();
            notify({
                type: "error",
                title: "Layanan sedang bermasalah",
                message:
                    "Tidak ada perubahan yang dikonfirmasi. Periksa koneksi lalu coba lagi.",
            });
        });
        const activeTimers = timers.current;
        return () => {
            window.removeEventListener("vulnlab:request-error", failure);
            validation();
            exception();
            for (const timer of activeTimers.values()) clearTimeout(timer);
        };
    }, [notify]);
    return (
        <FeedbackContext.Provider value={{ notify, dismiss }}>
            {children}
            <section className="toast-stack" aria-label="Notifikasi tindakan">
                {toasts.map((toast) => (
                    <AppToast
                        key={toast.id}
                        toast={toast}
                        dismiss={() => dismiss(toast.id)}
                    />
                ))}
            </section>
        </FeedbackContext.Provider>
    );
}
export function AppToast({
    toast,
    dismiss,
}: {
    toast: Toast;
    dismiss: () => void;
}) {
    const Icon =
        toast.type === "success"
            ? CheckCircle2
            : toast.type === "info"
              ? Info
              : AlertCircle;
    return (
        <article
            className={`app-toast toast-${toast.type}`}
            role={
                toast.type === "error" || toast.type === "warning"
                    ? "alert"
                    : "status"
            }
        >
            <Icon aria-hidden="true" size={21} />
            <div>
                <strong>{toast.title}</strong>
                {toast.message && <p>{toast.message}</p>}
                {toast.action && (
                    <button
                        type="button"
                        onClick={() => {
                            toast.action!.onClick();
                            dismiss();
                        }}
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>
            <button
                type="button"
                className="icon-button"
                aria-label={`Tutup notifikasi: ${toast.title}`}
                onClick={dismiss}
            >
                <X size={18} />
            </button>
        </article>
    );
}
export function FormFieldError({
    name,
    errors,
    error,
}: {
    name: string;
    errors?: Record<string, string | string[]>;
    error?: string;
}) {
    const value = error || errors?.[name];
    return value ? (
        <p id={`${name}-error`} className="field-error" role="alert">
            {Array.isArray(value) ? value[0] : value}
        </p>
    ) : null;
}
export function LoadingButton({
    loading,
    loadingText = "Menyimpan…",
    children,
    disabled,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    loadingText?: string;
}) {
    return (
        <button
            {...props}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
        >
            {loading && (
                <LoaderCircle
                    size={16}
                    className="pending-spinner"
                    aria-hidden="true"
                />
            )}
            {loading ? loadingText : children}
        </button>
    );
}
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmLabel = "Hapus",
    pending = false,
    destructive = true,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmLabel?: string;
    pending?: boolean;
    destructive?: boolean;
}) {
    const previousFocus = useRef<HTMLElement | null>(null);
    return (
        <Dialog.Root
            open={open}
            onOpenChange={(next) => {
                if (!pending) onOpenChange(next);
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="drawer-overlay" />
                <Dialog.Content
                    className="feedback-dialog"
                    onOpenAutoFocus={(event) => {
                        previousFocus.current =
                            document.activeElement as HTMLElement | null;
                        event.preventDefault();
                        document.getElementById("confirmation-cancel")?.focus();
                    }}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        if (previousFocus.current?.isConnected)
                            previousFocus.current.focus();
                        else
                            document
                                .querySelector<HTMLElement>(
                                    "#main button:not(:disabled), #main a[href], #main",
                                )
                                ?.focus();
                    }}
                >
                    <Dialog.Title>{title}</Dialog.Title>
                    <Dialog.Description>{description}</Dialog.Description>
                    <div className="feedback-actions">
                        <Dialog.Close
                            id="confirmation-cancel"
                            className="button-secondary"
                            disabled={pending}
                        >
                            Batal
                        </Dialog.Close>
                        <LoadingButton
                            className={
                                destructive ? "button-danger" : "button-primary"
                            }
                            loading={pending}
                            loadingText="Memproses…"
                            onClick={onConfirm}
                        >
                            {confirmLabel}
                        </LoadingButton>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
export function SaveStatusIndicator({
    status,
    savedAt,
    onRetry,
}: {
    status: "saved" | "saving" | "unsaved" | "error" | "conflict";
    savedAt?: string | null;
    onRetry?: () => void;
}) {
    const text = {
        saved: "Tersimpan",
        saving: "Menyimpan…",
        unsaved: "Perubahan belum tersimpan",
        error: "Perubahan belum tersimpan",
        conflict: "Konflik versi — perubahan lokal dipertahankan",
    }[status];
    return (
        <div className={`save-status save-${status}`} role="status">
            <span>
                {text}
                {status === "saved" && savedAt
                    ? ` · ${new Date(savedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
                    : ""}
            </span>
            {onRetry && (status === "error" || status === "unsaved") && (
                <button type="button" onClick={onRetry}>
                    Coba lagi
                </button>
            )}
        </div>
    );
}
export function ErrorState({
    title = "Layanan sedang bermasalah",
    message,
    onRetry,
}: {
    title?: string;
    message: string;
    onRetry?: () => void;
}) {
    return (
        <div className="feedback-state" role="alert">
            <AlertCircle aria-hidden="true" />
            <h2>{title}</h2>
            <p>{message}</p>
            {onRetry && (
                <button
                    className="button-secondary"
                    type="button"
                    onClick={onRetry}
                >
                    Coba lagi
                </button>
            )}
        </div>
    );
}
export function EmptyState({
    title,
    children,
}: {
    title: string;
    children?: ReactNode;
}) {
    return (
        <div className="feedback-state">
            <Info aria-hidden="true" />
            <h2>{title}</h2>
            {children}
        </div>
    );
}
export function useUnsavedChanges(dirty: boolean) {
    useEffect(() => {
        if (!dirty) return;
        const beforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", beforeUnload);
        const cancel = router.on("before", (event) => {
            if (event.detail.visit.url.pathname === "/settings/theme") return;
            return window.confirm(
                "Perubahan belum tersimpan. Tinggalkan halaman dan abaikan perubahan lokal?",
            );
        });
        return () => {
            window.removeEventListener("beforeunload", beforeUnload);
            cancel();
        };
    }, [dirty]);
}
export function LabCompletionDialog({
    open,
    onOpenChange,
    title,
    xp,
    labId,
    nextHref,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    xp: number;
    labId: number;
    nextHref?: string;
}) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="drawer-overlay" />
                <Dialog.Content className="feedback-dialog completion-dialog">
                    <Trophy size={42} aria-hidden="true" />
                    <Dialog.Title>Lab berhasil diselesaikan!</Dialog.Title>
                    <Dialog.Description>
                        {title} ·{" "}
                        {xp > 0
                            ? `XP baru: +${xp}`
                            : "0 XP baru — reward sudah pernah diterima."}
                    </Dialog.Description>
                    <p>
                        Validasi server telah tersimpan. Tulis laporan latihan
                        untuk menjelaskan bukti dan mitigasinya.
                    </p>
                    <div className="feedback-actions">
                        <Link
                            href={`/reports/create?lab=${labId}`}
                            className="button-primary"
                        >
                            Tulis laporan latihan
                        </Link>
                        <Link
                            href={nextHref || "/progress"}
                            className="button-secondary"
                        >
                            {nextHref ? "Lab berikutnya" : "Lihat progres"}
                        </Link>
                        <Dialog.Close className="button-secondary">
                            Kembali ke lab
                        </Dialog.Close>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
export function QuizResultPanel({
    passed,
    score,
    correct,
    total,
    xp = 0,
    children,
}: {
    passed: boolean;
    score: number;
    correct: number;
    total: number;
    xp?: number;
    children?: ReactNode;
}) {
    return (
        <section
            className={`quiz-result-panel ${passed ? "quiz-passed" : "quiz-retry"}`}
            aria-label="Hasil kuis"
            tabIndex={-1}
            role="status"
        >
            <h3>
                Kuis selesai — {correct}/{total} benar
            </h3>
            <p>
                <strong>
                    {score}% · {passed ? "Lulus" : "Belum lulus"}
                </strong>{" "}
                · {xp > 0 ? `+${xp} XP baru` : "0 XP baru"}
            </p>
            <p>
                {passed
                    ? "Pemahaman kuis tercatat. Praktik lab dinilai secara terpisah."
                    : "Baca penjelasan jawaban, lalu coba lagi. Progres yang sudah tersimpan tetap tersedia."}
            </p>
            {children}
        </section>
    );
}
