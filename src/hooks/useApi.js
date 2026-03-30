import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Fetches a JSON API endpoint and optionally polls at an interval.
 * Pauses polling when the tab is not visible (saves CPU).
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

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (mountedRef.current) {
        setData(json);
        setError(null);
      }
    } catch (e) {
      if (mountedRef.current) setError(e.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    function startPolling() {
      stopPolling();
      if (interval && !document.hidden) {
        timerRef.current = setInterval(fetchData, interval);
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
        fetchData(); // Refresh immediately when tab becomes visible
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

  return { data, loading, error, refetch: fetchData };
}
