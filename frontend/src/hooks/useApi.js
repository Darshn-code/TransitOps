/**
 * useApi(fetcher, deps)
 *
 * Minimal data-fetching hook. Returns { data, loading, error, refetch }.
 * - data:    null until first successful fetch, then whatever the API returned
 * - loading: true during any fetch
 * - error:   the Error thrown by the fetcher, or null
 * - refetch: call to trigger a manual re-fetch
 *
 * Usage:
 *   const { data: vehicles, loading, error } = useApi(() => getVehicles(), []);
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export function useApi(fetcher, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tick,    setTick]    = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcherRef.current()
      .then(result => { if (!cancelled) { setData(result); setLoading(false); } })
      .catch(err   => { if (!cancelled) { setError(err);   setLoading(false); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);
  return { data, loading, error, refetch };
}
