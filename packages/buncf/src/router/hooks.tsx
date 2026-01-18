
import { useState, useEffect, useCallback } from 'react';
import { routerStore } from './client';
import { loaderClient } from './loader-client';

type FetcherState = "idle" | "submitting" | "loading";

interface Fetcher<TData = any> {
  state: FetcherState;
  data: TData | undefined;
  Form: React.ComponentType<React.FormHTMLAttributes<HTMLFormElement> & { action?: string; method?: string }>;
  submit: (target: string | Record<string, any> | FormData, options?: { method?: string, action?: string }) => void;
  load: (href: string) => void;
  // DX Helpers
  isLoading: boolean;
  isSubmitting: boolean;
  formData?: FormData;
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
  // Keep track of the AbortController to cancel pending requests
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Derived state for better DX
  const isLoading = state === "loading";
  const isSubmitting = state === "submitting";

  const load = useCallback(async (href: string) => {
    // Cancel previous request if active
    if (abortController) abortController.abort();
    const controller = new AbortController();
    setAbortController(controller);

    setState("loading");
    try {
      const res = await fetch(href, { signal: controller.signal });
      if (res.headers.get("content-type")?.includes("application/json")) {
        const json = await res.json();
        setData(json);
      } else {
        setData(await res.text() as any);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("[buncf] Fetcher load failed:", e);
      }
    } finally {
      // Only reset state if this is the active controller
      if (!controller.signal.aborted) {
        setState("idle");
        setAbortController(null);
      }
    }
  }, [abortController]);

  const submit = useCallback(async (target: string | Record<string, any> | FormData, options: { method?: string, action?: string } = {}) => {
    // Cancel previous request
    if (abortController) abortController.abort();
    const controller = new AbortController();
    setAbortController(controller);

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
      const res = await fetch(action, { method, headers, body, signal: controller.signal });
      if (res.headers.get("content-type")?.includes("application/json")) {
        const json = await res.json();
        setData(json);
      }

      // Auto-Revalidation: Invalidate cache and trigger reload
      loaderClient.invalidateAll();
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("[buncf] Fetcher submit failed:", e);
      }
    } finally {
      if (!controller.signal.aborted) {
        setState("idle");
        setAbortController(null);
      }
    }
  }, [abortController]);

  // Declarative Form Component
  const Form = useCallback(({ children, action, method = "POST", ...props }: any) => {
    return (
      <form
        { ...props }
        onSubmit = {(e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    submit(formData, { action, method });
  }
}
      >
  { children }
  </form>
    );
  }, [submit]);

return {
  state,
  data,
  submit,
  load,
  Form: Form as any, // Cast to any to avoid complex recursive type issues for now
  // DX Improvements
  isLoading,
  isSubmitting,
  // Future proofing
  formData: undefined, // Could expose optimistic data here
} as any;
}

/**
 * Helper hook for form submissions
 */
export function useSubmit() {
  const fetcher = useFetcher();
  return fetcher.submit;
}
