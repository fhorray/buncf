/**
 * Router Hooks for React
 * 
 * Usage:
 * ```tsx
 * import { useRouter, useParams, useSearchParams, usePathname } from "buncf/router";
 * 
 * function MyComponent() {
 *   const router = useRouter();
 *   const params = useParams();
 *   const [query] = useSearchParams();
 *   const pathname = usePathname();
 * }
 * ```
 */

import { useState, useEffect, useSyncExternalStore } from "react";
import { routerStore, type RouteState } from "./client";

/**
 * Main router hook
 * Returns navigation methods and current route state
 */
export function useRouter() {
  const state = useSyncExternalStore(
    routerStore.subscribe,
    routerStore.getState,
    routerStore.getState // SSR fallback
  );

  return {
    pathname: state.pathname,
    params: state.params,
    query: state.query,
    push: routerStore.push,
    replace: routerStore.replace,
    back: routerStore.back,
    forward: routerStore.forward,
  };
}

/**
 * Get current route params
 * For dynamic routes like /blog/[slug], returns { slug: "..." }
 */
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const state = useSyncExternalStore(
    routerStore.subscribe,
    routerStore.getState,
    routerStore.getState
  );
  return state.params as T;
}

/**
 * Get current search params (query string)
 * Returns [params, setParams] similar to useState
 */
export function useSearchParams(): [Record<string, string>, (params: Record<string, string>) => void] {
  const state = useSyncExternalStore(
    routerStore.subscribe,
    routerStore.getState,
    routerStore.getState
  );

  const setSearchParams = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    const newPath = `${state.pathname}?${searchParams.toString()}`;
    routerStore.replace(newPath);
  };

  return [state.query, setSearchParams];
}

/**
 * Get current pathname
 */
export function usePathname(): string {
  const state = useSyncExternalStore(
    routerStore.subscribe,
    routerStore.getState,
    routerStore.getState
  );
  return state.pathname;
}
