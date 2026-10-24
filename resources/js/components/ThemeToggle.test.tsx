import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ThemeToggle from "./ThemeToggle";

beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "light";
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});
describe("theme preference", () => {
    it("switches theme and persists the chosen preference", () => {
        render(<ThemeToggle />);
        fireEvent.click(
            screen.getByRole("button", { name: "Aktifkan tema gelap" }),
        );
        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(localStorage.getItem("vulnlab-theme")).toBe("dark");
        fireEvent.click(
            screen.getByRole("button", { name: "Aktifkan tema terang" }),
        );
        expect(document.documentElement.dataset.theme).toBe("light");
    });
    it("respects the theme restored before mounting", () => {
        document.documentElement.dataset.theme = "dark";
        render(<ThemeToggle />);
        expect(
            screen.getByRole("button", { name: "Aktifkan tema terang" }),
        ).toBeTruthy();
        expect(localStorage.getItem("vulnlab-theme")).toBe("dark");
    });
    it("remains usable when browser storage is unavailable", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("Disabled");
        });
        render(<ThemeToggle />);
        fireEvent.click(
            screen.getByRole("button", { name: "Aktifkan tema gelap" }),
        );
        expect(document.documentElement.dataset.theme).toBe("dark");
    });
});
