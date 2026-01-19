import { type CloudflareContext } from "./types";

const isServer = typeof window === "undefined" || (typeof process !== "undefined" && process.versions && !!process.versions.node) || (globalThis as any).navigator?.userAgent?.includes("Cloudflare-Workers");

let AsyncLocalStorageClass: any;
try {
  if (isServer) {
    // ESM Support for Cloudflare Workers
    const { AsyncLocalStorage } = await import("node:async_hooks");
    AsyncLocalStorageClass = AsyncLocalStorage;
  }
} catch (e) {
  // Fallback if node:async_hooks is definitely not available
}

// Global AsyncLocalStorage instance shared across bundles
// We use a global symbol to ensure all bundles share the same storage instance
const storageSymbol = Symbol.for("buncf.context");

const globalStore = (globalThis as any)[storageSymbol] || (AsyncLocalStorageClass ? new AsyncLocalStorageClass() : null);

if (!(globalThis as any)[storageSymbol] && globalStore) {
  (globalThis as any)[storageSymbol] = globalStore;
}

export const asyncLocalStorage = globalStore;

/**
 * Get the current Cloudflare request context (env, ctx, cf).
 * 
 * The `env` property is automatically typed based on your module augmentation.
 * 
 * @example
 * ```typescript
 * // After augmenting BuncfTypeRegistry in your cloudflare-env.d.ts:
 * const { env } = getCloudflareContext();
 * await env.MY_KV.put("key", "value"); // ✓ Full autocomplete!
 * ```
 */
export function getCloudflareContext(): CloudflareContext {
  const store = asyncLocalStorage?.getStore?.();
  if (!store) {
    // Fallback for when context is lost or outside request
    if (process.env.NODE_ENV === "development") {
      // @ts-ignore
      if (globalThis.__DEV_CONTEXT__) return globalThis.__DEV_CONTEXT__;
    }

    // Return empty context to avoid crash
    return {
      env: {} as any,
      ctx: {
        waitUntil: () => { },
        passThroughOnException: () => { },
      },
      cf: {},
    } as CloudflareContext;
  }
  if ((globalThis as any).process?.env?.DEBUG_BUNCF) {
    console.log(`[buncf:context] getStore() -> ${store ? "OK (" + Object.keys(store.env).join(",") + ")" : "MISSING"}`);
  }

  return store;
}

export function runWithCloudflareContext<T>(context: CloudflareContext, fn: () => T): T {
  if ((globalThis as any).process?.env?.DEBUG_BUNCF) {
    console.log(`[buncf:context] run() starting with env keys: ${Object.keys(context.env as object).join(",")}`);
  }
  return asyncLocalStorage.run(context, fn);
}
