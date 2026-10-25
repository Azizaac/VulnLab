import { afterEach, expect, it, vi } from "vitest";
import { requestJson, RequestError } from "./learning";

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

it("ends a stalled write without retrying or claiming it saved", async () => {
    const events = vi.fn();
    window.addEventListener("vulnlab:request-error", events);
    const fetchMock = vi.fn(
        (_url, options: RequestInit) =>
            new Promise((_resolve, reject) => {
                options.signal?.addEventListener("abort", () =>
                    reject(new DOMException("Aborted", "AbortError")),
                );
            }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
        requestJson(
            "/notes",
            "POST",
            { body_md: "local draft" },
            { timeoutMs: 10 },
        ),
    ).rejects.toMatchObject({ status: 408 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(events).toHaveBeenCalledTimes(1);
    expect(events.mock.calls[0][0].detail.message).toContain(
        "belum dapat dipastikan",
    );
    window.removeEventListener("vulnlab:request-error", events);
});

it("also bounds a stalled response body and preserves HTTP validation errors", async () => {
    vi.stubGlobal(
        "fetch",
        vi.fn((_url, options: RequestInit) =>
            Promise.resolve({
                status: 200,
                ok: true,
                json: () =>
                    new Promise((_resolve, reject) =>
                        options.signal?.addEventListener("abort", () =>
                            reject(new DOMException("Aborted", "AbortError")),
                        ),
                    ),
            }),
        ),
    );
    await expect(
        requestJson("/notes", "POST", {}, { timeoutMs: 10 }),
    ).rejects.toMatchObject({ status: 408 });
    vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    errors: { title: ["Judul wajib diisi."] },
                }),
                { status: 422 },
            ),
        ),
    );
    await expect(requestJson("/notes", "POST", {})).rejects.toBeInstanceOf(
        RequestError,
    );
});
