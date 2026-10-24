export type Task = {
    lab?: import("./labs").LabCard | null;
    lesson?: import("./learning").LessonSummary | null;
    id: number;
    title: string;
    description: string;
    type: "reading" | "practice" | "lab";
    task_type: string;
    date: string;
    objective: string;
    minutes: number;
    day: number;
    week: number;
    phase_id: number;
    prerequisite: string | null;
    deferred: boolean;
    status: "locked" | "available" | "in_progress" | "completed";
    completed_at: string | null;
};
export type Week = { id: number; number: number; title: string; tasks: Task[] };
export type Phase = {
    id: number;
    title: string;
    category: string;
    milestone: string;
    weeks: Week[];
};
export type RoadmapProps = {
    nextLab?: import("./labs").LabCard | null;
    nextLesson?: import("./learning").LessonSummary | null;
    plan: { starts_on: string; timezone: string; ends_on: string } | null;
    today: { date: string; day: number | null; tasks: Task[] };
    legacyProgress: { title: string; completed_at: string }[];
    phases: Phase[];
    stats: {
        total: number;
        completed: number;
        percent: number;
        remaining_hours: number;
        current_week: number;
        xp: number;
        streak: number;
        labs_solved: number;
        learning_hours: number;
        days_completed: number;
        days_studied: number;
        estimated_reviewed_minutes: number;
        verified_minutes: number;
        lessons_completed: number;
    };
    nextTask: Task | null;
    recommendations: Task[];
    activities: { id: number; type: string; title: string; at: string }[];
};
export type SharedProps = {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            timezone: string;
            theme: "light" | "dark" | "system";
        };
    };
    flash: { success?: string };
    [key: string]: unknown;
};
