import { useState, useEffect, useCallback, useRef } from 'react';

const MIN_SPINNER_MS = 400;
const MANUAL_COOLDOWN_MS = 2000;

/**
 * Fetches a JSON API endpoint and optionally polls at an interval.
 * Pauses polling when the tab is not visible (saves CPU).
 * Manual refetch has a 2s cooldown to prevent hammering.
 *
 * @param {string} endpoint - e.g. '/api/system'
 * @param {number|null} interval - polling interval in ms, or null for no polling
 */
export function useApi(endpoint, interval = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);
  const lastManualRef = useRef(0);

  const fetchData = useCallback(async (manual = false) => {
    // Prevent concurrent fetches
    if (inFlightRef.current) return;

    // Cooldown on manual refresh
    if (manual) {
      const now = Date.now();
      if (now - lastManualRef.current < MANUAL_COOLDOWN_MS) return;
      lastManualRef.current = now;
    }

    inFlightRef.current = true;

    if (mountedRef.current) setLoading(true);

    try {
      const start = Date.now();
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // Minimum spinner time so fast responses still show visual feedback
      const elapsed = Date.now() - start;
      if (elapsed < MIN_SPINNER_MS) {
        await new Promise(r => setTimeout(r, MIN_SPINNER_MS - elapsed));
      }

      if (mountedRef.current) {
        setData(json);
        setError(null);
      }
    } catch (e) {
      if (mountedRef.current) setError(e.message);
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [endpoint]);

  // Manual refetch wrapper
  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    function startPolling() {
      stopPolling();
      if (interval && !document.hidden) {
        timerRef.current = setInterval(() => fetchData(false), interval);
      }
    }

    function stopPolling() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchData(false);
        startPolling();
      }
    }

    if (interval) {
      startPolling();
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      mountedRef.current = false;
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchData, interval]);

  return { data, loading, error, refetch };
}
