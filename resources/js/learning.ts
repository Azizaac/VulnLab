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
): Promise<T> {
    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="));
    const response = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(cookie
                ? { "X-XSRF-TOKEN": decodeURIComponent(cookie.slice(11)) }
                : {}),
        },
        ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
    if (response.status === 204) return undefined as T;
    const body = await response.json().catch(() => ({
        message:
            "Respons tidak dapat dibaca. Muat ulang setelah menyimpan salinan lokal.",
    }));
    if (!response.ok) throw new RequestError(response.status, body);
    return body;
}
