import { useState, useEffect, useCallback } from 'react';
import { routerStore } from './client';
import { loaderClient } from './loader-client';

type FetcherState = 'idle' | 'submitting' | 'loading';

// SWR-style Fetcher (GET / subscription)
interface KeyedFetcher<TData = any> {
  state: FetcherState;
  data: TData | undefined;
  isLoading: boolean;
  mutate: () => void;
  submit: (
    target: string | Record<string, any> | FormData,
    options?: { method?: string; action?: string },
  ) => Promise<any>;
  Form: React.ComponentType<
    React.FormHTMLAttributes<HTMLFormElement> & {
      action?: string;
      method?: string;
    }
  >;
}

// Mutation-style Fetcher (Actions)
interface MutationFetcher<TData = any> {
  state: FetcherState;
  data: TData | undefined;
  isSubmitting: boolean;
  submit: (
    target: string | Record<string, any> | FormData,
    options?: { method?: string; action?: string },
  ) => Promise<any>;
  Form: React.ComponentType<
    React.FormHTMLAttributes<HTMLFormElement> & {
      action?: string;
      method?: string;
    }
  >;
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
export function useSearchParams(): [
  Record<string, string>,
  (params: Record<string, string>) => void,
] {
  const router = useRouter();

  const setSearchParams = useCallback(
    (newParams: Record<string, string>) => {
      const search = new URLSearchParams(newParams).toString();
      const href = router.pathname + (search ? `?${search}` : '');
      routerStore.push(href);
    },
    [router.pathname],
  );

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
 * Hook for data fetching and submissions
 *
 * Usage 1: Auto-fetch (SWR style) - Returns data + mutate
 * const { data, mutate } = useFetcher('/api/users');
 *
 * Usage 2: Mutation only - Returns submit
 * const { submit } = useFetcher();
 */
export function useFetcher<TData = any>(
  key: string,
  options?: {
    revalidateOnFocus?: boolean;
    onSuccess?: (data: any, variables: any) => void;
    onError?: (error: any, variables: any) => void;
  },
): KeyedFetcher<TData>;
export function useFetcher<TData = any>(): MutationFetcher<TData>;
export function useFetcher<TData = any>(
  key?: string,
  options?: {
    revalidateOnFocus?: boolean;
    onSuccess?: (data: any, variables: any) => void;
    onError?: (error: any, variables: any) => void;
  },
): KeyedFetcher<TData> | MutationFetcher<TData> {
  const [state, setState] = useState<FetcherState>(key ? 'loading' : 'idle');
  const [data, setData] = useState<TData | undefined>(undefined);
  // Keep track of the AbortController to cancel pending requests
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // Derived state for better DX
  const isLoading = state === 'loading';
  const isSubmitting = state === 'submitting';

  const load = useCallback(
    async (href: string) => {
      // Cancel previous request if active
      if (abortController) abortController.abort();
      const controller = new AbortController();
      setAbortController(controller);

      setState('loading');
      try {
        const res = await fetch(href, { signal: controller.signal });
        if (res.headers.get('content-type')?.includes('application/json')) {
          const json = await res.json();
          setData(json);
        } else {
          setData((await res.text()) as any);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('[buncf] Fetcher load failed:', e);
        }
      } finally {
        // Only reset state if this is the active controller
        if (!controller.signal.aborted) {
          setState('idle');
          setAbortController(null);
        }
      }
    },
    [abortController],
  );

  // Auto-fetch if key is provided
  useEffect(() => {
    if (key) {
      load(key);
    }
  }, [key]);

  const submit = useCallback(
    async (
      target: string | Record<string, any> | FormData,
      submitOptions: { method?: string; action?: string } = {},
    ) => {
      // Cancel previous request
      if (abortController) abortController.abort();
      const controller = new AbortController();
      setAbortController(controller);

      setState('submitting');
      const method = submitOptions.method || 'POST';
      const action =
        submitOptions.action ||
        (typeof target === 'string' ? target : window.location.pathname);

      let body: any;
      let headers: Record<string, string> = {};
      let variables = target; // For callbacks

      if (target instanceof FormData) {
        body = target;
        // Convert FormData to object for variables if possible, purely for callback convenience
        const vars: Record<string, any> = {};
        target.forEach((value, key) => (vars[key] = value));
        variables = vars;
      } else if (typeof target === 'object') {
        body = JSON.stringify(target);
        headers['Content-Type'] = 'application/json';
      }

      try {
        const res = await fetch(action, {
          method,
          headers,
          body,
          signal: controller.signal,
        });

        let responseData: any = undefined;

        if (res.headers.get('content-type')?.includes('application/json')) {
          responseData = await res.json();

          // Bug fix: Only update main 'data' if we are NOT in keyed mode.
          // In keyed mode, 'data' belongs to the 'key' (GET), not the mutation result.
          if (!key) {
            setData(responseData);
          }
        }

        // Trigger Callbacks
        if (res.ok) {
          options?.onSuccess?.(responseData, variables);
        } else {
          options?.onError?.(
            responseData || new Error('Request failed'),
            variables,
          );
        }

        // Auto-Revalidation: Invalidate cache and trigger reload
        loaderClient.invalidateAll();

        // If we have a key (SWR mode), re-fetch it?
        if (key) {
          load(key);
        }

        return responseData;
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('[buncf] Fetcher submit failed:', e);
          options?.onError?.(e, variables);
        }
        throw e;
      } finally {
        if (!controller.signal.aborted) {
          setState('idle');
          setAbortController(null);
        }
      }
    },
    [abortController, key, load, options],
  );

  // Declarative Form Component
  const Form = useCallback(
    ({ children, action, method = 'POST', ...props }: any) => {
      return (
        <form
          {...props}
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            submit(formData, { action, method });
          }}
        >
          {children}
        </form>
      );
    },
    [submit],
  );

  // Return specific interface based on usage (runtime object is the same, types differ)
  return {
    state,
    data,
    submit,
    // only expose mutate/load if key exists (effectively)
    load,
    mutate: () => (key ? load(key) : undefined),
    Form: Form as any,
    isLoading,
    isSubmitting,
  } as any;
}

/**
 * Helper hook for form submissions
 */
export function useSubmit() {
  const fetcher = useFetcher();
  return fetcher.submit;
}
