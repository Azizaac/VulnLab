export type LabCard = {
    id: number;
    slug: string;
    code: string;
    title: string;
    category: string;
    difficulty: "Easy" | "Medium" | "Hard";
    minutes: number;
    points: number;
    objectives: string[];
    lesson: { id: number; slug: string; title: string };
    status: "solved" | "in_progress" | "not_started";
    solved_at: string | null;
    earned_xp: number;
    available: boolean;
};
export type LabSession = {
    id: string;
    generation: number;
    status: string;
    started_at: string;
    expires_at: string;
    solved_at: string | null;
    fixtures: Record<string, string> | null;
};
export type LabResponse = {
    status: number;
    headers: Record<string, string>;
    body: string;
    elapsed_ms: number;
    generation: number;
    history_id?: number;
    request: {
        method: string;
        path: string;
        headers: Record<string, string>;
        body: Record<string, unknown>;
    };
};
export type LabHistory = {
    id: number;
    created_at: string;
    response: LabResponse;
    request: {
        endpoint: string;
        method: string;
        headers: Record<string, string>;
        body: Record<string, unknown>;
        mode: "vulnerable" | "secure";
    };
};
export const difficultyLabel = {
    Easy: "Mudah",
    Medium: "Menengah",
    Hard: "Sulit",
};
export const labStatus = {
    solved: "Selesai",
    in_progress: "Dikerjakan",
    not_started: "Belum dimulai",
};
