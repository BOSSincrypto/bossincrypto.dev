import { useCallback, useRef, useState } from "react";

/**
 * A state hook that transparently synchronises its value to `localStorage`.
 *
 * On mount, the stored value (if any) is deserialised and used as the initial
 * state. Every subsequent update writes the new value back. SSR-safe: if
 * `window.localStorage` is unavailable, the hook silently falls back to
 * in-memory state.
 *
 * @typeParam T - the JSON-serialisable value type.
 * @param key        localStorage key.
 * @param initialValue  Used when no stored value exists yet.
 * @returns `[value, setValue]` where `setValue` accepts either a direct value
 *          or an updater function.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Keep the latest key in a ref so `setValue` doesn't change identity on
  // every render. This is important for `useEffect` dependency arrays.
  const keyRef = useRef(key);
  keyRef.current = key;

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next =
          typeof value === "function"
            ? (value as (p: T) => T)(prev)
            : value;
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              keyRef.current,
              JSON.stringify(next),
            );
          }
        } catch {
          /* quota exceeded or private mode — ignore silently */
        }
        return next;
      });
    },
    [],
  );

  return [storedValue, setValue];
}
