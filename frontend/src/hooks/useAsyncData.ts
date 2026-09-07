import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Generic data-fetching hook: re-runs `fetcher` whenever `deps` change, and
 * exposes a stable `refetch` for manual retries after mutations or errors. */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: DependencyList): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    let cancelled = false;
    // Canonical data-fetching-in-effect shape: mark loading before the async
    // call starts, then resolve once it settles (see React docs' own
    // "Fetching data" example, which has the same shape).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error: error instanceof Error ? error.message : "Unknown error" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [depsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { ...state, refetch };
}
