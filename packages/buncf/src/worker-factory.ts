import { runWithCloudflareContext } from "./context";
import { initAsyncLocalStorage } from "./async-storage";
import { type CloudflareEnv, type CloudflareContext, type BunShimType } from "./types";

/**
 * Factory to create a Cloudflare Worker fetch handler with buncf context and middleware support.
 */
export function createWorkerHandler(handler: any, options: {
  middleware?: any[],
  bunShim?: BunShimType
} = {}) {
  const { middleware = [], bunShim } = options;

  // Pre-process middleware stack
  const middlewareCache = middleware.map(m => ({
    handler: m.handler,
    patterns: m.matcher
      ? (Array.isArray(m.matcher) ? m.matcher : [m.matcher]).map((p: string) => {
        try { return new URLPattern({ pathname: p }); } catch (e) { return null; }
      }).filter(Boolean)
      : null
  }));

  async function finalHandler(request: Request, env: CloudflareEnv, ctx: any) {
    if (handler && typeof handler.fetch === 'function') {
      return handler.fetch(request, env, ctx);
    }
    return new Response("Entrypoint error: No fetch handler found.", { status: 500 });
  }

  return {
    async fetch(request: Request, env: CloudflareEnv, ctx: any) {
      // 0. Init Context Storage
      await initAsyncLocalStorage();

      // 1. Sync Environment
      if (typeof process === "undefined") (globalThis as any).process = { env: {} };
      if (!process.env) process.env = {};

      const stringEnv: Record<string, string> = {};
      for (const key in env) {
        if (typeof env[key] === 'string') {
          stringEnv[key] = env[key] as string;
          process.env[key] = env[key] as string;
        }
      }

      if (bunShim) {
        bunShim.env = stringEnv;
        if (env.ASSETS) (bunShim as any).ASSETS = env.ASSETS;
      }

      // Context Wrapper logic
      const cfContext: CloudflareContext = { env, ctx, cf: (request as any).cf || {} };

      const execute = async () => {
        if (middlewareCache.length > 0) {
          let index = -1;
          const dispatch = async (i: number): Promise<Response> => {
            if (i <= index) throw new Error("next() called multiple times");
            index = i;

            const item = middlewareCache[i];
            if (!item) return finalHandler(request, env, ctx);

            let matched = true;
            if (item.patterns) {
              const urlObj = new URL(request.url);
              matched = item.patterns.some((p: any) => p.test({ pathname: urlObj.pathname }));
            }

            if (!matched) return dispatch(i + 1);

            return item.handler(request, () => dispatch(i + 1));
          };
          return dispatch(0);
        }
        return finalHandler(request, env, ctx);
      };

      // 2. Run within Cloudflare Context
      return runWithCloudflareContext(cfContext, execute);
    }
  };
}
