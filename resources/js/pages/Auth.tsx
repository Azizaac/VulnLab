import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowRight, Check, ShieldCheck, Terminal } from "lucide-react";
import type { FormEvent } from "react";
import { Button } from "../components/ui/button";

export default function Auth({ mode }: { mode: "login" | "register" }) {
    const register = mode === "register";
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
            onFinish: () => form.reset("password", "password_confirmation"),
        });
    }
    return (
        <div className="auth-page">
            <Head title={register ? "Daftar" : "Masuk"} />
            <section className="auth-story">
                <div className="brand">
                    <span className="brand-mark">
                        <ShieldCheck />
                    </span>
                    VulnLab
                </div>
                <div className="auth-story-content">
                    <span className="eyebrow">
                        YOUR SECURITY JOURNEY STARTS HERE
                    </span>
                    <h1>
                        Belajar memahami.
                        <br />
                        Berlatih melindungi.
                    </h1>
                    <p>
                        Bangun fondasi Web & API Security dengan langkah kecil
                        yang terarah, setiap hari.
                    </p>
                    <div className="terminal-card">
                        <div className="terminal-dots">
                            <i />
                            <i />
                            <i />
                            <span>~/vulnlab/your-journey</span>
                        </div>
                        <p>
                            <span>$</span> start learning --path web-api
                        </p>
                        <p>
                            <Check size={14} /> 90 hari, roadmap terstruktur
                        </p>
                        <p>
                            <Check size={14} /> 2 jam sehari, progres tersimpan
                        </p>
                        <p>
                            <Check size={14} /> Latihan yang bertanggung jawab
                        </p>
                        <p className="terminal-ready">
                            <Terminal size={15} /> Ready when you are.
                        </p>
                    </div>
                </div>
                <p className="auth-story-footer">
                    Rasa ingin tahu. Arah yang jelas. Kebiasaan yang baik.
                </p>
            </section>
            <main className="auth-form-area">
                <div className="auth-form-card">
                    <span className="auth-logo-mobile">
                        <ShieldCheck size={24} /> VulnLab
                    </span>
                    <span className="eyebrow">SELAMAT DATANG DI VULNLAB</span>
                    <h2>
                        {register
                            ? "Mulai perjalananmu."
                            : "Senang melihatmu lagi."}
                    </h2>
                    <p className="muted">
                        {register
                            ? "Buat akun dan bangun kebiasaan belajar security."
                            : "Masuk untuk melanjutkan perjalanan belajarmu."}
                    </p>
                    <form onSubmit={submit} className="auth-form">
                        {register && (
                            <div>
                                <label htmlFor="name">Nama</label>
                                <input
                                    id="name"
                                    autoComplete="name"
                                    required
                                    maxLength={80}
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData("name", e.target.value)
                                    }
                                />
                                {form.errors.name && (
                                    <p className="field-error" role="alert">
                                        {form.errors.name}
                                    </p>
                                )}
                            </div>
                        )}
                        <div>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
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
                                <p className="field-error" role="alert">
                                    {form.errors.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password">Kata sandi</label>
                            <input
                                id="password"
                                type="password"
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
                                    register ? "password-help" : undefined
                                }
                            />
                            {register && (
                                <p id="password-help" className="input-help">
                                    Gunakan minimal 12 karakter.
                                </p>
                            )}
                            {form.errors.password && (
                                <p className="field-error" role="alert">
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
                                    <input
                                        id="password_confirmation"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={form.data.password_confirmation}
                                        onChange={(e) =>
                                            form.setData(
                                                "password_confirmation",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <label htmlFor="timezone">Zona waktu</label>
                                    <select
                                        id="timezone"
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
                                        <p className="field-error" role="alert">
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
                                        <p className="field-error" role="alert">
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
                                Ingat saya
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
                        <ShieldCheck size={15} /> Untuk pembelajaran di
                        lingkungan berizin.
                    </p>
                </div>
            </main>
        </div>
    );
}
