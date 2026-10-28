import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import {
    ArrowRight,
    Award,
    BookOpen,
    Check,
    Flame,
    Info,
    LockKeyhole,
    Sparkles,
    Trophy,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { EmptyState } from "../feedback";
import { calendarDate, type ProgressData } from "../progress";
import "../../css/v8-workspaces.css";

function JourneyArt() {
    return (
        <svg
            viewBox="0 0 340 180"
            aria-hidden="true"
            className="s4-journey-art"
        >
            <defs>
                <linearGradient
                    id="journeyMountain"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >
                    <stop stopColor="#5bd8ff" />
                    <stop offset="1" stopColor="#5868ee" />
                </linearGradient>
            </defs>
            <circle cx="252" cy="57" r="46" fill="#bfe9ff" opacity=".4" />
            <path
                d="m3 174 83-99 43 47 46-76 48 47 42-72 75 153Z"
                fill="#c9dfff"
            />
            <path
                d="m74 174 101-128 48 47 42-72 75 153Z"
                fill="url(#journeyMountain)"
            />
            <path d="m265 21-19 34 18-6 17 10Z" fill="#edfbff" />
            <path d="m175 46-21 29 20-6 16 7Z" fill="#f2fcff" />
            <path
                d="M100 175c100-9 57-42 103-54s11-24 54-59"
                fill="none"
                stroke="#c8f9ff"
                strokeWidth="5"
                strokeLinecap="round"
            />
            <path
                d="M264 22V2m0 0 27 6-27 9"
                fill="#8463ed"
                stroke="#8463ed"
                strokeWidth="3"
            />
            <circle cx="106" cy="142" r="3" fill="#83deff" />
            <path d="m315 68 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#8298f5" />
        </svg>
    );
}

export function ProgressSummary({
    summary,
    streak,
}: {
    summary: ProgressData["summary"];
    streak: ProgressData["streak"];
}) {
    return (
        <>
            <section
                aria-label="Ringkasan progres sepanjang waktu"
                className="s4-summary"
            >
                <div>
                    <span>Materi selesai</span>
                    <strong>
                        {summary.lessons_completed}
                        <small> / {summary.lessons_total}</small>
                    </strong>
                </div>
                <div>
                    <span>Lab terverifikasi</span>
                    <strong>
                        {summary.labs_solved}
                        <small> / {summary.labs_total}</small>
                    </strong>
                </div>
                <div>
                    <span>Reward tervalidasi</span>
                    <strong>{summary.total_xp} XP</strong>
                </div>
                <div>
                    <span>Streak aktivitas</span>
                    <strong>{streak.current} hari</strong>
                </div>
            </section>
            <div
                className="s4-level v8-level"
                aria-label="Level dan progres XP"
            >
                <span>
                    Level {summary.level} · {summary.total_xp} XP
                </span>
                <span>
                    {summary.next_level_xp - summary.total_xp} XP ke level
                    berikutnya
                </span>
                <progress
                    max="100"
                    value={summary.level_progress_percent}
                    aria-label="Progres menuju level berikutnya"
                />
            </div>
            <details className="v8-progress-detail">
                <summary>Rincian pengukuran belajar</summary>
                <p>
                    Checklist roadmap: {summary.roadmap_completed}/
                    {summary.roadmap_total} · Modul: {summary.modules_completed}
                    /{summary.modules_total} · Kuis: {summary.quizzes_passed}/
                    {summary.quizzes_total} · Menit terverifikasi:{" "}
                    {summary.verified_minutes ?? "Belum dilacak"}
                </p>
            </details>
        </>
    );
}

export function LearningStreakCalendar({
    streak,
    timezone,
}: {
    streak: ProgressData["streak"];
    timezone: string;
}) {
    return (
        <section className="s4-panel s4-streak">
            <div className="s4-panel-heading">
                <h2>Ritme belajar</h2>
                <Flame size={21} />
            </div>
            <div className="s4-streak-number">
                <span className="s4-fire">
                    <Flame size={34} />
                </span>
                <div>
                    <strong>
                        {streak.current} <span>hari beruntun</span>
                    </strong>
                    <p>
                        Rekor terpanjang {streak.longest} hari. Satu langkah
                        setiap hari.
                    </p>
                </div>
            </div>
            <ol className="s4-streak-dates">
                {streak.days.map((day) => (
                    <li key={day.date}>
                        <span
                            role="img"
                            className={day.qualified ? "qualified" : ""}
                            aria-label={`${calendarDate(day.date, { dateStyle: "long" })}: ${day.qualified ? "ada aktivitas terverifikasi" : "belum ada aktivitas terverifikasi"}`}
                        >
                            {day.qualified ? <Check size={14} /> : <span />}
                        </span>
                        <small>
                            {calendarDate(day.date, { weekday: "short" })}
                        </small>
                        <small>
                            {calendarDate(day.date, { day: "numeric" })}
                        </small>
                    </li>
                ))}
            </ol>
            <p className="s4-caption">
                Kalender {timezone}. Membuka halaman atau login tidak dihitung.
            </p>
        </section>
    );
}

export function LearningActivityChart({
    activity,
}: {
    activity: ProgressData["activity"];
}) {
    const [metric, setMetric] = useState<
        "all" | "lessons" | "quizzes" | "labs" | "study_minutes"
    >("all");
    const series = [
        { key: "lessons", label: "Materi", color: "#0879ee" },
        { key: "quizzes", label: "Kuis", color: "#8655da" },
        { key: "labs", label: "Lab", color: "#139b83" },
        { key: "reports", label: "Laporan", color: "#b07813" },
    ] as const;
    const values = activity.map((row) =>
        metric === "all"
            ? row.lessons + row.quizzes + row.labs + row.reports
            : row[metric],
    );
    const max = Math.max(1, ...values);
    const tickCount = Math.min(max, 4);
    const ticks = Array.from({ length: tickCount + 1 }, (_, index) =>
        Math.round((index * max) / tickCount),
    );
    const width = 620,
        height = 230,
        left = 35,
        bottom = 194,
        plot = 568;
    const step = plot / Math.max(activity.length, 1);
    return (
        <section className="s4-panel s4-activity">
            <div className="s4-panel-heading">
                <h2>Aktivitas belajar</h2>
                <label className="s4-compact-filter">
                    <span className="sr-only">Jenis aktivitas</span>
                    <select
                        aria-label="Jenis aktivitas"
                        value={metric}
                        onChange={(e) =>
                            setMetric(e.target.value as typeof metric)
                        }
                    >
                        <option value="all">Semua bukti</option>
                        <option value="lessons">Materi selesai</option>
                        <option value="quizzes">Kuis lulus</option>
                        <option value="labs">Lab selesai</option>
                        <option value="study_minutes">Menit belajar</option>
                    </select>
                </label>
            </div>
            <p className="s4-caption">
                Penyelesaian pertama yang disahkan server, per tanggal lokal.
            </p>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label={`Grafik ${metric === "study_minutes" ? "menit belajar belum dilacak" : "aktivitas belajar"}; rincian tersedia pada tabel di bawah`}
                className="s4-activity-chart"
            >
                {ticks.map((tick) => (
                    <g key={tick}>
                        <line
                            x1={left}
                            x2={width - 16}
                            y1={bottom - (tick / max) * 155}
                            y2={bottom - (tick / max) * 155}
                            stroke="var(--border)"
                            strokeDasharray={tick ? "3 4" : undefined}
                        />
                        <text
                            x={left - 7}
                            y={bottom - (tick / max) * 155 + 4}
                            textAnchor="end"
                        >
                            {tick}
                        </text>
                    </g>
                ))}
                {activity.map((row, i) => {
                    const count = values[i];
                    let accumulated = 0;
                    return (
                        <g key={row.date}>
                            <title>{`${row.date}: ${count} ${metric === "study_minutes" ? "menit" : "aktivitas"}`}</title>
                            {metric === "all" ? (
                                series.map((item) => {
                                    const current = row[item.key];
                                    const bar = (
                                        <rect
                                            key={item.key}
                                            x={left + i * step + step * 0.18}
                                            y={
                                                bottom -
                                                ((accumulated + current) /
                                                    max) *
                                                    155
                                            }
                                            width={step * 0.64}
                                            height={(current / max) * 155}
                                            rx="2"
                                            fill={item.color}
                                        />
                                    );
                                    accumulated += current;
                                    return bar;
                                })
                            ) : (
                                <rect
                                    x={left + i * step + step * 0.18}
                                    y={bottom - (count / max) * 155}
                                    width={step * 0.64}
                                    height={(count / max) * 155}
                                    rx="2"
                                    fill="#0879ee"
                                />
                            )}
                            {(activity.length <= 7 ||
                                i % Math.ceil(activity.length / 6) === 0 ||
                                i === activity.length - 1) && (
                                <text
                                    x={left + i * step + step / 2}
                                    y={bottom + 23}
                                    textAnchor="middle"
                                >
                                    {calendarDate(row.date, {
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            {metric === "all" && (
                <ul className="s4-chart-legend">
                    {series.map((item) => (
                        <li key={item.key}>
                            <span style={{ background: item.color }} />
                            {item.label}
                        </li>
                    ))}
                </ul>
            )}
            {metric === "study_minutes" && (
                <p className="s4-inline-info">
                    <Info size={16} />
                    Belum dilacak. Durasi yang direncanakan bukan waktu belajar
                    terverifikasi.
                </p>
            )}
            <details className="s4-data-table">
                <summary>Lihat tabel aktivitas yang dapat diakses</summary>
                <div
                    className="s4-table-scroll"
                    tabIndex={0}
                    role="region"
                    aria-label="Tabel aktivitas belajar"
                >
                    <table>
                        <caption>Aktivitas berdasarkan tanggal lokal</caption>
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Materi</th>
                                <th>Kuis</th>
                                <th>Lab</th>
                                <th>Laporan</th>
                                <th>Menit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activity.map((row) => (
                                <tr key={row.date}>
                                    <th scope="row">
                                        {calendarDate(row.date, {
                                            dateStyle: "medium",
                                        })}
                                    </th>
                                    <td>{row.lessons}</td>
                                    <td>{row.quizzes}</td>
                                    <td>{row.labs}</td>
                                    <td>{row.reports}</td>
                                    <td>Belum dilacak</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </section>
    );
}

export function SkillEvidenceRadar({
    skills,
}: {
    skills: ProgressData["skills"];
}) {
    const point = (i: number, radius: number) => [
        170 + Math.cos(-Math.PI / 2 + (i * Math.PI) / 4) * radius,
        155 + Math.sin(-Math.PI / 2 + (i * Math.PI) / 4) * radius,
    ];
    return (
        <section className="s4-panel s4-skills">
            <div className="s4-panel-heading">
                <h2>Kompetensi berbasis bukti</h2>
                <Sparkles size={20} />
            </div>
            <p className="s4-caption">
                Pengetahuan 40% · praktik 60%. Bukti belajar, bukan sertifikasi
                penguasaan.
            </p>
            <details className="v8-radar-detail">
                <summary>Lihat radar kemampuan</summary>
                <svg
                    viewBox="0 0 340 315"
                    role="img"
                    aria-label="Radar delapan dimensi skill. Skor dan sumber bukti dijelaskan di bawah."
                    className="s4-radar"
                >
                    {[0.25, 0.5, 0.75, 1]
                        .map((f) => (
                            <polygon
                                key={f}
                                points={skills
                                    .map((_, i) => point(i, 101 * f).join(","))
                                    .join(" ")}
                                fill={f === 1 ? "var(--surface-alt)" : "none"}
                                stroke="var(--border)"
                            />
                        ))
                        .reverse()}
                    {skills.map((skill, i) => (
                        <g key={skill.key}>
                            <line
                                x1="170"
                                y1="155"
                                x2={point(i, 101)[0]}
                                y2={point(i, 101)[1]}
                                stroke="var(--border)"
                            />
                            <text
                                x={point(i, 130)[0]}
                                y={point(i, 130)[1]}
                                textAnchor={
                                    i === 0 || i === 4
                                        ? "middle"
                                        : i < 4
                                          ? "start"
                                          : "end"
                                }
                                dominantBaseline="middle"
                            >
                                {skill.label.length > 16
                                    ? skill.label.split(" ").map((word, j) => (
                                          <tspan
                                              key={`${word}${j}`}
                                              x={point(i, 130)[0]}
                                              dy={j ? 12 : -5}
                                          >
                                              {word}
                                          </tspan>
                                      ))
                                    : skill.label}
                            </text>
                        </g>
                    ))}
                    <polygon
                        points={skills
                            .map((skill, i) =>
                                point(
                                    i,
                                    (Math.max(
                                        0,
                                        Math.min(100, skill.score || 0),
                                    ) /
                                        100) *
                                        101,
                                ).join(","),
                            )
                            .join(" ")}
                        fill="#0879ee22"
                        stroke="#0879ee"
                        strokeWidth="2"
                    />
                    {skills.map((skill, i) => (
                        <circle
                            key={skill.key}
                            cx={point(i, ((skill.score || 0) / 100) * 101)[0]}
                            cy={point(i, ((skill.score || 0) / 100) * 101)[1]}
                            r="3"
                            fill="#0879ee"
                        />
                    ))}
                </svg>
            </details>
            <div className="s4-skill-evidence">
                {skills.map((skill) => (
                    <details key={skill.key}>
                        <summary>
                            <span>{skill.label}</span>
                            <strong>
                                {skill.score === null
                                    ? "Belum dinilai"
                                    : `${skill.score}/100`}
                            </strong>
                            {skill.score !== null && (
                                <progress
                                    value={skill.score}
                                    max="100"
                                    aria-label={`Bukti ${skill.label}: ${skill.score} dari 100`}
                                />
                            )}
                        </summary>
                        <p>{skill.explanation}</p>
                        <dl>
                            <div>
                                <dt>Kuis lulus</dt>
                                <dd>
                                    {skill.quiz_passed}/{skill.quiz_total}
                                </dd>
                            </div>
                            <div>
                                <dt>Lab selesai</dt>
                                <dd>
                                    {skill.labs_solved}/{skill.labs_total}
                                </dd>
                            </div>
                            <div>
                                <dt>Laporan diterima internal</dt>
                                <dd>{skill.reports_accepted}</dd>
                            </div>
                        </dl>
                        {!skill.practice_assessed && (
                            <p>Belum dinilai secara praktik.</p>
                        )}
                    </details>
                ))}
            </div>
        </section>
    );
}

export function AchievementGrid({
    achievements,
}: {
    achievements: ProgressData["achievements"];
}) {
    return (
        <section className="s4-achievement-section">
            <div className="s4-panel-heading">
                <h2>Pencapaian belajarmu</h2>
                <span>
                    {achievements.filter((a) => a.unlocked_at).length}/
                    {achievements.length} terbuka
                </span>
            </div>
            <div className="s4-achievements">
                {achievements.map((a) => (
                    <article
                        key={a.code}
                        className={`s4-achievement ${a.unlocked_at ? "unlocked" : "locked"}`}
                    >
                        <span className="s4-achievement-icon">
                            {a.unlocked_at ? (
                                <Award size={25} />
                            ) : (
                                <LockKeyhole size={22} />
                            )}
                        </span>
                        <div>
                            <h3>{a.name}</h3>
                            <p>{a.description}</p>
                            <small>
                                {a.unlocked_at
                                    ? `Terbuka ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(a.unlocked_at))}`
                                    : !a.attainable
                                      ? "Belum dapat dicapai pada konten saat ini"
                                      : `${a.progress}/${a.target} · Belum terbuka`}
                            </small>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default function Progress({ progress }: { progress: ProgressData }) {
    const [loading, setLoading] = useState(false);
    return (
        <AppShell title="Progres belajar">
            <Head title="Progres" />
            <div
                className="s4-page s4-progress-page v8-workspace v8-progress"
                aria-busy={loading}
            >
                <header className="s4-page-heading">
                    <div>
                        <span className="eyebrow">LEARNING ANALYTICS</span>
                        <h1>Progres yang punya makna.</h1>
                        <p>
                            Pisahkan aktivitas yang dilakukan dari kemampuan
                            yang dibuktikan.
                        </p>
                    </div>
                    <label className="s4-period-filter">
                        <span>Periode aktivitas</span>
                        <select
                            value={progress.period}
                            onChange={(e) =>
                                router.get(
                                    "/progress",
                                    { period: e.target.value },
                                    {
                                        preserveScroll: true,
                                        onStart: () => setLoading(true),
                                        onFinish: () => setLoading(false),
                                    },
                                )
                            }
                            disabled={loading}
                        >
                            <option value="7">7 Hari Terakhir</option>
                            <option value="30">30 Hari Terakhir</option>
                            <option value="90">90 Hari Terakhir</option>
                            <option value="all">Semua Aktivitas</option>
                        </select>
                    </label>
                </header>
                <div className="s4-summary-caption">
                    Ringkasan sepanjang waktu · grafik mengikuti periode yang
                    dipilih
                </div>
                <ProgressSummary
                    summary={progress.summary}
                    streak={progress.streak}
                />
                {!progress.has_activity && (
                    <EmptyState title="Belum ada aktivitas belajar.">
                        <p>Mulai dari satu materi atau kuis pertamamu.</p>
                        <Link href="/learning" className="learning-button">
                            <BookOpen size={17} />
                            Mulai belajar
                        </Link>
                    </EmptyState>
                )}
                <div className="s4-progress-charts">
                    <LearningActivityChart activity={progress.activity} />
                    <SkillEvidenceRadar skills={progress.skills} />
                </div>
                <AchievementGrid achievements={progress.achievements} />
                <div className="s4-progress-top">
                    <LearningStreakCalendar
                        streak={progress.streak}
                        timezone={progress.timezone}
                    />
                    <section className="s4-panel s4-journey">
                        <JourneyArt />
                        <div className="s4-journey-copy">
                            <span className="eyebrow">PERJALANAN ROADMAP</span>
                            <h2>
                                {progress.journey.percent}%{" "}
                                <small>langkah ditinjau</small>
                            </h2>
                            <p>
                                {progress.journey.completed_days} dari{" "}
                                {progress.journey.total_days} hari selesai.
                            </p>
                            <progress
                                value={progress.journey.percent}
                                max="100"
                                aria-label="Persentase hari roadmap ditinjau"
                            />
                            <Link href={progress.journey.next_action.href}>
                                {progress.journey.next_action.label}
                                <ArrowRight size={16} />
                            </Link>
                            <span className="s4-caption">
                                Checklist mandiri terpisah dari kuis dan lab
                                terverifikasi.
                            </span>
                        </div>
                    </section>
                </div>
                <details className="s4-methodology">
                    <summary>
                        <Info size={16} />
                        Bagaimana angka ini dihitung?
                    </summary>
                    <ul>
                        <li>
                            Roadmap ditinjau:{" "}
                            {progress.summary.roadmap_completed} /{" "}
                            {progress.summary.roadmap_total} aktivitas.
                        </li>
                        <li>
                            Modul selesai: {progress.summary.modules_completed}{" "}
                            / {progress.summary.modules_total}; kuis lulus:{" "}
                            {progress.summary.quizzes_passed} /{" "}
                            {progress.summary.quizzes_total}.
                        </li>
                        <li>
                            Menit terverifikasi:{" "}
                            {progress.summary.verified_minutes ??
                                "Belum dilacak"}
                            . Level {progress.summary.level};{" "}
                            {progress.summary.next_level_xp -
                                progress.summary.total_xp}{" "}
                            XP menuju level berikutnya.
                        </li>
                        {progress.methodology.map((line) => (
                            <li key={line}>{line}</li>
                        ))}
                    </ul>
                    <p>
                        <Trophy size={15} />
                        Level dan XP dihitung server dari reward yang diberikan
                        satu kali. <Link href="/learning">Lanjut belajar</Link>.
                    </p>
                </details>
            </div>
        </AppShell>
    );
}
