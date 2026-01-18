import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";

// --- Minimal React Hook Mock Engine ---
let hooks: any[] = [];
let hookIndex = 0;

const resetHooks = () => {
  hooks = [];
  hookIndex = 0;
};

const renderHook = <T>(callback: () => T): T => {
  hookIndex = 0;
  return callback();
};

const useState = mock((initial: any) => {
  const idx = hookIndex++;
  if (hooks[idx] === undefined) {
    hooks[idx] = initial;
  }
  const setState = (newVal: any) => {
    hooks[idx] = newVal;
  };
  return [hooks[idx], setState];
});

const useEffect = mock((fn: any) => {
  // Just run effect immediately for testing purposes
  // In real react it runs after render.
  fn();
});

const useCallback = mock((fn: any) => fn);

// --- Module Mocking ---

// Mock LoaderClient
mock.module("../src/router/loader-client", () => ({
  loaderClient: {
    invalidateAll: mock(() => { })
  }
}));

// Mock React
mock.module("react", () => ({
  useState,
  useEffect,
  useCallback,
  default: {
    createElement: mock(() => ({})),
  }
}));

// Import hook (must be after mocks)
import { useFetcher } from "../src/router/hooks";
import { loaderClient } from "../src/router/loader-client";
import { routerStore } from "../src/router/client"; // To mock

describe("useFetcher", () => {
  beforeEach(() => {
    resetHooks();
    global.fetch = mock(async () => new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    }));
    // Reset loaderClient mock
    (loaderClient.invalidateAll as any).mockClear();
  });

  test("initial state is idle", () => {
    const fetcher = renderHook(() => useFetcher());
    expect(fetcher.state).toBe("idle");
    expect(fetcher.data).toBeUndefined();
    expect(fetcher.isLoading).toBe(false);
  });

  test("submit calls fetch and updates state", async () => {
    let fetcher = renderHook(() => useFetcher());

    const promise = fetcher.submit("/api/save", { method: "POST" });

    // Re-render to see 'submitting' state (since useState updates hooks array)
    fetcher = renderHook(() => useFetcher());
    expect(fetcher.state).toBe("submitting");
    expect(fetcher.isSubmitting).toBe(true);

    await promise;

    // Re-render to see 'idle' and data
    fetcher = renderHook(() => useFetcher());
    expect(fetcher.state).toBe("idle");
    expect(fetcher.data).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("auto-validates cache on success", async () => {
    const fetcher = renderHook(() => useFetcher());
    await fetcher.submit("/api/save");

    expect(loaderClient.invalidateAll).toHaveBeenCalled();
  });
});
