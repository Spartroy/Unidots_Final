import { useEffect, useRef } from 'react';

/**
 * Repeatedly invokes the provided async function on an interval.
 * - Calls once immediately
 * - Pauses when the tab is hidden; resumes when visible
 * - Clears on unmount
 */
export default function useAutoRefresh(callback, intervalMs = 10000, deps = []) {
  const intervalRef = useRef(null);
  const savedCallbackRef = useRef(callback);

  // Always keep latest callback
  useEffect(() => {
    savedCallbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let isCancelled = false;

    const tick = async () => {
      try {
        await savedCallbackRef.current();
      } catch (_error) {
        // Swallow errors to keep interval running
      }
    };

    const start = () => {
      if (intervalRef.current) return;
      // Immediate fire once
      tick();
      intervalRef.current = setInterval(tick, intervalMs);
    };

    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    if (!isCancelled) {
      start();
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      isCancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);
}


