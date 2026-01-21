import { type CloudflareContext } from "./types";
import { getAsyncLocalStorage } from "./async-storage";

// Global context fallback for environments where AsyncLocalStorage doesn't work
// This is safe in Cloudflare Workers since each request handler runs in isolation
let globalContextFallback: CloudflareContext | null = null;

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
  // Try AsyncLocalStorage first
  const store = getAsyncLocalStorage()?.getStore?.();
  if (store) {
    if ((globalThis as any).process?.env?.DEBUG_BUNCF) {
      console.log(`[buncf:context] getStore() -> OK (${Object.keys(store.env).join(",")})`);
    }
    return store;
  }

  // Fallback to global context (safe in Workers - single request per isolate)
  if (globalContextFallback) {
    return globalContextFallback;
  }

  // Fallback to global __BUNCF_ENV__ set by worker-factory (for production Workers)
  const globalEnv = (globalThis as any).__BUNCF_ENV__;
  const globalCtx = (globalThis as any).__BUNCF_CTX__;
  if (globalEnv) {
    return {
      env: globalEnv,
      ctx: globalCtx || { waitUntil: () => { }, passThroughOnException: () => { } },
      cf: {},
    } as CloudflareContext;
  }

  // Development fallback
  if (process.env.NODE_ENV === "development") {
    // @ts-ignore
    if (globalThis.__DEV_CONTEXT__) return globalThis.__DEV_CONTEXT__;
  }

  // Production error
  if (process.env.NODE_ENV === "production") {
    throw new Error("[buncf] CloudflareContext not initialized. Ensure your handler runs within runWithCloudflareContext().");
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

export function runWithCloudflareContext<T>(context: CloudflareContext, fn: () => T): T {
  const storage = getAsyncLocalStorage();

  // Set global fallback for environments where AsyncLocalStorage doesn't work
  const previousContext = globalContextFallback;
  globalContextFallback = context;

  try {
    if (storage) {
      if ((globalThis as any).process?.env?.DEBUG_BUNCF) {
        console.log(`[buncf:context] run() starting with env keys: ${Object.keys(context.env).join(",")}`);
      }
      return storage.run(context, fn);
    } else {
      if ((globalThis as any).process?.env?.DEBUG_BUNCF) {
        console.warn("[buncf:context] AsyncLocalStorage not available, using global fallback.");
      }
      return fn();
    }
  } finally {
    globalContextFallback = previousContext;
  }
}

