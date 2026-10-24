import { useForm, usePage } from "@inertiajs/react";
import type { FormEvent } from "react";
import type { RoadmapProps, SharedProps } from "../types";
import { Button } from "./ui/button";

export default function PlanForm({
    plan,
    today,
}: Pick<RoadmapProps, "plan" | "today">) {
    const { auth } = usePage<SharedProps>().props;
    const form = useForm({
        starts_on: plan?.starts_on || today.date,
        timezone: plan?.timezone || auth.user.timezone,
        daily_goal_minutes: 120,
    });
    function submit(event: FormEvent) {
        event.preventDefault();
        if (plan) form.patch("/roadmap/plan", { preserveScroll: true });
        else form.post("/roadmap/plan", { preserveScroll: true });
    }
    return (
        <details className="card plan-settings" open={!plan}>
            <summary>
                {plan
                    ? "Atur tanggal mulai & zona waktu"
                    : "Buat rencana 90 harimu"}
            </summary>
            <form onSubmit={submit} className="plan-form">
                <div>
                    <label htmlFor="starts_on">Tanggal mulai</label>
                    <input
                        id="starts_on"
                        name="starts_on"
                        aria-invalid={!!form.errors.starts_on}
                        aria-describedby={
                            form.errors.starts_on
                                ? "starts_on-error"
                                : undefined
                        }
                        type="date"
                        min="2000-01-01"
                        max="2099-09-30"
                        required
                        value={form.data.starts_on}
                        onChange={(e) =>
                            form.setData("starts_on", e.target.value)
                        }
                    />
                    {form.errors.starts_on && (
                        <p
                            id="starts_on-error"
                            role="alert"
                            className="field-error"
                        >
                            {form.errors.starts_on}
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="plan-timezone">Zona waktu rencana</label>
                    <select
                        id="plan-timezone"
                        name="timezone"
                        aria-invalid={!!form.errors.timezone}
                        aria-describedby={
                            form.errors.timezone ? "timezone-error" : undefined
                        }
                        value={form.data.timezone}
                        onChange={(e) =>
                            form.setData("timezone", e.target.value)
                        }
                    >
                        {[
                            ...new Set([
                                form.data.timezone,
                                "Asia/Jakarta",
                                "Asia/Makassar",
                                "Asia/Jayapura",
                                "UTC",
                                "America/New_York",
                            ]),
                        ].map((zone) => (
                            <option key={zone}>{zone}</option>
                        ))}
                    </select>
                    {form.errors.timezone && (
                        <p
                            id="timezone-error"
                            role="alert"
                            className="field-error"
                        >
                            {form.errors.timezone}
                        </p>
                    )}
                </div>
                <p>
                    Target 120 menit: 20 teori · 70 praktik · 30 catatan/review.
                    Mengubah jadwal tidak menghapus progres. Minggu berisi
                    review tanpa topik baru.
                </p>
                <Button disabled={form.processing}>
                    {form.processing
                        ? "Menyimpan..."
                        : plan
                          ? "Simpan jadwal"
                          : "Buat rencana"}
                </Button>
            </form>
        </details>
    );
}
