// src/hooks/useAutoSleep.ts
import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSleepOptions {
  timeout: number; // milliszekundumban (pl. 120000 = 2 perc)
  onSleep: () => void; // Mi történjen alvás előtt
}

/**
 * Auto-sleep hook múzeumi használatra
 * Ha nincs interakció X ideig, automatikusan "elaltatja" az appot
 */
export function useAutoSleep({ timeout, onSleep }: UseAutoSleepOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSleepRef = useRef(onSleep);

  // Friss callback referencia
  onSleepRef.current = onSleep;

  // Timer újraindítása
  const resetTimer = useCallback(() => {
    // Töröljük az előző timert
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Új timer indítása
    timerRef.current = setTimeout(() => {
      onSleepRef.current();
    }, timeout);
  }, [timeout]);

  // Cleanup
  useEffect(() => {
    // Indítás
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resetTimer]);

  return { resetTimer };
}