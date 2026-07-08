import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the initial value when no stored value exists", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", { a: 1 }),
    );
    expect(result.current[0]).toEqual({ a: 1 });
  });

  it("persists a new value to localStorage", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", { a: 1 }),
    );
    act(() => {
      result.current[1]({ a: 2 });
    });
    expect(result.current[0]).toEqual({ a: 2 });
    expect(JSON.parse(localStorage.getItem("test-key")!)).toEqual({ a: 2 });
  });

  it("reads an existing value from localStorage on init", () => {
    localStorage.setItem("existing", JSON.stringify({ a: 99 }));
    const { result } = renderHook(() =>
      useLocalStorage("existing", { a: 1 }),
    );
    expect(result.current[0]).toEqual({ a: 99 });
  });

  it("supports an updater function", () => {
    const { result } = renderHook(() => useLocalStorage("count", 0));
    act(() => {
      result.current[1]((prev) => prev + 5);
    });
    act(() => {
      result.current[1]((prev) => prev + 3);
    });
    expect(result.current[0]).toBe(8);
    expect(JSON.parse(localStorage.getItem("count")!)).toBe(8);
  });

  it("handles corrupted JSON gracefully by falling back to initial", () => {
    localStorage.setItem("corrupt", "{not json");
    const { result } = renderHook(() =>
      useLocalStorage("corrupt", "default"),
    );
    expect(result.current[0]).toBe("default");
  });

  it("setValue identity stays stable across renders", () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage("stable", 1),
    );
    const first = result.current[1];
    rerender();
    expect(result.current[1]).toBe(first);
  });

  it("works with boolean values (settings toggles)", () => {
    const { result } = renderHook(() =>
      useLocalStorage("bool", true),
    );
    expect(result.current[0]).toBe(true);
    act(() => {
      result.current[1](false);
    });
    expect(result.current[0]).toBe(false);
    expect(JSON.parse(localStorage.getItem("bool")!)).toBe(false);
  });

  it("works with object values (settings state)", () => {
    const initial = { scanlines: true, matrixRain: false, sound: false };
    const { result } = renderHook(() =>
      useLocalStorage("settings", initial),
    );
    act(() => {
      result.current[1]((prev) => ({ ...prev, scanlines: false }));
    });
    expect(result.current[0]).toEqual({
      scanlines: false,
      matrixRain: false,
      sound: false,
    });
  });

  it("survives localStorage.setItem throwing (quota / private mode)", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem");
    spy.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const { result } = renderHook(() =>
      useLocalStorage("quota", "val"),
    );
    act(() => {
      result.current[1]("new");
    });
    // value should still update in memory despite the throw
    expect(result.current[0]).toBe("new");
    spy.mockRestore();
  });
});
