import { Link, useForm, usePage } from "@inertiajs/react";
import {
    BookOpen,
    Check,
    CheckCircle2,
    Clock3,
    FlaskConical,
    LockKeyhole,
    PencilRuler,
    Play,
} from "lucide-react";
import type { SharedProps, Task } from "../types";
import { Button } from "./ui/button";

const labels = {
    locked: "Terkunci",
    available: "Tersedia",
    in_progress: "Dikerjakan",
    completed: "Selesai",
};
export default function TaskRow({ task }: { task: Task }) {
    const form = useForm<{ status: "in_progress" | "completed" }>({
        status: "in_progress",
    });
    const { auth } = usePage<SharedProps>().props;
    const Icon =
        task.type === "lab"
            ? FlaskConical
            : task.type === "practice"
              ? PencilRuler
              : BookOpen;
    function update(status: "in_progress" | "completed") {
        form.transform(() => ({ status }));
        form.patch(`/roadmap/items/${task.id}`, { preserveScroll: true });
    }
    return (
        <article
            className={`task-row task-${task.status}`}
            id={`task-${task.id}`}
        >
            <div className="task-heading">
                <span
                    className={`task-icon ${task.status === "completed" ? "is-completed" : ""}`}
                >
                    {task.status === "completed" ? (
                        <CheckCircle2 size={19} />
                    ) : (
                        <Icon size={19} />
                    )}
                </span>
                <div className="task-info">
                    <h4>{task.title}</h4>
                    <div className="task-meta">
                        <span>
                            {task.type === "reading"
                                ? "Bacaan"
                                : task.type === "practice"
                                  ? "Latihan mandiri"
                                  : "Lab"}
                        </span>
                        <span>
                            <Clock3 size={12} /> {task.minutes} menit
                        </span>
                        <span className={`status status-${task.status}`}>
                            {task.deferred
                                ? "Ditunda · Sprint 3"
                                : labels[task.status]}
                        </span>
                    </div>
                </div>
            </div>
            <details className="task-details">
                <summary>Lihat instruksi & prasyarat</summary>
                <p>{task.description}</p>
                <p className="prerequisite">
                    <LockKeyhole size={13} /> Prasyarat:{" "}
                    {task.prerequisite || "Tidak ada — mulai di sini."}
                </p>
                {task.completed_at && (
                    <p>
                        Selesai:{" "}
                        {new Intl.DateTimeFormat("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: auth.user.timezone,
                        }).format(new Date(task.completed_at))}
                    </p>
                )}
            </details>
            <div className="task-actions">
                {task.lab && (
                    <div className="lab-task-evidence">
                        <Link href={`/labs/${task.lab.slug}`}>
                            Lab: {task.lab.title}
                        </Link>
                        <span className="lab-evidence-chip">
                            {task.lab.status === "solved"
                                ? "✓ Praktik lab terverifikasi"
                                : "Praktik lab belum tervalidasi"}
                        </span>
                    </div>
                )}
                {task.lesson && (
                    <div className="lesson-task-link">
                        <Link href={`/learning/${task.lesson.slug}`}>
                            Pelajari: {task.lesson.title}
                        </Link>
                        <span>
                            {task.lesson.completed
                                ? "Bacaan & kuis selesai"
                                : task.lesson.read
                                  ? "Dibaca · kuis belum lulus"
                                  : "Lesson belum selesai"}
                        </span>
                        <Link href={`/notes?lesson=${task.lesson.id}`}>
                            Catat refleksi
                        </Link>
                    </div>
                )}
                {task.status === "available" && (
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={form.processing}
                        onClick={() => update("in_progress")}
                    >
                        <Play size={13} />
                        Mulai
                    </Button>
                )}
                {(task.status === "available" ||
                    task.status === "in_progress") && (
                    <Button
                        size="sm"
                        disabled={form.processing}
                        onClick={() => update("completed")}
                        aria-label={`Tandai direview: ${task.title}`}
                    >
                        <Check size={14} />
                        Tandai direview
                    </Button>
                )}
                {task.status === "locked" && (
                    <span className="locked-caption">
                        <LockKeyhole size={13} />
                        {task.deferred
                            ? "Menunggu runtime lab"
                            : "Selesaikan prasyarat"}
                    </span>
                )}
                {task.status === "completed" && (
                    <span className="completed-caption">
                        <CheckCircle2 size={15} /> Progres tersimpan
                    </span>
                )}
            </div>
            {form.errors.status && (
                <p className="field-error" role="alert">
                    {form.errors.status}
                </p>
            )}
        </article>
    );
}
