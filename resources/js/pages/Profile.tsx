import { Head, Link } from "@inertiajs/react";
import AppShell from "../components/AppShell";
import { Avatar, ProfileData } from "../v5";
import type { ProgressData } from "../progress";
export default function Profile({
    profile,
    progress,
    recentActivity,
}: {
    profile: ProfileData;
    progress: ProgressData;
    recentActivity: { event_type: string; occurred_at: string }[] | null;
}) {
    return (
        <AppShell title="Profil Saya">
            <Head title="Profil Saya" />
            <div className="v5-title">
                <div>
                    <p className="v5-eyebrow">VULNLAB / PROFIL SAYA</p>
                    <h1>Perjalanan belajarmu.</h1>
                    <p>Ruang pribadi untuk mengenali perkembanganmu.</p>
                </div>
                <Link className="v5-button" href="/settings/general">
                    Edit Profil
                </Link>
            </div>
            <section className="v5-profile-hero">
                <div className="v5-profile-identity">
                    <Avatar profile={profile} />
                    <div>
                        <h2>{profile.name}</h2>
                        <p>
                            {profile.username ? `@${profile.username} · ` : ""}
                            Anggota sejak{" "}
                            {new Date(profile.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                    month: "long",
                                    year: "numeric",
                                    timeZone: profile.timezone,
                                },
                            )}
                        </p>
                        <span className="v5-pill">{profile.role}</span>
                    </div>
                </div>
                {profile.bio && <p>{profile.bio}</p>}
                <div className="v5-hero-stats">
                    <div>
                        <strong>{progress.summary.level}</strong>
                        <span>Level</span>
                    </div>
                    <div>
                        <strong>{progress.summary.total_xp}</strong>
                        <span>XP terverifikasi</span>
                    </div>
                    <div>
                        <strong>{progress.summary.labs_solved}</strong>
                        <span>Lab selesai</span>
                    </div>
                    <div>
                        <strong>{progress.summary.modules_completed}</strong>
                        <span>Modul selesai</span>
                    </div>
                </div>
            </section>
            <div className="v5-grid two">
                <section className="v5-card">
                    <h2>Langkah berikutnya</h2>
                    <p>
                        {progress.has_activity
                            ? "Lanjutkan dari bukti belajar yang sudah kamu bangun."
                            : "Belum ada aktivitas terverifikasi. Mulai satu materi untuk membangun fondasimu."}
                    </p>
                    <Link
                        className="v5-button"
                        href={progress.journey.next_action.href}
                    >
                        {progress.journey.next_action.label}
                    </Link>
                    <h3>Skill yang sedang kamu bangun</h3>
                    {progress.skills.map((s) => (
                        <div className="v5-row" key={s.key}>
                            <div>
                                <strong>{s.label}</strong>
                                <p>
                                    {s.quiz_passed}/{s.quiz_total} kuis ·{" "}
                                    {s.labs_solved}/{s.labs_total} lab
                                </p>
                            </div>
                            <span className="v5-pill">
                                {s.score === null
                                    ? "Belum dinilai"
                                    : `${s.score}/100`}
                            </span>
                        </div>
                    ))}
                </section>
                <section className="v5-card">
                    <h2>Achievement & milestone</h2>
                    <p>Badge aktif setelah capaian diverifikasi oleh server.</p>
                    <div className="v5-grid two">
                        {progress.achievements.map((a) => (
                            <article
                                className={`v5-badge ${a.unlocked_at ? "earned" : ""}`}
                                key={a.code}
                            >
                                <span aria-hidden="true">
                                    {a.unlocked_at ? "🏅" : "◇"}
                                </span>
                                <h3>{a.name}</h3>
                                <p>{a.description}</p>
                                <span>
                                    {a.unlocked_at
                                        ? "Tercapai"
                                        : `${a.progress}/${a.target} · Belum tercapai`}
                                </span>
                            </article>
                        ))}
                    </div>
                    <Link className="v5-button secondary" href="/progress">
                        Lihat detail progres
                    </Link>
                </section>
            </div>
            {recentActivity !== null && (
                <section className="v5-card">
                    <h2>Aktivitas terbaru</h2>
                    {recentActivity.length ? (
                        recentActivity.map((event, i) => (
                            <div className="v5-row" key={i}>
                                <span>{event.event_type}</span>
                                <time>
                                    {new Date(event.occurred_at).toLocaleString(
                                        "id-ID",
                                        { timeZone: profile.timezone },
                                    )}
                                </time>
                            </div>
                        ))
                    ) : (
                        <p>Belum ada aktivitas terverifikasi.</p>
                    )}
                </section>
            )}
        </AppShell>
    );
}
