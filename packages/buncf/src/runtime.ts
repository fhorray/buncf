
import type {
  BunRouteHandler,
  BunServeOptions,
  BunRequest,
  BunShimType,
  CloudflareEnv,
  BunHandlerFunction
} from './types';

// --- BUN-CF-ADAPTER RUNTIME (Optimized & Typed) ---
// Provides O(1) matching, URL normalization, proxies, and asset handling.

// --- GLOBAL STATE ---

let __handler__: BunServeOptions | null = null;

// --- HELPER FUNCTIONS ---

// Normalize URL path causing 301 behavior if needed or just cleaning
function normalizePath(path: string): string {
  if (path === "/" || path === "") return "/";
  if (path.endsWith("/")) return path.slice(0, -1);
  return path;
}

// Global Asset Helper
async function globalServeAsset(req: Request, assetPrefix: string = "assets"): Promise<Response | null> {
  const url = new URL(req.url);
  let assetPath = url.pathname;

  // Asset Prefix Logic
  // If user configured "public", we strip it.
  // Generally in Cloudflare Assets, the URL matches the file structure directly.
  // But if the router logic had prefixes, we might need to handle it.
  // For fallback, usually we take the pathname as is.

  // Clean slightly just in case
  const escapedPrefix = assetPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const prefixRegex = new RegExp(`^(\\.?\\/)?${escapedPrefix}\\/`);
  assetPath = assetPath.replace(prefixRegex, "");

  if (!assetPath.startsWith("/")) assetPath = "/" + assetPath;

  // @ts-ignore
  const assetsBinding = globalThis.Bun?.env?.ASSETS || (__BunShim__ as any)?.ASSETS || (typeof env !== 'undefined' ? (env && env.ASSETS) : null);

  if (assetsBinding) {
    const assetUrl = new URL(req.url);
    assetUrl.pathname = assetPath;

    // console.log(`[Buncf Fallback] Attempting ASSETS: ${assetPath}`);

    // Helper to fetch
    const fetchAsset = async (path: string) => {
      const u = new URL(req.url);
      u.pathname = path;
      return assetsBinding.fetch(new Request(u.toString(), { method: 'GET' }));
    };

    try {
      let res = await fetchAsset(assetPath);

      // Auto-resolve directory index if 404
      if (res.status === 404) {
        if (assetPath.endsWith("/")) {
          // Try adding index.html
          const indexPath = assetPath + "index.html";
          const indexRes = await fetchAsset(indexPath);
          if (indexRes.status !== 404) res = indexRes;
        } else if (!assetPath.includes(".")) {
          // Probably a route like /about, try /about/index.html or /index.html (SPA Fallback)
          // For now, let's try /index.html as a general SPA fallback if configured?
          // Or just append /index.html
          const indexPath = assetPath + "/index.html";
          const indexRes = await fetchAsset(indexPath);
          if (indexRes.status !== 404) {
            res = indexRes;
          } else {
            // SPA Fallback: Try root index.html logic if the path seems to be a page route
            const rootIndexRes = await fetchAsset("/index.html");
            if (rootIndexRes.status !== 404) res = rootIndexRes;
          }
        }
      }

      if (res.status === 404) return null;

      // Follow redirects
      let redirectCount = 0;
      while (res.status >= 300 && res.status < 400 && redirectCount < 5) {
        const location = res.headers.get('location');
        if (!location) break;
        const redirectUrl = new URL(location, assetUrl);
        res = await assetsBinding.fetch(new Request(redirectUrl.toString(), { method: 'GET' }));
        redirectCount++;
      }

      // If final result is 404, return null to let original 404 stand (or continue fallback)
      if (res.status === 404) return null;

      return new Response(res.body, {
        status: res.status >= 300 && res.status < 400 ? 200 : res.status,
        headers: res.headers,
      });
    } catch (e: any) {
      console.error(`[Buncf Fallback] ASSETS error: ${e.message}`);
      return null;
    }
  }
  return null;
}

// --- ROUTER LOGIC ---

function createFetchFromRoutes(
  routes: Record<string, BunRouteHandler>,
  options: { assetPrefix?: string } = {}
) {
  // Separate Static vs Dynamic for Performance
  const staticRoutes = new Map<string, BunRouteHandler>();
  const dynamicRoutes: Array<{ regex: RegExp, paramNames: string[], handler: BunRouteHandler }> = [];

  // Setup Phase
  Object.entries(routes).forEach(([rawRoute, handler]) => {
    const route = normalizePath(rawRoute);
    if (route.includes(':') || route.includes('*')) {
      const paramNames: string[] = [];
      const regexPath = route.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
        paramNames.push(paramName);
        return "([^/]+)";
      });
      const regex = new RegExp(`^${regexPath}\\/?$`);
      dynamicRoutes.push({ regex, paramNames, handler });
    } else {
      staticRoutes.set(route, handler);
    }
  });

  // Helper to serve assets using the route handler string
  async function serveAssetFromHandler(handler: string, req: Request) {
    const targetPath = handler;
    // We can just create a dummy request with that path?
    const newUrl = new URL(req.url);

    // Heuristic: if handler is absolute path or relative, clean it
    let cleanPath = targetPath.replace(/^(\.?\/)?assets\//, ""); // Basic cleanup
    if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;

    newUrl.pathname = cleanPath;

    const res = await globalServeAsset(new Request(newUrl, req), options.assetPrefix);
    if (res) return res;

    return new Response(`[Buncf] Asset not found: ${handler}`, { status: 404 });
  }

  function executeHandler(handler: BunRouteHandler, req: BunRequest, method: string) {
    if (typeof handler === "function") {
      return handler(req);
    } else if (typeof handler === "object" && handler !== null) {
      if (handler[method]) {
        return (handler[method] as BunHandlerFunction)(req);
      } else if (handler.default && typeof handler.default === "string") {
        return serveAssetFromHandler(handler.default, req);
      }
    } else if (typeof handler === "string") {
      return serveAssetFromHandler(handler, req);
    }
    return null;
  }

  // --- RUNTIME FETCH HANDLER ---
  return async (req: Request) => {
    const url = new URL(req.url);
    const pathname = normalizePath(url.pathname);
    const method = req.method;

    // A. Static Check
    if (staticRoutes.has(pathname)) {
      const handler = staticRoutes.get(pathname)!;
      const res = await executeHandler(handler, req as BunRequest, method);
      if (res) return res;
    }

    // B. Dynamic Check
    for (const { regex, paramNames, handler } of dynamicRoutes) {
      const match = pathname.match(regex);
      if (match) {
        const params: Record<string, string> = {};
        match.slice(1).forEach((val, index) => {
          params[paramNames[index] || "param" + index] = val;
        });

        const proxiedReq = new Proxy(req, {
          get(target, prop) {
            if (prop === "params") return params;
            // @ts-ignore
            const value = target[prop];
            if (typeof value === "function") return value.bind(target);
            return value;
          }
        }) as BunRequest;

        const res = await executeHandler(handler, proxiedReq, method);
        if (res) return res;
      }
    }

    // Default 404
    return new Response("Not Found", { status: 404 });
  };
}


// --- BUN SHIM IMPLEMENTATION ---

export const __BunShim__: BunShimType = {
  env: {},
  serve: (options: BunServeOptions) => {
    // Inject Router if fetch is missing but routes exist
    if (!options.fetch && options.routes) {
      options.fetch = createFetchFromRoutes(options.routes, {
        assetPrefix: options.assetPrefix
      });
    }

    __handler__ = options;
    return {
      port: 80,
      url: "http://localhost",
      stop: () => { },
    };
  },
};

// Global Injection
try {
  // @ts-ignore
  if (typeof globalThis.Bun === "undefined") {
    // @ts-ignore
    globalThis.Bun = __BunShim__;
  }
} catch (e) { }


// --- WORKER EXPORT (ENTRY POINT) ---

export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: any) {
    // Sync Env
    try {
      const stringEnv: Record<string, string> = {};
      for (const key in env) {
        if (typeof env[key] === 'string') stringEnv[key] = env[key];
      }
      __BunShim__.env = { ...stringEnv };
      if (env.ASSETS) (__BunShim__ as any).ASSETS = env.ASSETS;

      if (typeof globalThis.Bun !== "undefined") {
        (globalThis.Bun as any).env = { ...stringEnv };
        if (env.ASSETS) (globalThis.Bun as any).ASSETS = env.ASSETS;
      }
    } catch { }

    if (!__handler__ || !__handler__.fetch) {
      return new Response("Error: Bun.serve not initialized or missing fetch handler", { status: 500 });
    }

    try {
      // Execute User Logic
      const response = await __handler__.fetch(request, {
        ...(__handler__ || {}),
      });

      // --- ASSET FALLBACK FOR USER HANDLERS ---
      // If user returns 404 on GET, try to find matching asset in Cloudflare
      // If user returns 404 on GET, try to find matching asset in Cloudflare
      if (response.status === 404 && request.method === "GET") {
        const assetResponse = await globalServeAsset(request, __handler__.assetPrefix);
        if (assetResponse) {
          return assetResponse;
        }
      }

      return response;

    } catch (err: any) {
      console.error("[Buncf] Worker Error:", err);

      if (__handler__ && typeof __handler__.error === "function") {
        try {
          const maybePromise = __handler__.error(err);
          const customResponse = maybePromise instanceof Promise ? await maybePromise : maybePromise;
          return customResponse;
        } catch (secondaryError) {
          console.error("[Buncf] Custom error handler failed:", secondaryError);
        }
      }

      return new Response(err.message || "Internal Server Error", { status: 500 });
    }
  },
};
