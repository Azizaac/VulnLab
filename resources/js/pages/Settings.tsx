import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import type { SharedProps } from "../types";
import { requestJson } from "../learning";
import { ConfirmDialog, useUnsavedChanges } from "../feedback";
import {
    ActionError,
    Avatar,
    Field,
    ProfileData,
    SectionForm,
    useAction,
} from "../v5";
type DataRequest = {
    id: string;
    kind: string;
    status: string;
    execute_after: string | null;
    expires_at: string | null;
    download_url: string | null;
};
type Props = {
    section: string;
    profile: ProfileData;
    preferences: { content_updates?: boolean; show_activity?: boolean };
    timezones: string[];
    sessions: { device: string; current: boolean; last_active: string }[];
    securityEvents: { action: string; created_at: string }[];
    dataRequests: DataRequest[];
};
export default function Settings(props: Props) {
    return <SettingsForm key={props.section} {...props} />;
}
function SettingsForm({
    section,
    profile,
    preferences,
    timezones,
    sessions,
    securityEvents,
    dataRequests,
}: Props) {
    const action = useAction();
    const { auth } = usePage<SharedProps>().props;
    const [general, setGeneral] = useState({
        name: profile.name,
        username: profile.username ?? "",
        bio: profile.bio ?? "",
        timezone: profile.timezone,
        locale: "id",
    });
    const [savedGeneral, setSavedGeneral] = useState(general);
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
    const [appearance, setAppearance] = useState({
        theme: profile.theme,
        density: profile.density,
        reduced_motion: profile.reduced_motion,
    });
    const [savedAppearance, setSavedAppearance] = useState(appearance);
    useEffect(() => {
        setAppearance((value) => ({ ...value, theme: auth.user.theme }));
        setSavedAppearance((value) => ({ ...value, theme: auth.user.theme }));
    }, [auth.user.theme]);
    const [updates, setUpdates] = useState(
        preferences.content_updates ?? false,
    );
    const [activity, setActivity] = useState(preferences.show_activity ?? true);
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [deletionText, setDeletionText] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [download, setDownload] = useState<string | null>(null);
    const dirty =
        JSON.stringify(general) !== JSON.stringify(savedGeneral) ||
        JSON.stringify(appearance) !== JSON.stringify(savedAppearance);
    useUnsavedChanges(dirty);
    async function save(name: string, data: unknown) {
        await requestJson(`/account/settings/${name}`, "PATCH", data);
    }
    const error = <ActionError error={action.error} errors={action.errors} />;
    const current = (
        <Field
            name="current_password"
            label="Password saat ini"
            errors={action.errors}
        >
            <input
                name="current_password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
            />
        </Field>
    );
    function refresh() {
        router.reload({
            only: ["sessions", "securityEvents", "dataRequests", "profile"],
        });
    }
    const tabs = [
        ["general", "Umum"],
        ["appearance", "Tampilan"],
        ["notifications", "Notifikasi"],
        ["security", "Keamanan"],
        ["privacy", "Privasi"],
        ["data", "Data & Akun"],
    ];
    return (
        <AppShell title="Pengaturan Akun">
            <Head title="Pengaturan Akun" />
            <div className="v5-title">
                <div>
                    <p className="v5-eyebrow">AKUN VULNLAB</p>
                    <h1>Pengaturan Akun</h1>
                    <p>
                        Atur identitas, pengalaman belajar, keamanan, dan data
                        pribadi.
                    </p>
                </div>
                <Link href="/profile" className="v5-button secondary">
                    Kembali ke Profil
                </Link>
            </div>
            <div className="v5-settings">
                <nav
                    className="v5-card v5-settings-nav"
                    aria-label="Kategori pengaturan"
                >
                    {tabs.map(([key, label]) => (
                        <Link
                            key={key}
                            href={`/settings/${key}`}
                            aria-current={section === key ? "page" : undefined}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
                <div className="v5-settings-content">
                    {section === "general" && (
                        <SectionForm
                            title="Informasi Profil"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void action.run(async () => {
                                    await save("general", general);
                                    setSavedGeneral(general);
                                }, "Profil tersimpan.");
                            }}
                        >
                            <div className="v5-row">
                                <Avatar
                                    profile={{
                                        ...profile,
                                        avatar_url: avatarUrl,
                                    }}
                                />
                                <div>
                                    <strong>Foto Profil</strong>
                                    <p>PNG, JPG, WebP · maksimal 2 MB</p>
                                    <label className="v5-button secondary">
                                        Ubah Foto
                                        <input
                                            className="sr-only"
                                            type="file"
                                            name="avatar"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={(e) => {
                                                const file =
                                                    e.target.files?.[0];
                                                if (!file) return;
                                                const form = new FormData();
                                                form.append("avatar", file);
                                                void action.run(async () => {
                                                    const result =
                                                        await requestJson<{
                                                            avatar_url: string;
                                                        }>(
                                                            "/profile/avatar",
                                                            "POST",
                                                            form,
                                                        );
                                                    setAvatarUrl(
                                                        result.avatar_url,
                                                    );
                                                }, "Foto profil diperbarui.");
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                            {(
                                [
                                    ["name", "Nama Tampilan"],
                                    ["username", "Username"],
                                    ["bio", "Bio"],
                                ] as const
                            ).map(([key, label]) => (
                                <Field
                                    key={key}
                                    name={key}
                                    label={label}
                                    errors={action.errors}
                                >
                                    {key === "bio" ? (
                                        <textarea
                                            name={key}
                                            maxLength={280}
                                            value={general[key]}
                                            onChange={(e) =>
                                                setGeneral({
                                                    ...general,
                                                    [key]: e.target.value,
                                                })
                                            }
                                        />
                                    ) : (
                                        <input
                                            name={key}
                                            maxLength={key === "name" ? 60 : 24}
                                            value={general[key]}
                                            onChange={(e) =>
                                                setGeneral({
                                                    ...general,
                                                    [key]: e.target.value,
                                                })
                                            }
                                        />
                                    )}
                                </Field>
                            ))}
                            <div className="v5-grid two">
                                <Field name="locale" label="Bahasa">
                                    <select
                                        name="locale"
                                        value="id"
                                        onChange={() => {}}
                                    >
                                        <option value="id">
                                            Bahasa Indonesia
                                        </option>
                                    </select>
                                </Field>
                                <Field
                                    name="timezone"
                                    label="Zona Waktu"
                                    errors={action.errors}
                                >
                                    <select
                                        name="timezone"
                                        value={general.timezone}
                                        onChange={(e) =>
                                            setGeneral({
                                                ...general,
                                                timezone: e.target.value,
                                            })
                                        }
                                    >
                                        {timezones.map((t) => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                            <p className="v5-note">
                                {profile.email} ·{" "}
                                {profile.email_verified
                                    ? "Terverifikasi"
                                    : "Belum terverifikasi"}
                                . Perubahan email belum tersedia karena layanan
                                pengiriman verifikasi belum dikonfigurasi.
                                Terjemahan lengkap saat ini tersedia dalam
                                Bahasa Indonesia.
                            </p>
                            {error}
                            <button
                                className="v5-button"
                                disabled={action.busy}
                            >
                                {action.busy
                                    ? "Menyimpan…"
                                    : "Simpan Perubahan"}
                            </button>
                        </SectionForm>
                    )}
                    {section === "appearance" && (
                        <SectionForm
                            title="Tampilan & aksesibilitas"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void action.run(async () => {
                                    await save("appearance", appearance);
                                    setSavedAppearance(appearance);
                                    document.documentElement.dataset.density =
                                        appearance.density;
                                    document.documentElement.dataset.motion =
                                        appearance.reduced_motion
                                            ? "reduced"
                                            : "system";
                                }, "Tampilan tersimpan.");
                            }}
                        >
                            <p>
                                Pilihan tema langsung tersimpan; preferensi
                                gerakan dan kepadatan memakai tombol simpan.
                            </p>
                            <Field name="theme" label="Tema tampilan">
                                <select
                                    value={appearance.theme}
                                    onChange={(e) => {
                                        const theme = e.target
                                            .value as typeof appearance.theme;
                                        const oldTheme =
                                            document.documentElement.dataset
                                                .theme;
                                        setAppearance({ ...appearance, theme });
                                        document.documentElement.dataset.theme =
                                            theme === "system"
                                                ? matchMedia(
                                                      "(prefers-color-scheme: dark)",
                                                  ).matches
                                                    ? "dark"
                                                    : "light"
                                                : theme;
                                        void action.run(async () => {
                                            try {
                                                await requestJson(
                                                    "/settings/theme",
                                                    "PATCH",
                                                    { theme },
                                                );
                                                setSavedAppearance((value) => ({
                                                    ...value,
                                                    theme,
                                                }));
                                                router.reload({
                                                    only: ["auth", "profile"],
                                                });
                                            } catch (error) {
                                                document.documentElement.dataset.theme =
                                                    oldTheme;
                                                setAppearance((value) => ({
                                                    ...value,
                                                    theme: auth.user.theme,
                                                }));
                                                throw error;
                                            }
                                        }, "Tema tersimpan.");
                                    }}
                                >
                                    <option value="system">Ikuti sistem</option>
                                    <option value="light">Terang</option>
                                    <option value="dark">Gelap</option>
                                </select>
                            </Field>
                            <Field name="density" label="Kepadatan tampilan">
                                <select
                                    name="density"
                                    value={appearance.density}
                                    onChange={(e) =>
                                        setAppearance({
                                            ...appearance,
                                            density: e.target.value,
                                        })
                                    }
                                >
                                    <option value="comfortable">Nyaman</option>
                                    <option value="compact">Ringkas</option>
                                </select>
                            </Field>
                            <label className="v5-check">
                                <input
                                    type="checkbox"
                                    checked={appearance.reduced_motion}
                                    onChange={(e) =>
                                        setAppearance({
                                            ...appearance,
                                            reduced_motion: e.target.checked,
                                        })
                                    }
                                />
                                Kurangi animasi
                            </label>
                            {error}
                            <button
                                className="v5-button"
                                disabled={action.busy}
                            >
                                Simpan Tampilan
                            </button>
                        </SectionForm>
                    )}
                    {section === "notifications" && (
                        <SectionForm
                            title="Notifikasi"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void action.run(async () => {
                                    await save("notifications", {
                                        content_updates: updates,
                                    });
                                }, "Preferensi notifikasi tersimpan.");
                            }}
                        >
                            <label className="v5-check">
                                <input
                                    type="checkbox"
                                    checked={updates}
                                    onChange={(e) =>
                                        setUpdates(e.target.checked)
                                    }
                                />
                                Pembaruan konten melalui kotak notifikasi
                                aplikasi
                            </label>
                            <p className="v5-note">
                                Peringatan perubahan password dan izin akun
                                selalu tersedia dalam aplikasi. Pengiriman email
                                dan pengingat jadwal belum tersedia.
                            </p>
                            <Link
                                href="/notifications"
                                className="v5-button secondary"
                            >
                                Buka notifikasi
                            </Link>
                            {error}
                            <button
                                className="v5-button"
                                disabled={action.busy}
                            >
                                Simpan Notifikasi
                            </button>
                        </SectionForm>
                    )}
                    {section === "security" && (
                        <>
                            <SectionForm
                                title="Keamanan Akun"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void action.run(async () => {
                                        await requestJson(
                                            "/account/password",
                                            "POST",
                                            {
                                                current_password:
                                                    currentPassword,
                                                password,
                                                password_confirmation:
                                                    confirmation,
                                            },
                                        );
                                        setCurrentPassword("");
                                        setPassword("");
                                        setConfirmation("");
                                        refresh();
                                    }, "Password diperbarui. Sesi lain dihentikan.");
                                }}
                            >
                                <p>
                                    Gunakan password unik, minimal 12 karakter.
                                </p>
                                {current}
                                <Field
                                    name="password"
                                    label="Password Baru"
                                    errors={action.errors}
                                >
                                    <input
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                    />
                                </Field>
                                <Field
                                    name="password_confirmation"
                                    label="Konfirmasi Password Baru"
                                >
                                    <input
                                        name="password_confirmation"
                                        type="password"
                                        autoComplete="new-password"
                                        value={confirmation}
                                        onChange={(e) =>
                                            setConfirmation(e.target.value)
                                        }
                                    />
                                </Field>
                                {error}
                                <button
                                    className="v5-button"
                                    disabled={action.busy}
                                >
                                    Perbarui Password
                                </button>
                            </SectionForm>
                            <section className="v5-card v5-form">
                                <h2>Sesi aktif</h2>
                                <p>
                                    Pencabutan memerlukan password saat ini pada
                                    formulir di atas. Sesi ini tetap aktif.
                                </p>
                                {sessions.length ? (
                                    sessions.map((s, i) => (
                                        <div className="v5-row" key={i}>
                                            <strong>
                                                {s.device}{" "}
                                                {s.current ? "· Sesi ini" : ""}
                                            </strong>
                                            <span>
                                                {new Date(
                                                    s.last_active,
                                                ).toLocaleString("id-ID", {
                                                    timeZone: profile.timezone,
                                                })}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p>
                                        Sesi ini aktif. Daftar perangkat
                                        membutuhkan penyimpanan sesi database.
                                    </p>
                                )}
                                <button
                                    className="v5-button secondary"
                                    disabled={action.busy}
                                    onClick={() =>
                                        void action.run(async () => {
                                            await requestJson(
                                                "/account/sessions/revoke",
                                                "POST",
                                                {
                                                    current_password:
                                                        currentPassword,
                                                },
                                            );
                                            setCurrentPassword("");
                                            refresh();
                                        }, "Sesi lain dihentikan.")
                                    }
                                >
                                    Keluar dari sesi lain
                                </button>
                                <p className="v5-note">
                                    Autentikasi TOTP belum tersedia. Akun tetap
                                    menggunakan password; tidak ada status 2FA
                                    aktif.
                                </p>
                            </section>
                            <section className="v5-card">
                                <h2>Aktivitas keamanan</h2>
                                {securityEvents.length ? (
                                    securityEvents.map((e, i) => (
                                        <div className="v5-row" key={i}>
                                            <span>
                                                {(
                                                    {
                                                        "account.password_changed":
                                                            "Password diperbarui",
                                                        "account.sessions_revoked":
                                                            "Sesi lain dihentikan",
                                                        "user.access_changed":
                                                            "Izin akun diperbarui",
                                                        "authorization.denied":
                                                            "Permintaan akses ditolak",
                                                        "account.export_ready":
                                                            "Ekspor data dibuat",
                                                        "account.deletion_requested":
                                                            "Penghapusan akun diminta",
                                                        "account.deletion_cancelled":
                                                            "Penghapusan dibatalkan",
                                                    } as Record<string, string>
                                                )[e.action] ??
                                                    "Aktivitas akun diperbarui"}
                                            </span>
                                            <time>
                                                {new Date(
                                                    e.created_at,
                                                ).toLocaleString("id-ID", {
                                                    timeZone: profile.timezone,
                                                })}
                                            </time>
                                        </div>
                                    ))
                                ) : (
                                    <p>Belum ada perubahan keamanan.</p>
                                )}
                            </section>
                        </>
                    )}
                    {section === "privacy" && (
                        <SectionForm
                            title="Privasi Profil"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void action.run(async () => {
                                    await save("privacy", {
                                        show_activity: activity,
                                    });
                                }, "Preferensi privasi tersimpan.");
                            }}
                        >
                            <p>
                                Profil, catatan, laporan, dan progres hanya
                                dapat dibuka pemilik akun. Tidak ada profil
                                publik atau leaderboard.
                            </p>
                            <label className="v5-check">
                                <input
                                    type="checkbox"
                                    checked={activity}
                                    onChange={(e) =>
                                        setActivity(e.target.checked)
                                    }
                                />
                                Tampilkan aktivitas terbaru pada profil pribadi
                                saya
                            </label>
                            <p className="v5-note">
                                Preferensi ini mengatur tampilan profilmu
                                sendiri. Catatan aktivitas belajar tetap
                                disimpan untuk perhitungan progres.
                            </p>
                            {error}
                            <button
                                className="v5-button"
                                disabled={action.busy}
                            >
                                Simpan Privasi
                            </button>
                        </SectionForm>
                    )}
                    {section === "data" && (
                        <>
                            <section className="v5-card v5-form">
                                <h2>Data & Akun</h2>
                                <p>
                                    Ekspor JSON pribadi mencakup profil,
                                    catatan, laporan, dan progres. Password,
                                    sesi, token, flag, serta data orang lain
                                    dikecualikan. File kedaluwarsa setelah 24
                                    jam.
                                </p>
                                {current}
                                {error}
                                <button
                                    className="v5-button"
                                    disabled={action.busy}
                                    onClick={() =>
                                        void action.run(async () => {
                                            const result = await requestJson<{
                                                download_url: string;
                                            }>("/account/exports", "POST", {
                                                current_password:
                                                    currentPassword,
                                            });
                                            setDownload(result.download_url);
                                            refresh();
                                        }, "Ekspor siap diunduh.")
                                    }
                                >
                                    Buat ekspor data
                                </button>
                                {download && (
                                    <a
                                        className="v5-button secondary"
                                        href={download}
                                    >
                                        Unduh ekspor pribadi
                                    </a>
                                )}
                                {dataRequests
                                    .filter((d) => d.kind === "export")
                                    .map((d) => (
                                        <div key={d.id} className="v5-row">
                                            <span>Ekspor · {d.status}</span>
                                            {d.download_url && (
                                                <a href={d.download_url}>
                                                    Unduh JSON
                                                </a>
                                            )}
                                        </div>
                                    ))}
                            </section>
                            <section className="v5-card v5-form">
                                <h2>Penghapusan akun</h2>
                                <p>
                                    Permintaan memiliki masa tenggang 7 hari dan
                                    diproses oleh operator setelah pemeriksaan.
                                    Kamu dapat membatalkan sebelum diproses.
                                </p>
                                {dataRequests.some(
                                    (d) =>
                                        d.kind === "deletion" &&
                                        d.status === "pending",
                                ) ? (
                                    <>
                                        <p className="v5-note">
                                            Permintaan penghapusan sedang
                                            menunggu. Data masih tersedia.
                                        </p>
                                        <button
                                            className="v5-button secondary"
                                            disabled={action.busy}
                                            onClick={() =>
                                                void action.run(async () => {
                                                    await requestJson(
                                                        "/account/deletion",
                                                        "DELETE",
                                                    );
                                                    refresh();
                                                }, "Penghapusan dibatalkan.")
                                            }
                                        >
                                            Batalkan penghapusan
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Field
                                            name="confirmation"
                                            label="Ketik DELETE untuk meminta penghapusan"
                                        >
                                            <input
                                                name="confirmation"
                                                value={deletionText}
                                                onChange={(e) =>
                                                    setDeletionText(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                        <button
                                            className="v5-button danger"
                                            disabled={
                                                action.busy ||
                                                deletionText !== "DELETE"
                                            }
                                            onClick={() =>
                                                setConfirmDelete(true)
                                            }
                                        >
                                            Minta penghapusan akun
                                        </button>
                                    </>
                                )}
                            </section>
                            <ConfirmDialog
                                open={confirmDelete}
                                onOpenChange={setConfirmDelete}
                                title="Ajukan penghapusan akun?"
                                description="Data tetap tersedia selama masa tenggang 7 hari. Operator akan memproses setelah pemeriksaan; kamu dapat membatalkan sebelum itu."
                                confirmLabel="Ajukan permintaan"
                                pending={action.busy}
                                onConfirm={() =>
                                    void action.run(async () => {
                                        await requestJson(
                                            "/account/deletion",
                                            "POST",
                                            {
                                                current_password:
                                                    currentPassword,
                                                confirmation: deletionText,
                                            },
                                        );
                                        setConfirmDelete(false);
                                        setCurrentPassword("");
                                        refresh();
                                    }, "Permintaan penghapusan tercatat.")
                                }
                            />
                        </>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
