// --- BUN-CF-ADAPTER RUNTIME ---

// Global handler storage
let __handler__: any = null;

// --- Minimal Router Logic for Bun 'routes' support ---
function createFetchFromRoutes(routes: Record<string, any>) {
  const routeMatchers = Object.entries(routes).map(([route, handler]) => {
    // Convert path pattern to regex (basic support for :param)
    // e.g. "/api/hello/:name" -> /^\/api\/hello\/([^/]+)$/
    const paramNames: string[] = [];
    const regexPath = route.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return "([^/]+)";
    });
    let displayValue = "";
    try {
      displayValue = typeof handler === 'object' ? JSON.stringify(handler) : String(handler);
    } catch {
      displayValue = String(handler);
    }
    const regex = new RegExp(`^${regexPath}$`);
    console.log(`[Buncf Router Init] Route: ${route}, Handler type: ${typeof handler}, Value: ${displayValue}`);
    return { regex, paramNames, handler };
  });

  // Helper to serve assets - Hoisted
  async function serveAsset(handler: string, req: Request) {
    let assetPath = handler;

    // Clean up the path: remove ./, /, and assets/ prefix to match Cloudflare deployment root which is set to .buncf/assets
    // Example: "./assets/index-123.html" -> "index-123.html"
    // Since assets directory is the root of ASSETS binding, we must strip the prefix.
    assetPath = assetPath.replace(/^(\.?\/)?assets\//, "");

    // Ensure it starts with /
    if (!assetPath.startsWith("/")) assetPath = "/" + assetPath;

    // Cloudflare Assets binding (ASSETS) is needed.
    // @ts-ignore
    const assetsBinding = globalThis.Bun?.env?.ASSETS || (typeof env !== 'undefined' ? (env && env.ASSETS) : null);

    if (assetsBinding) {
      const assetUrl = new URL(req.url);
      assetUrl.pathname = assetPath;
      console.log(`[Buncf Router] Fetching from ASSETS: ${assetPath} (Original Handler: ${handler})`);

      try {
        // Use assetUrl.toString() to avoid lint error with URL object
        let res = await assetsBinding.fetch(new Request(assetUrl.toString(), { method: 'GET' }));
        console.log(`[Buncf Router] ASSETS response status: ${res.status}`);

        // Follow redirects internally to prevent browser URL change
        // Cloudflare ASSETS binding may redirect to canonical path (hashed filename)
        let redirectCount = 0;
        while (res.status >= 300 && res.status < 400 && redirectCount < 5) {
          const location = res.headers.get('location');
          if (!location) break;

          console.log(`[Buncf Router] Following redirect to: ${location}`);
          const redirectUrl = new URL(location, assetUrl);
          res = await assetsBinding.fetch(new Request(redirectUrl.toString(), { method: 'GET' }));
          redirectCount++;
        }

        // Return response body with original headers but without redirect status
        // This ensures the browser stays at the original URL (e.g., "/")
        return new Response(res.body, {
          status: res.status >= 300 && res.status < 400 ? 200 : res.status,
          headers: res.headers,
        });
      } catch (e: any) {
        console.error(`[Buncf Router] ASSETS fetch error: ${e.message}`);
        return new Response(`Error fetching asset: ${e.message}`, { status: 500 });
      }
    } else {
      console.error("[Buncf Router] ASSETS binding not found!");
      return new Response(`[Bun Adapter] Asset not found (ASSETS binding missing): ${handler} -> ${assetPath}`, { status: 404 });
    }
  }

  return async (req: Request) => {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;

    console.log(`[Buncf Router] ${method} ${pathname}`);

    for (const { regex, paramNames, handler } of routeMatchers) {
      const match = pathname.match(regex);
      if (match) {
        console.log(`[Buncf Router] Matched route: ${regex.toString()}`);
        // Extract params
        const params: Record<string, string> = {};
        match.slice(1).forEach((val, index) => {
          params[paramNames[index] || "param" + index] = val;
        });

        // Attach params to request (Bun style)
        // @ts-ignore
        req.params = params;

        // Handler logic
        if (typeof handler === "function") {
          return handler(req);
        } else if (typeof handler === "object" && handler !== null) {
          if (handler[method]) {
            return handler[method](req);
          } else if (handler.default && typeof handler.default === "string") {
            // Asset module default export
            return serveAsset(handler.default, req);
          } else {
            console.log(`[Buncf Router] Object handler for ${pathname} didn't match method ${method} or have a default export.`);
          }
        } else if (typeof handler === "string") {
          return serveAsset(handler, req);
        }
      }
    }

    // Default 404
    return new Response("Not Found", { status: 404 });
  };
}


// Local Shim Variable - The source of truth for our rewritten imports
const __BunShim__ = {
  env: {},
  serve: (options: any) => {
    console.log("[Buncf] __BunShim__.serve called with options keys:", Object.keys(options));

    // Polyfill: If 'fetch' is missing but 'routes' exists, build a fetch handler
    if (!options.fetch && options.routes) {
      console.log("[Buncf] Polyfilling fetch from routes...");
      options.fetch = createFetchFromRoutes(options.routes);
    }

    __handler__ = options;
    return {
      port: 80,
      url: "http://localhost",
      stop: () => { },
    };
  },
};

// Try to expose it globally so 'Bun.xxx' usage (not imported) *might* work
try {
  // @ts-ignore
  if (typeof globalThis.Bun === "undefined") {
    // @ts-ignore
    globalThis.Bun = __BunShim__;
  }
} catch (e) {
  // Ignore
}

// Worker Export Handler
export default {
  async fetch(request: Request, env: any, ctx: any) {
    try {
      // @ts-ignore
      __BunShim__.env = { ...env };
      // @ts-ignore
      if (globalThis.Bun) globalThis.Bun.env = { ...env };
    } catch { }

    if (!__handler__ || !__handler__.fetch) {
      return new Response("Error: Bun.serve not initialized or missing fetch handler", {
        status: 500,
      });
    }

    try {
      const response = await __handler__.fetch(request, {
        ...(__handler__ || {}),
      });
      return response;
    } catch (err: any) {
      console.error("Worker Error:", err);
      return new Response(err.message || "Internal Server Error", { status: 500 });
    }
  },
};
