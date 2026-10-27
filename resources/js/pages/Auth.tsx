import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import { focusFirstError } from "../feedback";
import ThemeToggle from "../components/ThemeToggle";

export default function Auth({ mode }: { mode: "login" | "register" }) {
    const register = mode === "register";
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const form = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        timezone: "Asia/Jakarta",
        starts_on: new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
        }).format(new Date()),
        daily_goal_minutes: 120,
        remember: false,
    });
    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(register ? "/register" : "/login", {
            onError: focusFirstError,
            onFinish: () => form.reset("password", "password_confirmation"),
        });
    }
    return (
        <div className="auth-page">
            <Head title={register ? "Daftar" : "Masuk"} />
            <section className="auth-story" aria-label="Tentang VulnLab">
                <div className="brand">
                    <span className="brand-mark">
                        <ShieldCheck aria-hidden="true" />
                    </span>{" "}
                    VulnLab
                </div>
                <div className="auth-story-content">
                    <span className="eyebrow">
                        Cybersecurity Learning Platform
                    </span>
                    <h1>
                        Belajar dengan <span>rasa ingin tahu.</span> Buktikan
                        lewat praktik.
                    </h1>
                    <p>
                        Pelajari keamanan Web &amp; API dari referensi yang
                        jelas, coba sendiri di lab lokal, dan lihat kemampuanmu
                        tumbuh dengan progres yang terukur.
                    </p>
                    <div className="auth-art" aria-hidden="true">
                        <svg viewBox="0 0 450 140" fill="none">
                            <path
                                d="M20 112H432M22 112L83 70L145 98L205 32L275 74L335 52L431 112M20 112L112 93L171 105L224 81L298 104L360 89L430 112"
                                stroke="currentColor"
                                strokeOpacity=".4"
                            />
                            <circle
                                cx="205"
                                cy="32"
                                r="6"
                                fill="currentColor"
                            />
                            <path
                                d="M205 32V7L236 17L205 27M128 10h50M153 2v16M309 25h70M344 15v20"
                                stroke="currentColor"
                                strokeOpacity=".5"
                            />
                            <circle
                                cx="112"
                                cy="93"
                                r="3"
                                fill="currentColor"
                            />
                            <circle
                                cx="360"
                                cy="89"
                                r="3"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                    <div className="auth-journey">
                        <div>
                            <span>01 / LEARN</span>
                            <strong>Pelajari</strong>Materi terarah
                        </div>
                        <div>
                            <span>02 / PRACTICE</span>
                            <strong>Eksperimen</strong>Lab terkendali
                        </div>
                        <div>
                            <span>03 / PROVE</span>
                            <strong>Evaluasi</strong>Progres nyata
                        </div>
                    </div>
                </div>
                <p className="auth-story-footer">
                    CURIOUS MINDS. SAFER SOFTWARE.{" "}
                    <span>VULNLAB / LEARNING EDITION</span>
                </p>
            </section>
            <main className="auth-form-area">
                <div className="auth-top">
                    <span className="auth-logo-mobile">
                        <ShieldCheck aria-hidden="true" /> VulnLab
                    </span>
                    <ThemeToggle />
                </div>
                <div className="auth-form-card">
                    <span className="auth-tag">AKUN VULNLAB</span>
                    <nav className="auth-tabs" aria-label="Mode autentikasi">
                        <Link
                            href="/login"
                            aria-current={!register ? "page" : undefined}
                        >
                            Masuk
                        </Link>
                        <Link
                            href="/register"
                            aria-current={register ? "page" : undefined}
                        >
                            Daftar
                        </Link>
                    </nav>
                    <h2>
                        {register
                            ? "Mulai belajar dengan cara yang benar."
                            : "Lanjutkan perjalanan belajarmu."}
                    </h2>
                    <p className="muted">
                        {register
                            ? "Bangun pemahaman, uji sendiri di lab, lalu catat progresmu."
                            : "Masuk untuk melanjutkan modul, lab, dan progres terakhir."}
                    </p>
                    <form onSubmit={submit} className="auth-form">
                        {register && (
                            <div>
                                <label htmlFor="name">Nama</label>
                                <input
                                    id="name"
                                    name="name"
                                    aria-invalid={!!form.errors.name}
                                    aria-describedby={
                                        form.errors.name
                                            ? "name-error"
                                            : undefined
                                    }
                                    autoComplete="name"
                                    required
                                    maxLength={80}
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData("name", e.target.value)
                                    }
                                />
                                {form.errors.name && (
                                    <p
                                        id="name-error"
                                        className="field-error"
                                        role="alert"
                                    >
                                        {form.errors.name}
                                    </p>
                                )}
                            </div>
                        )}
                        <div>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                aria-invalid={!!form.errors.email}
                                aria-describedby={
                                    form.errors.email
                                        ? "email-error"
                                        : undefined
                                }
                                type="email"
                                autoComplete="email"
                                required
                                maxLength={254}
                                value={form.data.email}
                                onChange={(e) =>
                                    form.setData("email", e.target.value)
                                }
                                placeholder="nama@contoh.com"
                            />
                            {form.errors.email && (
                                <p
                                    id="email-error"
                                    className="field-error"
                                    role="alert"
                                >
                                    {form.errors.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password">Kata sandi</label>
                            <div className="auth-password">
                                <input
                                    id="password"
                                    name="password"
                                    aria-invalid={!!form.errors.password}
                                    type={showPassword ? "text" : "password"}
                                    autoComplete={
                                        register
                                            ? "new-password"
                                            : "current-password"
                                    }
                                    required
                                    minLength={register ? 12 : undefined}
                                    value={form.data.password}
                                    onChange={(e) =>
                                        form.setData("password", e.target.value)
                                    }
                                    aria-describedby={
                                        [
                                            register ? "password-help" : "",
                                            form.errors.password
                                                ? "password-error"
                                                : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ") || undefined
                                    }
                                />
                                <button
                                    type="button"
                                    className="auth-show-password"
                                    aria-label={
                                        showPassword
                                            ? "Sembunyikan kata sandi"
                                            : "Tampilkan kata sandi"
                                    }
                                    aria-pressed={showPassword}
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    {showPassword ? "Sembunyikan" : "Lihat"}
                                </button>
                            </div>
                            {register && (
                                <p id="password-help" className="input-help">
                                    Gunakan minimal 12 karakter.
                                </p>
                            )}
                            {form.errors.password && (
                                <p
                                    id="password-error"
                                    className="field-error"
                                    role="alert"
                                >
                                    {form.errors.password}
                                </p>
                            )}
                        </div>
                        {register && (
                            <>
                                <div>
                                    <label htmlFor="password_confirmation">
                                        Ulangi kata sandi
                                    </label>
                                    <div className="auth-password">
                                        <input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            aria-invalid={
                                                !!form.errors
                                                    .password_confirmation
                                            }
                                            aria-describedby={
                                                form.errors
                                                    .password_confirmation
                                                    ? "password_confirmation-error"
                                                    : undefined
                                            }
                                            type={
                                                showConfirmation
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete="new-password"
                                            required
                                            value={
                                                form.data.password_confirmation
                                            }
                                            onChange={(e) =>
                                                form.setData(
                                                    "password_confirmation",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <button
                                            type="button"
                                            className="auth-show-password"
                                            aria-label={
                                                showConfirmation
                                                    ? "Sembunyikan konfirmasi kata sandi"
                                                    : "Tampilkan konfirmasi kata sandi"
                                            }
                                            aria-pressed={showConfirmation}
                                            onClick={() =>
                                                setShowConfirmation(
                                                    !showConfirmation,
                                                )
                                            }
                                        >
                                            {showConfirmation
                                                ? "Sembunyikan"
                                                : "Lihat"}
                                        </button>
                                    </div>
                                    {form.errors.password_confirmation && (
                                        <p
                                            id="password_confirmation-error"
                                            role="alert"
                                            className="field-error"
                                        >
                                            {form.errors.password_confirmation}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="timezone">Zona waktu</label>
                                    <select
                                        id="timezone"
                                        name="timezone"
                                        aria-invalid={!!form.errors.timezone}
                                        aria-describedby={
                                            form.errors.timezone
                                                ? "timezone-error"
                                                : undefined
                                        }
                                        value={form.data.timezone}
                                        onChange={(e) =>
                                            form.setData(
                                                "timezone",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {[
                                            ...new Set([
                                                form.data.timezone,
                                                "Asia/Jakarta",
                                                "Asia/Makassar",
                                                "Asia/Jayapura",
                                                "UTC",
                                            ]),
                                        ].map((zone) => (
                                            <option key={zone}>{zone}</option>
                                        ))}
                                    </select>
                                    {form.errors.timezone && (
                                        <p
                                            id="timezone-error"
                                            className="field-error"
                                            role="alert"
                                        >
                                            {form.errors.timezone}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="registration-start">
                                        Tanggal mulai rencana
                                    </label>
                                    <input
                                        id="registration-start"
                                        name="starts_on"
                                        aria-invalid={!!form.errors.starts_on}
                                        aria-describedby={
                                            form.errors.starts_on
                                                ? "starts_on-error"
                                                : undefined
                                        }
                                        type="date"
                                        required
                                        min="2000-01-01"
                                        max="2099-09-30"
                                        value={form.data.starts_on}
                                        onChange={(e) =>
                                            form.setData(
                                                "starts_on",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {form.errors.starts_on && (
                                        <p
                                            id="starts_on-error"
                                            className="field-error"
                                            role="alert"
                                        >
                                            {form.errors.starts_on}
                                        </p>
                                    )}
                                    <p className="input-help">
                                        Target 120 menit/hari: 20 teori, 70
                                        praktik, 30 catatan/review.
                                    </p>
                                </div>
                            </>
                        )}
                        {!register && (
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={form.data.remember}
                                    onChange={(e) =>
                                        form.setData(
                                            "remember",
                                            e.target.checked,
                                        )
                                    }
                                />{" "}
                                Ingat perangkat ini
                            </label>
                        )}
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="auth-submit"
                        >
                            {form.processing
                                ? "Memproses..."
                                : register
                                  ? "Buat akun"
                                  : "Masuk"}
                            <ArrowRight size={17} />
                        </Button>
                    </form>
                    <p className="auth-switch">
                        {register ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
                        <Link href={register ? "/login" : "/register"}>
                            {register ? "Masuk" : "Daftar gratis"}
                        </Link>
                    </p>
                    <p className="auth-legal">
                        <ShieldCheck size={15} aria-hidden="true" /> Untuk
                        pembelajaran di lingkungan berizin.
                    </p>
                </div>
            </main>
        </div>
    );
}
