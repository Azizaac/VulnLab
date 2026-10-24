import { Head, Link } from "@inertiajs/react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import {
    ArrowDown,
    ArrowRight,
    Check,
    ChevronDown,
    Clock3,
    List,
    LockKeyhole,
    Map,
    Search,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { PathIllustration } from "../components/JourneyArt";
import PlanForm from "../components/PlanForm";
import TaskRow from "../components/TaskRow";
import { Button } from "../components/ui/button";
import type { RoadmapProps } from "../types";
export const stageNames = [
    "Dasar Keamanan Web",
    "Eksplorasi Web",
    "Advanced Topics",
    "Bug Bounty Practice",
    "Siap ke Dunia Nyata",
];
const positions = [
    [7.5, 86.8],
    [20.4, 73.6],
    [35.4, 61.5],
    [46.3, 47.9],
    [57.9, 32.6],
];
export default function Roadmap({
    plan,
    today,
    phases,
    stats,
    nextTask,
    selectedPhase,
    search = "",
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
    const [stage, setStage] = useState(Math.floor((initialDay - 1) / 18));
    const [list, setList] = useState(
        !!search || !!requestedDay || !!selectedPhase,
    );
    const [query, setQuery] = useState(search);
    const [category, setCategory] = useState("Semua");
    const [all, setAll] = useState(!!search || !!selectedPhase);
    const nodes = useRef<(HTMLButtonElement | null)[]>([]);
    const listHeading = useRef<HTMLHeadingElement>(null);
    const stages = stageNames.map((title, index) => {
        const items = tasks.filter(
            (task) => Math.floor((task.day - 1) / 18) === index,
        );
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
            (all || Math.floor((task.day - 1) / 18) === stage) &&
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
    function keyNode(event: KeyboardEvent<HTMLButtonElement>, index: number) {
        let next = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown")
            next = (index + 1) % 5;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
            next = (index + 4) % 5;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = 4;
        else return;
        event.preventDefault();
        nodes.current[next]?.focus();
        setStage(next);
    }
    return (
        <AppShell title="Roadmap">
            <Head title="Roadmap 90 Hari" />
            <section
                className="journey-map"
                aria-label="Peta perjalanan lima tahap"
            >
                <PathIllustration />
                <div className="map-heading">
                    <div>
                        <h1>Roadmap 90 Hari</h1>
                        <p>Dari dasar hingga siap berburu bug bounty.</p>
                    </div>
                    <span className="map-duration">
                        <Clock3 size={16} />
                        90 Hari
                    </span>
                </div>
                <div
                    className="stage-nodes"
                    role="group"
                    aria-label="Pilih tahap perjalanan"
                >
                    {stages.map((item, index) => (
                        <button
                            key={item.title}
                            ref={(node) => {
                                nodes.current[index] = node;
                            }}
                            onKeyDown={(event) => keyNode(event, index)}
                            onClick={() => {
                                setStage(index);
                                setAll(false);
                            }}
                            className={`stage-node stage-${index + 1} ${stage === index ? "chosen" : ""}`}
                            style={{
                                left: `${positions[index][0]}%`,
                                top: `${positions[index][1]}%`,
                            }}
                            aria-pressed={stage === index}
                            aria-label={`Tahap ${index + 1}: ${item.title}, ${item.status}, ${item.percent}%`}
                        >
                            <span className="node-ring">
                                {item.status === "Selesai" ? (
                                    <Check size={24} />
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <span className="node-label">
                                <strong>{item.title}</strong>
                                <small>
                                    Hari {index * 18 + 1}–{(index + 1) * 18} ·{" "}
                                    {item.status}
                                </small>
                            </span>
                        </button>
                    ))}
                </div>
                <aside
                    className="stage-detail"
                    aria-labelledby="stage-detail-title"
                >
                    <div className="detail-kicker">
                        <h2 id="stage-detail-title">Detail Tahap</h2>
                        <span>{stage + 1} / 5</span>
                    </div>
                    <div className="detail-title">
                        <span className={`detail-number stage-color-${stage}`}>
                            {stage + 1}
                        </span>
                        <div>
                            <h3>{selected.title}</h3>
                            <p>
                                Hari {stage * 18 + 1}–{(stage + 1) * 18}
                            </p>
                        </div>
                    </div>
                    <p className="stage-description">
                        {selected.items[0]?.objective ||
                            "Buat rencana pribadi untuk melihat aktivitas dan tanggal pada tahap ini."}
                    </p>
                    <div className="stage-progress">
                        <span>
                            {selected.done} / {selected.items.length} checklist
                            direview
                        </span>
                        <strong>{selected.percent}%</strong>
                    </div>
                    <div className="stage-meter">
                        <span style={{ width: `${selected.percent}%` }} />
                    </div>
                    <ul className="stage-goals">
                        {selected.items
                            .filter((task) => task.minutes === 20)
                            .slice(0, 4)
                            .map((task) => (
                                <li key={task.id}>
                                    {task.status === "completed" ? (
                                        <Check size={16} />
                                    ) : task.status === "locked" ? (
                                        <LockKeyhole size={15} />
                                    ) : (
                                        <span className="goal-circle" />
                                    )}
                                    <span>{task.title}</span>
                                </li>
                            ))}
                    </ul>
                    <Button onClick={showList}>
                        {plan
                            ? "Lihat Aktivitas di Tahap Ini"
                            : "Buat Rencana Belajar"}
                        <ArrowRight size={16} />
                    </Button>
                    <p className="detail-note">
                        20 menit teori · 70 praktik · 30 refleksi
                    </p>
                </aside>
                <div className="map-bottom">
                    <button
                        onClick={() => {
                            setList(!list);
                            setAll(true);
                        }}
                        aria-expanded={list}
                        className="map-list-button"
                    >
                        <List size={17} />
                        {list ? "Tutup daftar" : "Daftar aksesibel"}
                    </button>
                    <p>
                        {stats.days_completed} / {plan ? 90 : 0} hari selesai ·{" "}
                        {stats.percent}% checklist
                    </p>
                </div>
            </section>
            <div className="roadmap-controls">
                <p>
                    <strong>
                        {stats.completed} dari {stats.total} tugas selesai
                    </strong>
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
            <PlanForm plan={plan} today={today} />
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
