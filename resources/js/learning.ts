export type LessonSummary = {
    id: number;
    slug: string;
    title: string;
    module_id: number;
    minutes: number;
    read: boolean;
    quiz_passed: boolean;
    completed: boolean;
    locked: boolean;
    prerequisites: { id: number; slug: string; title: string }[];
};
export type Source = { title: string; url: string };
export type Course = {
    id: number;
    title: string;
    description: string;
    outcomes: string[];
    difficulty: string;
    section: string;
    minutes: number;
    completed: number;
    lessons: LessonSummary[];
    prerequisites: { id: number; slug: string; title: string }[];
    sources: Source[];
};
export type Attempt = {
    xp_delta?: number;
    correct_count?: number;
    total_questions?: number;
    id: number;
    score: number;
    passed: boolean;
    created_at: string;
    feedback: {
        question: string;
        selected: string;
        correct: boolean;
        answer: string;
        explanation: string;
    }[];
};
export class RequestError extends Error {
    constructor(
        public status: number,
        public data: Record<string, unknown>,
    ) {
        super(String(data.message || "Permintaan gagal. Coba lagi."));
    }
}
export async function requestJson<T>(
    url: string,
    method = "GET",
    data?: unknown,
    options: { timeoutMs?: number } = {},
): Promise<T> {
    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="));
    const controller = new AbortController();
    const deadline = window.setTimeout(
        () => controller.abort(),
        options.timeoutMs ?? 25000,
    );
    const multipart = data instanceof FormData;
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            method,
            credentials: "same-origin",
            headers: {
                Accept: "application/json",
                ...(!multipart ? { "Content-Type": "application/json" } : {}),
                "X-Requested-With": "XMLHttpRequest",
                ...(cookie
                    ? { "X-XSRF-TOKEN": decodeURIComponent(cookie.slice(11)) }
                    : {}),
            },
            ...(data !== undefined
                ? { body: multipart ? data : JSON.stringify(data) }
                : {}),
        });
        if (response.status === 204) return undefined as T;
        const body = await response.json().catch((error: unknown) => {
            if (controller.signal.aborted) throw error;
            return {
                invalid_response: true,
                message:
                    "Respons tidak dapat dibaca. Muat ulang setelah menyimpan salinan lokal.",
            };
        });
        if (!response.ok || body.invalid_response) {
            if (response.headers.has("Retry-After"))
                body.retry_after = response.headers.get("Retry-After");
            const error = new RequestError(
                response.ok ? 502 : response.status,
                body,
            );
            if (
                [401, 403, 404, 413, 419, 429, 500, 502, 503].includes(
                    error.status,
                )
            )
                window.dispatchEvent(
                    new CustomEvent("vulnlab:request-error", { detail: error }),
                );
            throw error;
        }
        return body;
    } catch (caught) {
        const error = controller.signal.aborted
            ? new RequestError(408, {
                  message:
                      "Waktu tunggu habis. Hasil penyimpanan belum dapat dipastikan. Simpan salinan lokal dan periksa status sebelum mencoba lagi.",
              })
            : caught;
        // HTTP errors above already dispatch their own actionable status once.
        if (!(caught instanceof RequestError)) {
            window.dispatchEvent(
                new CustomEvent("vulnlab:request-error", { detail: error }),
            );
        }
        throw error;
    } finally {
        window.clearTimeout(deadline);
    }
}
