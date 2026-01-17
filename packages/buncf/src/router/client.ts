/**
 * Client-side Router Store
 * Lightweight state management for SPA navigation
 */

export interface RouteState {
  pathname: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

type Listener = (state: RouteState) => void;

/**
 * Create a minimal router store (no dependencies)
 */
function createRouterStore() {
  // Initialize from injected data or window.location
  const initialData = typeof window !== "undefined"
    ? (window as any).__BUNCF_ROUTE__ || {}
    : {};

  let state: RouteState = {
    pathname: typeof window !== "undefined" ? window.location.pathname : "/",
    params: initialData.params || {},
    query: initialData.query || parseQueryString(),
  };

  const listeners = new Set<Listener>();

  function parseQueryString(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    params.forEach((value, key) => (result[key] = value));
    return result;
  }

  function getState() {
    return state;
  }

  function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function notify() {
    listeners.forEach((fn) => fn(state));
  }

  function push(path: string) {
    if (typeof window === "undefined") return;

    const url = new URL(path, window.location.origin);
    window.history.pushState({}, "", url.href);

    state = {
      pathname: url.pathname,
      params: {}, // Will be populated by route matching
      query: Object.fromEntries(url.searchParams),
    };

    notify();
  }

  function replace(path: string) {
    if (typeof window === "undefined") return;

    const url = new URL(path, window.location.origin);
    window.history.replaceState({}, "", url.href);

    state = {
      pathname: url.pathname,
      params: {},
      query: Object.fromEntries(url.searchParams),
    };

    notify();
  }

  function back() {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  }

  function forward() {
    if (typeof window !== "undefined") {
      window.history.forward();
    }
  }

  // Listen for browser back/forward
  if (typeof window !== "undefined") {
    window.addEventListener("popstate", () => {
      state = {
        pathname: window.location.pathname,
        params: {},
        query: parseQueryString(),
      };
      notify();
    });
  }

  return {
    getState,
    subscribe,
    push,
    replace,
    back,
    forward,
    setParams(params: Record<string, string>) {
      state = { ...state, params };
      notify();
    }
  };
}

// Singleton store instance
export const routerStore = createRouterStore();
