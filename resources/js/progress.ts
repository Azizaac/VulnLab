export type ProgressData = {
    period: "7" | "30" | "90" | "all";
    timezone: string;
    summary: {
        roadmap_completed: number;
        roadmap_total: number;
        modules_completed: number;
        modules_total: number;
        lessons_completed: number;
        lessons_total: number;
        quizzes_passed: number;
        quizzes_total: number;
        labs_solved: number;
        labs_total: number;
        verified_minutes: number | null;
        total_xp: number;
        level: number;
        next_level_xp: number;
        level_progress_percent: number;
    };
    activity: {
        date: string;
        lessons: number;
        quizzes: number;
        labs: number;
        reports: number;
        study_minutes: number;
    }[];
    skills: {
        key: string;
        label: string;
        score: number | null;
        knowledge_score: number;
        practice_score: number;
        quiz_passed: number;
        quiz_total: number;
        labs_solved: number;
        labs_total: number;
        reports_accepted: number;
        practice_assessed: boolean;
        explanation: string;
    }[];
    journey: {
        percent: number;
        completed_days: number;
        total_days: number;
        current_day: number | null;
        starts_on: string | null;
        ends_on: string | null;
        next_action: { label: string; href: string };
    };
    streak: {
        current: number;
        longest: number;
        days: { date: string; qualified: boolean }[];
    };
    achievements: {
        code: string;
        name: string;
        description: string;
        icon: string;
        unlocked_at: string | null;
        attainable: boolean;
        progress: number;
        target: number;
    }[];
    has_activity: boolean;
    methodology: string[];
};

export const calendarDate = (
    date: string,
    options: Intl.DateTimeFormatOptions = {},
) =>
    new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", ...options }).format(
        new Date(`${date.slice(0, 10)}T12:00:00Z`),
    );
