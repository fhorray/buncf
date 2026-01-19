/**
 * Isolated AsyncLocalStorage initialization for Cloudflare Workers.
 */

let instance: any = null;
let initPromise: Promise<any> | null = null;

export async function initAsyncLocalStorage() {
  if (instance) return instance;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const { AsyncLocalStorage } = await import("node:async_hooks");
        instance = new AsyncLocalStorage();
        return instance;
      } catch (e) {
        // Fallback for environments where node:async_hooks is truly unavailable
        return null;
      }
    })();
  }

  return initPromise;
}

export function getAsyncLocalStorage() {
  // Note: This returns null if not initialized yet. 
  // We should initialize it at the very start of the worker.
  return instance;
}
