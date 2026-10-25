import {
    Children,
    cloneElement,
    FormEvent,
    isValidElement,
    ReactNode,
    useState,
} from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    normalizeLaravelError,
    focusFirstError,
    useFeedback,
} from "./feedback";
import type { SharedProps } from "./types";

export const statuses: Record<string, string> = {
    draft: "Draft",
    in_review: "Dalam review",
    changes_requested: "Perlu revisi",
    approved: "Disetujui",
    published: "Terbit",
    archived: "Diarsipkan",
};
export const kinds: Record<string, string> = {
    lesson: "Materi",
    quiz: "Kuis",
    lab: "Lab",
    roadmap: "Roadmap",
    path: "Jalur belajar",
    module: "Modul",
};
export type ChoiceLists = {
    paths: { id: number; title: string }[];
    modules: { id: number; title: string; learning_path_id: number }[];
    lessons: { id: number; title: string }[];
    categories: { id: number; name: string }[];
    reviewers: { id: number; name: string }[];
};
export type Source = {
    title: string;
    url: string;
    publisher: string;
    license: string;
};
export type QuizItem = {
    question: string;
    explanation: string;
    difficulty: string;
    source_url: string;
    choices: { text: string; is_correct: boolean }[];
};
export type RoadTask = {
    key: string;
    kind: string;
    title: string;
    description: string;
    minutes: number;
    subject_id: number | null;
    prerequisite_key: string | null;
};
export type RoadDay = {
    day_number: number;
    stage_key: string;
    title: string;
    objective: string;
    tasks: RoadTask[];
};
export type ContentData = {
    title: string;
    slug: string;
    sources: Source[];
    module_id?: number;
    summary?: string;
    audience?: string;
    difficulty?: string;
    minutes?: number;
    objectives?: string[];
    tags?: string[];
    prerequisite_ids?: number[];
    body_md?: string;
    example_md?: string;
    lesson_id?: number;
    passing_score?: number;
    randomize?: boolean;
    questions?: QuizItem[];
    category_id?: number;
    scenario_md?: string;
    instructions?: string[];
    hints?: string[];
    visibility?: boolean;
    description?: string;
    path_id?: number;
    stages?: {
        key: string;
        title: string;
        milestone: string;
        category: string;
    }[];
    days?: RoadDay[];
};
export type Revision = {
    id: number;
    number: number;
    lock_version: number;
    status: string;
    data_json: ContentData;
    author_id: number | null;
    approved_by: number | null;
    updated_at: string;
    published_at: string | null;
};
export type ProfileData = {
    name: string;
    username: string | null;
    bio: string | null;
    email: string;
    timezone: string;
    locale: string;
    theme: "system" | "light" | "dark";
    density: string;
    reduced_motion: boolean;
    created_at: string;
    role: string;
    avatar_url: string | null;
    email_verified: boolean;
};
export function usePermission() {
    const { auth } = usePage<SharedProps>().props;
    return (permission: string) =>
        auth.user.permissions?.includes(permission) ?? false;
}
export function useAction() {
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const { notify } = useFeedback();
    async function run(work: () => Promise<void>, success?: string) {
        if (busy) return;
        setBusy(true);
        setError("");
        setErrors({});
        try {
            await work();
            if (success) notify({ type: "success", title: success });
        } catch (e) {
            const failure = normalizeLaravelError(e);
            setErrors(failure.errors);
            setError(`${failure.title} — ${failure.message}`);
            focusFirstError(failure.errors);
        } finally {
            setBusy(false);
        }
    }
    return { busy, errors, error, run };
}
export function Field({
    name,
    label,
    errors,
    children,
}: {
    name: string;
    label: string;
    errors?: Record<string, string>;
    children: ReactNode;
}) {
    return (
        <label
            className="v5-field"
            data-field={name}
            htmlFor={`v5-input-${name}`}
        >
            <span id={`v5-label-${name}`}>{label}</span>
            {Children.map(children, (child) =>
                isValidElement<{
                    id?: string;
                    "aria-labelledby"?: string;
                    "aria-invalid"?: boolean;
                    "aria-describedby"?: string;
                }>(child) &&
                typeof child.type === "string" &&
                ["input", "textarea", "select"].includes(child.type)
                    ? cloneElement(child, {
                          id: `v5-input-${name}`,
                          "aria-labelledby": `v5-label-${name}`,
                          "aria-invalid": !!errors?.[name],
                          "aria-describedby": errors?.[name]
                              ? `v5-error-${name}`
                              : undefined,
                      })
                    : child,
            )}
            {errors?.[name] && (
                <span
                    id={`v5-error-${name}`}
                    className="field-error"
                    role="alert"
                >
                    {errors[name]}
                </span>
            )}
        </label>
    );
}
export function ActionError({
    error,
    errors = {},
}: {
    error: string;
    errors?: Record<string, string>;
}) {
    return error ? (
        <div className="v5-error" role="alert">
            <p>{error}</p>
            {Object.entries(errors).map(([key, text]) => (
                <p key={key}>{text}</p>
            ))}
        </div>
    ) : null;
}
export function StudioNav() {
    const can = usePermission();
    const url = usePage().url.split("?")[0];
    return (
        <nav className="v5-tabs" aria-label="Navigasi Admin Studio">
            {[
                ["/studio", "Overview"],
                ["/studio/content", "Konten"],
                ["/studio/quizzes", "Kuis"],
                ["/studio/labs", "Lab"],
                ["/studio/roadmap", "Roadmap"],
                ["/studio/reviews", "Review"],
                ...(can("users.manage") ? [["/studio/users", "Pengguna"]] : []),
                ...(can("audit.read") ? [["/studio/audit", "Audit"]] : []),
            ].map(([href, label]) => (
                <Link
                    key={href}
                    href={href}
                    aria-current={url === href ? "page" : undefined}
                >
                    {label}
                </Link>
            ))}
        </nav>
    );
}
export function StudioHeading({
    title,
    children,
}: {
    title: string;
    children?: ReactNode;
}) {
    return (
        <>
            <div className="v5-title">
                <div>
                    <p className="v5-eyebrow">VULNLAB · ADMIN STUDIO</p>
                    <h1>{title}</h1>
                    <p>
                        Ruang editorial untuk perjalanan belajar yang terus
                        berkembang.
                    </p>
                </div>
                <Link className="v5-button secondary" href="/learning">
                    Kembali belajar
                </Link>
            </div>
            <StudioNav />
            {children}
        </>
    );
}
export function SectionForm({
    title,
    onSubmit,
    children,
}: {
    title: string;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    children: ReactNode;
}) {
    return (
        <form className="v5-card v5-form" onSubmit={onSubmit}>
            <h2>{title}</h2>
            {children}
        </form>
    );
}
export function Avatar({
    profile,
}: {
    profile: Pick<ProfileData, "avatar_url" | "name">;
}) {
    return (
        <span className="v5-avatar">
            {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" />
            ) : (
                profile.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
            )}
        </span>
    );
}
