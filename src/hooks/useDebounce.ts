// src/hooks/useDebounce.ts
import { useRef, useCallback } from 'react';

/**
 * Debounce hook - megakadályozza a túl gyors ismételt hívásokat
 * Gyerekbarát UI-hoz ideális: gyors kattintgatás nem okoz problémát
 */

export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Mindig friss callback referencia
  callbackRef.current = callback;

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  return debouncedFn as T;
}

/**
 * Throttle hook - maximum N ms-onként engedi a hívást
 * Alternatíva a debounce-hoz
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  const throttledFn = useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callbackRef.current(...args);
    }
  }, [delay]);

  return throttledFn as T;
}