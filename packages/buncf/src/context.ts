import { type CloudflareContext } from "./types";
import { getAsyncLocalStorage } from "./async-storage";

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
  const store = getAsyncLocalStorage()?.getStore?.();
  if (!store) {
    // Fallback for when context is lost or outside request
    if (process.env.NODE_ENV === "production") {
      throw new Error("[buncf] CloudflareContext not initialized. Ensure your handler runs within runWithCloudflareContext().");
    }

    if (process.env.NODE_ENV === "development") {
      // @ts-ignore
      if (globalThis.__DEV_CONTEXT__) return globalThis.__DEV_CONTEXT__;
    }

    // Return empty context to avoid crash in non-prod environments if possible
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
  const storage = getAsyncLocalStorage();
  if (!storage) {
    if ((globalThis as any).process?.env?.DEBUG_BUNCF) {
      console.warn("[buncf:context] AsyncLocalStorage not available, running function without context isolation.");
    }
    return fn();
  }

  if ((globalThis as any).process?.env?.DEBUG_BUNCF) {
    console.log(`[buncf:context] run() starting with env keys: ${Object.keys(context.env).join(",")}`);
  }
  return storage.run(context, fn);
}
