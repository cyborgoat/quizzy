import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

const store = new Map<string, unknown>();

/**
 * `useState` whose value is remembered for the app session under `key`, so a
 * page can restore its view state after navigating away and back.
 */
export function useSessionState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => (store.has(key) ? (store.get(key) as T) : initial));
  const set = useCallback<Dispatch<SetStateAction<T>>>(
    (update) => {
      setValue((current) => {
        const next = typeof update === "function" ? (update as (prev: T) => T)(current) : update;
        store.set(key, next);
        return next;
      });
    },
    [key],
  );
  return [value, set];
}
