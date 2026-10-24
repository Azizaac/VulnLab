import { afterEach, describe, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
} from "@testing-library/react";
import {
    GlobalToastProvider,
    normalizeLaravelError,
    useFeedback,
} from "./feedback";

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});
function Actions() {
    const { notify } = useFeedback();
    return (
        <>
            <button
                onClick={() =>
                    notify({
                        type: "success",
                        title: "Laporan disimpan",
                        key: "save-confirmed",
                    })
                }
            >
                Simpan terkonfirmasi
            </button>
            <button
                onClick={() =>
                    notify({
                        type: "error",
                        title: "Gagal menyimpan laporan",
                        action: { label: "Coba lagi", onClick: () => {} },
                    })
                }
            >
                Gagal
            </button>
            {[1, 2, 3, 4].map((id) => (
                <button
                    key={id}
                    onClick={() =>
                        notify({ type: "info", title: `Aktivitas ${id}` })
                    }
                >
                    Tambah {id}
                </button>
            ))}
        </>
    );
}
describe("shared feedback contracts", () => {
    it("shows the server cooldown when rate limited", () => {
        expect(
            normalizeLaravelError({ status: 429, data: { retry_after: "30" } })
                .message,
        ).toContain("30 detik");
    });
    it("maps Laravel field arrays and session/authorization errors without treating a 422 as a server crash", () => {
        expect(
            normalizeLaravelError({
                status: 422,
                data: { errors: { title: ["Judul laporan wajib diisi."] } },
            }),
        ).toMatchObject({
            status: 422,
            title: "Periksa formulir",
            errors: { title: "Judul laporan wajib diisi." },
            needsLogin: false,
        });
        expect(normalizeLaravelError({ status: 419 })).toMatchObject({
            title: "Sesi berakhir",
            needsLogin: true,
        });
        expect(normalizeLaravelError({ status: 403 }).title).toBe(
            "Akses ditolak",
        );
        expect(
            normalizeLaravelError(new TypeError("Failed to fetch")).title,
        ).toBe("Layanan sedang bermasalah");
    });
    it("deduplicates confirmed notifications and bounds the stack to three visible items", () => {
        render(
            <GlobalToastProvider>
                <Actions />
            </GlobalToastProvider>,
        );
        fireEvent.click(screen.getByText("Simpan terkonfirmasi"));
        fireEvent.click(screen.getByText("Simpan terkonfirmasi"));
        expect(screen.getAllByText("Laporan disimpan")).toHaveLength(1);
        for (const id of [1, 2, 3, 4])
            fireEvent.click(screen.getByText(`Tambah ${id}`));
        expect(screen.getAllByRole("status")).toHaveLength(3);
        expect(screen.queryByText("Aktivitas 1")).toBeNull();
    });
    it("dismisses success after five seconds and keeps actionable failure until dismissed", () => {
        vi.useFakeTimers();
        render(
            <GlobalToastProvider>
                <Actions />
            </GlobalToastProvider>,
        );
        fireEvent.click(screen.getByText("Simpan terkonfirmasi"));
        fireEvent.click(screen.getByText("Gagal"));
        act(() => {
            vi.advanceTimersByTime(6000);
        });
        expect(screen.queryByText("Laporan disimpan")).toBeNull();
        expect(screen.getByRole("alert").textContent).toContain(
            "Gagal menyimpan laporan",
        );
        fireEvent.click(
            screen.getByRole("button", {
                name: "Tutup notifikasi: Gagal menyimpan laporan",
            }),
        );
        expect(screen.queryByRole("alert")).toBeNull();
    });
});
