import { Head, Link } from "@inertiajs/react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import {
    ArrowDown,
    ArrowRight,
    Check,
    ChevronDown,
    Clock3,
    List,
    Map,
    Search,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { PathIllustration } from "../components/JourneyArt";
import PlanForm from "../components/PlanForm";
import TaskRow from "../components/TaskRow";
import { Button } from "../components/ui/button";
import type { RoadmapProps } from "../types";
import "../../css/v8-dashboard-roadmap.css";
export const stageNames = [
    "Dasar Keamanan Web",
    "Eksplorasi Web",
    "Advanced Topics",
    "Bug Bounty Practice",
    "Siap ke Dunia Nyata",
];
export default function Roadmap({
    plan,
    today,
    phases,
    stats,
    nextTask,
    selectedPhase,
    search = "",
    template_update_available,
}: RoadmapProps & { selectedPhase: number | null; search: string }) {
    const requestedDay = Number(
        new URLSearchParams(window.location.search).get("day"),
    );
    const tasks = phases
        .flatMap((phase) => phase.weeks.flatMap((week) => week.tasks))
        .sort((a, b) => a.day - b.day || a.id - b.id);
    const initialDay =
        requestedDay >= 1 && requestedDay <= 90
            ? requestedDay
            : nextTask?.day || 1;
    const names =
        plan?.template_revision_id && phases.length
            ? phases.map((p) => p.title)
            : stageNames;
    const initialPhase = tasks.find(
        (task) => task.day === initialDay,
    )?.phase_id;
    const templateStage = phases.findIndex(
        (phase) => phase.id === initialPhase,
    );
    const [stage, setStage] = useState(
        plan?.template_revision_id && templateStage >= 0
            ? templateStage
            : Math.min(names.length - 1, Math.floor((initialDay - 1) / 18)),
    );
    const [list, setList] = useState(
        !!search || !!requestedDay || !!selectedPhase,
    );
    const [query, setQuery] = useState(search);
    const [category, setCategory] = useState("Semua");
    const [all, setAll] = useState(!!search || !!selectedPhase);
    const nodes = useRef<(HTMLButtonElement | null)[]>([]);
    const listHeading = useRef<HTMLHeadingElement>(null);
    const planSection = useRef<HTMLDivElement>(null);
    const inStage = (task: (typeof tasks)[number], index: number) =>
        plan?.template_revision_id
            ? task.phase_id === phases[index]?.id
            : Math.floor((task.day - 1) / 18) === index;
    const stages = names.map((title, index) => {
        const items = tasks.filter((task) => inStage(task, index));
        const done = items.filter((task) => task.status === "completed").length;
        return {
            title,
            items,
            done,
            percent: items.length ? Math.round((done / items.length) * 100) : 0,
            status:
                items.length && done === items.length
                    ? "Selesai"
                    : items.some(
                            (task) =>
                                task.status === "available" ||
                                task.status === "in_progress",
                        )
                      ? "Aktif"
                      : "Terkunci",
        };
    });
    const selected = stages[stage];
    const matches = tasks.filter(
        (task) =>
            (all || inStage(task, stage)) &&
            (!selectedPhase || task.phase_id === selectedPhase) &&
            (category === "Semua" ||
                phases.find((phase) => phase.id === task.phase_id)?.category ===
                    category) &&
            `${task.title} ${task.description}`
                .toLocaleLowerCase("id")
                .includes(query.toLocaleLowerCase("id")),
    );
    const days = [...new Set(matches.map((task) => task.day))];
    useEffect(() => {
        if (window.location.hash && list) {
            const timer = setTimeout(
                () =>
                    document
                        .getElementById(window.location.hash.slice(1))
                        ?.scrollIntoView({ block: "center" }),
                120,
            );
            return () => clearTimeout(timer);
        }
    }, [list]);
    function showList() {
        setList(true);
        setAll(false);
        setQuery("");
        setCategory("Semua");
        requestAnimationFrame(() => listHeading.current?.focus());
    }
    function showPlan() {
        planSection.current?.scrollIntoView({ block: "start" });
        planSection.current?.querySelector("summary")?.focus();
    }
    function keyNode(event: KeyboardEvent<HTMLButtonElement>, index: number) {
        let next = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown")
            next = (index + 1) % stages.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
            next = (index + stages.length - 1) % stages.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = stages.length - 1;
        else return;
        event.preventDefault();
        nodes.current[next]?.focus();
        setStage(next);
    }
    return (
        <AppShell title="Roadmap">
            <Head title="Roadmap 90 Hari" />
            {template_update_available && (
                <p className="v5-note">
                    Template baru tersedia untuk pendaftaran berikutnya. Rencana
                    dan progresmu tetap memakai versi yang kamu mulai.
                </p>
            )}
            <div className="v8-roadmap">
                <div className="v8-roadmap-heading">
                    <div>
                        <span className="v8-kicker">RENCANA BELAJAR</span>
                        <h1>Roadmap 90 Hari</h1>
                        <p>
                            Tahu posisi belajar sekarang, tujuan berikutnya, dan
                            bukti progresmu.
                        </p>
                    </div>
                    <span className="v8-roadmap-duration">
                        <Clock3 size={16} /> 90 Hari
                    </span>
                </div>
                <div className="v8-roadmap-layout">
                    <section
                        className="v8-roadmap-timeline"
                        aria-label="Peta perjalanan lima tahap"
                    >
                        <div className="v8-section-heading">
                            <div>
                                <h2>Jalur belajar</h2>
                                <p>
                                    Pilih tahapan untuk melihat materi dan
                                    aktivitasnya.
                                </p>
                            </div>
                        </div>
                        <div className="recovery-map">
                            <PathIllustration />
                            <div
                                className="v8-stages"
                                role="group"
                                aria-label="Pilih tahap perjalanan"
                            >
                                {stages.map((item, index) => (
                                    <button
                                        key={item.title}
                                        ref={(node) => {
                                            nodes.current[index] = node;
                                        }}
                                        onKeyDown={(event) =>
                                            keyNode(event, index)
                                        }
                                        onClick={() => {
                                            setStage(index);
                                            setAll(false);
                                        }}
                                        className={`v8-stage ${stage === index ? "chosen" : ""} ${item.status === "Selesai" ? "complete" : item.status === "Aktif" ? "active" : "locked"}`}
                                        style={{
                                            left: `${[10.6, 28.8, 49.9, 65.3, 81.6][index] ?? 85}%`,
                                            top: `${[86.8, 73.6, 61.5, 47.9, 32.6][index] ?? 25}%`,
                                        }}
                                        aria-pressed={stage === index}
                                        aria-label={`Tahap ${index + 1}: ${item.title}, ${item.status}, ${item.percent}%`}
                                    >
                                        <span className="v8-stage-dot">
                                            {item.status === "Selesai" ? (
                                                <Check size={14} />
                                            ) : (
                                                index + 1
                                            )}
                                        </span>
                                        <strong>{item.title}</strong>
                                        <small>
                                            {item.items.length
                                                ? `Hari ${item.items[0].day}–${item.items[item.items.length - 1].day}`
                                                : "Belum ada rencana"}
                                        </small>
                                        <small>{item.status}</small>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="v8-roadmap-progress">
                            <span className="v8-kicker">
                                PENCAPAIAN ROADMAP
                            </span>
                            <strong>
                                {stats.completed} dari {stats.total} tugas
                                selesai
                            </strong>
                            <p>
                                {plan
                                    ? `${stats.days_completed} dari 90 hari selesai`
                                    : "Rencana belum dibuat"}{" "}
                                · checklist mandiri tidak memberikan XP.
                            </p>
                            <div
                                className="v8-progress-track"
                                role="progressbar"
                                aria-label="Progres checklist roadmap"
                                aria-valuenow={stats.percent}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            >
                                <span style={{ width: `${stats.percent}%` }} />
                            </div>
                        </div>
                    </section>
                    <aside
                        className="v8-stage-detail"
                        aria-labelledby="stage-detail-title"
                    >
                        <span className="v8-kicker">
                            TAHAP {stage + 1} / {stages.length}
                        </span>
                        <h2 id="stage-detail-title" className="detail-title">
                            {selected.title}
                        </h2>
                        <p>
                            {selected.items[0]?.objective ||
                                "Buat rencana pribadi untuk melihat aktivitas pada tahap ini."}
                        </p>
                        <p>
                            <strong>
                                {selected.done} / {selected.items.length}
                            </strong>{" "}
                            checklist direview · {selected.percent}%
                        </p>
                        <p className="recovery-current-day">
                            {today.day
                                ? `Hari ini · Hari ${today.day}`
                                : "Jadwal mengikuti rencana akun"}
                        </p>
                        <h3>Aktivitas prioritas</h3>
                        <ul>
                            {selected.items
                                .filter((task) => task.status !== "completed")
                                .slice(0, 4)
                                .map((task) => (
                                    <li key={task.id}>
                                        <span>{task.title}</span>
                                        <small>{task.minutes} menit</small>
                                    </li>
                                ))}
                        </ul>
                        {selected.status === "Terkunci" && plan && (
                            <p>
                                Aktivitas terkunci sampai prasyaratnya selesai.
                                Kamu tetap dapat melihat detailnya.
                            </p>
                        )}
                        <Button onClick={plan ? showList : showPlan}>
                            {plan
                                ? "Lihat Aktivitas di Tahap Ini"
                                : "Buat Rencana Belajar"}
                            <ArrowRight size={16} />
                        </Button>
                    </aside>
                </div>
                <div className="v8-roadmap-list-toggle">
                    <button
                        onClick={() => {
                            setList(!list);
                            setAll(true);
                        }}
                        aria-expanded={list}
                    >
                        <List size={17} />
                        {list ? "Tutup daftar" : "Daftar aksesibel"}
                    </button>
                </div>
            </div>
            <div className="roadmap-controls">
                <p>
                    <strong>Aktivitas roadmap</strong>
                    <span>
                        Progres disimpan di akunmu. Checklist mandiri tidak
                        memberikan XP.
                    </span>
                </p>
                <button
                    className="text-link"
                    onClick={() => {
                        setList(true);
                        setAll(true);
                        requestAnimationFrame(() =>
                            listHeading.current?.focus(),
                        );
                    }}
                >
                    Lihat seluruh 90 hari <ArrowDown size={16} />
                </button>
            </div>
            <div ref={planSection}>
                <PlanForm plan={plan} today={today} />
            </div>
            {list && (
                <section
                    className="activities-section"
                    aria-label="Aktivitas harian"
                >
                    <div className="section-heading">
                        <div>
                            <h2 ref={listHeading} tabIndex={-1}>
                                {all
                                    ? "Seluruh aktivitas"
                                    : `Tahap ${stage + 1} · ${selected.title}`}
                            </h2>
                            <p className="muted">
                                Tanggal sesuai zona waktu{" "}
                                {plan?.timezone || "akunmu"} · estimasi 120
                                menit sehari
                            </p>
                        </div>
                        <button
                            className="icon-button"
                            onClick={() => {
                                setList(false);
                                nodes.current[stage]?.focus();
                            }}
                            aria-label="Kembali ke peta"
                        >
                            <Map size={22} />
                        </button>
                    </div>
                    {selectedPhase && (
                        <p className="phase-filter-note">
                            <Link href="/roadmap" className="text-link">
                                Tampilkan semua fase
                            </Link>
                            <span>Menampilkan fase dari tautan tersimpan.</span>
                        </p>
                    )}
                    <div className="roadmap-toolbar">
                        <div
                            className="category-tabs"
                            role="group"
                            aria-label="Filter kategori"
                        >
                            {[
                                "Semua",
                                "Fundamental",
                                "Web",
                                "API",
                                "Bug Bounty",
                            ].map((label) => (
                                <button
                                    key={label}
                                    aria-pressed={category === label}
                                    className={
                                        category === label ? "selected" : ""
                                    }
                                    onClick={() => {
                                        setCategory(label);
                                        setAll(true);
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <label className="roadmap-search">
                            <Search size={17} />
                            <span className="sr-only">Cari tugas</span>
                            <input
                                value={query}
                                maxLength={100}
                                placeholder="Cari tugas…"
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setAll(true);
                                }}
                            />
                        </label>
                    </div>
                    {days.map((day) => {
                        const dayTasks = matches.filter(
                            (task) => task.day === day,
                        );
                        const first = dayTasks[0];
                        return (
                            <details
                                key={`${day}-${query}-${stage}`}
                                className="journey-day"
                                open={
                                    !!query ||
                                    day === initialDay ||
                                    day === days[0]
                                }
                            >
                                <summary>
                                    <span className="day-number">
                                        {day.toString().padStart(2, "0")}
                                    </span>
                                    <div>
                                        <h3>
                                            Hari {day} ·{" "}
                                            {
                                                tasks.find(
                                                    (task) => task.day === day,
                                                )?.title
                                            }
                                        </h3>
                                        <p>
                                            {first.date} ·{" "}
                                            {
                                                dayTasks.filter(
                                                    (task) =>
                                                        task.status ===
                                                        "completed",
                                                ).length
                                            }
                                            /{dayTasks.length} checklist
                                            direview
                                        </p>
                                    </div>
                                    <ChevronDown size={18} />
                                </summary>
                                <div className="day-content">
                                    <p className="day-objective">
                                        {first.objective}
                                    </p>
                                    {dayTasks.map((task) => (
                                        <TaskRow key={task.id} task={task} />
                                    ))}
                                </div>
                            </details>
                        );
                    })}
                    {!matches.length && (
                        <div className="card empty-state">
                            <Search size={26} />
                            <h2>Tidak ada tugas yang cocok</h2>
                            <p>
                                {plan
                                    ? "Coba kata kunci atau kategori lain."
                                    : "Buat rencana dengan tanggal mulai pilihanmu."}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setQuery("");
                                    setCategory("Semua");
                                    setAll(true);
                                }}
                            >
                                Bersihkan filter
                            </Button>
                        </div>
                    )}
                </section>
            )}
        </AppShell>
    );
}
