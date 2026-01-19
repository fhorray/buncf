import { getCloudflareContext } from "./context";
import { type CloudflareEnv, type CloudflareContext } from "./types";

/**
 * Proxy factory for Cloudflare bindings.
 */
function createBindingProxy<T>(type: string) {
  return new Proxy({}, {
    get(_, prop: string) {
      if (typeof prop !== "string") return undefined;
      const { env } = getCloudflareContext();
      const binding = env[prop];
      if (!binding) {
        throw new Error(`[buncf] ${type} binding "${prop}" not found in wrangler.json`);
      }
      return binding as T;
    }
  });
}

/**
 * Direct access to the current request context.
 */
const context = new Proxy({}, {
  get(_, prop: keyof CloudflareContext) {
    if (typeof prop !== "string") return undefined;
    return getCloudflareContext()[prop];
  }
}) as CloudflareContext;

/**
 * Direct access to environment variables and bindings.
 */
export const env = new Proxy({}, {
  get(_, prop: string) {
    if (typeof prop !== "string") return undefined;
    return getCloudflareContext().env[prop];
  }
}) as CloudflareEnv;

// Helper to filter keys of T based on value type V
type FilterByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

// Structural hints for Cloudflare bindings to provide better autocomplete
// without requiring @cloudflare/workers-types in the framework package itself.
type D1Like = { prepare: Function };
type KVLike = { get: Function; put: Function };
type R2Like = { get: Function; put: Function; delete: Function };

export const d1 = createBindingProxy<any>("D1") as FilterByValue<CloudflareEnv, D1Like>;
export const kv = createBindingProxy<any>("KV") as FilterByValue<CloudflareEnv, KVLike>;
export const r2 = createBindingProxy<any>("R2") as FilterByValue<CloudflareEnv, R2Like>;

