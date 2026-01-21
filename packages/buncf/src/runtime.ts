
import type {
  BunRouteHandler,
  BunServeOptions,
  BunRequest,
  BunShimType,
  CloudflareEnv,
  BunHandlerFunction,
  ExecutionContext
} from './types';
import { runWithCloudflareContext, getCloudflareContext } from './context';

// --- BUN-CF-ADAPTER RUNTIME (Optimized & Typed) ---
// Provides O(1) matching, URL normalization, proxies, and asset handling.

// --- GLOBAL STATE ---

let __handler__: BunServeOptions | null = null;

// --- HELPER FUNCTIONS ---

// Normalize URL path
function normalizePath(path: string): string {
  if (path === "/" || path === "") return "/";
  if (path.endsWith("/")) return path.slice(0, -1);
  return path;
}

// Global Asset Helper (Optimized)
async function globalServeAsset(req: Request, assetPrefix: string = "assets"): Promise<Response | null> {
  const url = new URL(req.url);
  let assetPath = url.pathname;

  // Clean Path (Optimized: Avoid re-compiling Regex if possible, or simple slice)
  // If assetPrefix is usually "assets", we can check efficiently
  if (assetPrefix === "assets") {
    if (assetPath.startsWith("/assets/")) assetPath = assetPath.slice(7);
    else if (assetPath.startsWith("assets/")) assetPath = assetPath.slice(6);
  } else {
    // Generic fallback (dynamic prefix)
    const escaped = assetPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixSlash = "/" + assetPrefix + "/";
    if (assetPath.startsWith(prefixSlash)) assetPath = assetPath.slice(prefixSlash.length - 1); // keep leading slash
    else if (assetPath.startsWith(assetPrefix + "/")) assetPath = "/" + assetPath.slice(assetPrefix.length + 1);
  }

  if (!assetPath.startsWith("/")) assetPath = "/" + assetPath;

  // Security: Prevent Directory Traversal
  // Although Cloudflare ASSETS binding is sandboxed, we explicitly reject relative paths 
  // to avoid any ambiguity or potential leaks if the sandbox assumptions change.
  if (assetPath.includes("..")) {
    return new Response("Invalid Path Name", { status: 400 });
  }

  // Type-safe Binding Access - wrapped in try-catch for production safety
  let assetsBinding: any = null;
  try {
    const ctx = getCloudflareContext();
    assetsBinding = ctx?.env?.ASSETS;
  } catch (e) {
    // Context not available, return null to skip asset serving
    return null;
  }

  if (!assetsBinding) return null;

  const fetchAsset = async (path: string) => {
    const u = new URL(url.toString());
    u.pathname = path;
    // We must invoke the binding with a fresh request
    return assetsBinding.fetch(new Request(u.toString(), { method: 'GET', headers: req.headers }));
  };

  try {
    // 1. Exact Match (Best Case)
    let res = await fetchAsset(assetPath);

    // 2. Directory Index Fallback (if 404 and no extension)
    if (res.status === 404 && !assetPath.includes(".")) {
      const indexPath = assetPath.endsWith("/") ? assetPath + "index.html" : assetPath + "/index.html";
      const indexRes = await fetchAsset(indexPath);
      if (indexRes.status !== 404) res = indexRes;
    }

    // 3. SPA Fallback (if still 404, generic, and looks like a page route)
    // Only applies if we haven't found a file yet AND it's not a data request or framework route
    if (res.status === 404 && !assetPath.startsWith("/api") && !assetPath.startsWith("/_buncf/")) {
      const rootIndexRes = await fetchAsset("/index.html");
      if (rootIndexRes.status !== 404) res = rootIndexRes;
    }

    if (res.status === 404) return null;

    // Follow redirects
    let redirectCount = 0;
    while (res.status >= 300 && res.status < 400 && redirectCount < 5) {
      const location = res.headers.get('location');
      if (!location) break;
      const redirectUrl = new URL(location, url);
      res = await assetsBinding.fetch(new Request(redirectUrl.toString(), { method: 'GET' }));
      redirectCount++;
    }

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
            // Native Proxy trap for generic properties
            const value = Reflect.get(target, prop);
            if (typeof value === "function") return value.bind(target);
            return value;
          }
        }) as BunRequest;

        const res = await executeHandler(handler, proxiedReq, method);
        if (res) return res;
      }
    }

    // Default: try assets as a final fallback
    const assetResponse = await globalServeAsset(req, options.assetPrefix);
    if (assetResponse) return assetResponse;

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
  if (typeof (globalThis).Bun === "undefined") {
    (globalThis as any).Bun = __BunShim__;
  }
} catch (e) { }


// --- RUNTIME HANDLER (Internal use) ---
export const buncfRuntimeHandler = {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
    if (!__handler__) {
      return new Response("Error: Bun.serve not initialized", { status: 500 });
    }

    // Sync environment variables to Bun.env shim
    if (__BunShim__.env) {
      Object.assign(__BunShim__.env, env);
    }

    try {
      if (!__handler__.fetch) {
        return new Response("Error: Missing fetch handler", { status: 500 });
      }

      // Execute request with Cloudflare context
      return await runWithCloudflareContext({ env, ctx }, async () => {
        const res = await __handler__!.fetch!(request, { ...(__handler__ || {}) });

        // Asset Fallback
        if (res.status === 404 && request.method === "GET") {
          const assetResponse = await globalServeAsset(request, __handler__!.assetPrefix);
          if (assetResponse) return assetResponse;
        }
        return res;
      });
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));

      // Use custom error handler if provided
      if (__handler__.error) {
        try {
          return await __handler__.error(error);
        } catch (err) {
          console.error("[buncf] Error handler threw:", err);
          return new Response(error.message, { status: 500 });
        }
      }

      console.error("[buncf] Runtime error:", error);
      return new Response(error.message, { status: 500 });
    }
  },
};

export default buncfRuntimeHandler;
