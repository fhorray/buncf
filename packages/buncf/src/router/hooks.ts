
import { useState, useEffect, useCallback } from 'react';
import { routerStore } from './client';

type FetcherState = "idle" | "submitting" | "loading";

interface Fetcher<TData = any> {
  state: FetcherState;
  data: TData | undefined;
  Form: React.ComponentType<any>;
  submit: (target: string | Record<string, any> | FormData, options?: { method?: string, action?: string }) => void;
  load: (href: string) => void;
}

/**
 * Hook to access the router (pathname, params, query, push, replace, back, etc)
 * Reactive: will re-render when the route changes.
 */
export function useRouter() {
  const [state, setState] = useState(routerStore.getState());

  useEffect(() => {
    const unsubscribe = routerStore.subscribe((newState) => {
      setState(newState);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...state,
    push: routerStore.push,
    replace: routerStore.replace,
    back: routerStore.back,
    forward: routerStore.forward,
    getState: routerStore.getState,
  };
}

/**
 * Hook to get route parameters (e.g., /users/:id)
 */
export function useParams() {
  const router = useRouter();
  return router.params;
}

/**
 * Hook to get and set query parameters
 * Returns [paramsObject, setParamsFunction]
 */
export function useSearchParams(): [Record<string, string>, (params: Record<string, string>) => void] {
  const router = useRouter();

  const setSearchParams = useCallback((newParams: Record<string, string>) => {
    const search = new URLSearchParams(newParams).toString();
    const href = router.pathname + (search ? `?${search}` : "");
    routerStore.push(href);
  }, [router.pathname]);

  return [router.query, setSearchParams];
}

/**
 * Hook to get the current pathname
 */
export function usePathname() {
  const router = useRouter();
  return router.pathname;
}

/**
 * Hook for data fetching and submissions without navigation
 */
export function useFetcher<TData = any>(): Fetcher<TData> {
  const [state, setState] = useState<FetcherState>("idle");
  const [data, setData] = useState<TData | undefined>(undefined);

  const load = useCallback(async (href: string) => {
    setState("loading");
    try {
      const res = await fetch(href);
      if (res.headers.get("content-type")?.includes("application/json")) {
        const json = await res.json();
        setData(json);
      } else {
        setData(await res.text() as any);
      }
    } catch (e) {
      console.error("[buncf] Fetcher load failed:", e);
    } finally {
      setState("idle");
    }
  }, []);

  const submit = useCallback(async (target: string | Record<string, any> | FormData, options: { method?: string, action?: string } = {}) => {
    setState("submitting");
    const method = options.method || "POST";
    const action = options.action || (typeof target === "string" ? target : window.location.pathname);

    let body: any;
    let headers: Record<string, string> = {};

    if (target instanceof FormData) {
      body = target;
    } else if (typeof target === "object") {
      body = JSON.stringify(target);
      headers["Content-Type"] = "application/json";
    }

    try {
      const res = await fetch(action, { method, headers, body });
      if (res.headers.get("content-type")?.includes("application/json")) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("[buncf] Fetcher submit failed:", e);
    } finally {
      setState("idle");
    }
  }, []);

  return {
    state,
    data,
    submit,
    load,
    Form: () => null // Placeholder
  };
}

/**
 * Helper hook for form submissions
 */
export function useSubmit() {
  const fetcher = useFetcher();
  return fetcher.submit;
}
