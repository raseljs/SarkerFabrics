"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Transient UI feedback; late requests cannot schedule work after unmount. */
export function useTimedFeedback<T>(initialValue: T, duration: number) {
  const [value, setValue] = useState(initialValue);
  const mounted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  const show = useCallback((next: T) => {
    if (!mounted.current) return;
    if (timer.current !== null) clearTimeout(timer.current);
    setValue(next);
    timer.current = setTimeout(() => {
      timer.current = null;
      setValue(initialValue);
    }, duration);
  }, [duration, initialValue]);

  return [value, show] as const;
}
