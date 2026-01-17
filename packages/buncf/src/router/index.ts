/**
 * Buncf Router - Main Entry Point
 * 
 * Provides file-system based routing for Bun + Cloudflare Workers
 */

import { createApiRouter, type ApiHandler, type HttpMethod } from "./api";
import { createPagesRouter, type PageMatch } from "./pages";
import * as fs from "fs";

// Server-side exports
export { createApiRouter } from "./api";
export { createPagesRouter } from "./pages";
export type { ApiHandler, HttpMethod } from "./api";
export type { PageMatch } from "./pages";

// Client-side exports have been moved to "./react.ts"
// and are exported via "buncf/router"


export interface CreateAppOptions {
  /** Directory for API routes (default: "./src/api") */
  apiDir?: string;
  /** Directory for page routes (default: "./src/pages") */
  pagesDir?: string;
  /** Static assets directory (default: "./src/public") */
  publicDir?: string;
  /** HTML file to serve for SPA routes (default: auto-detect index.html) */
  indexHtml?: string;
  /** Injected HTML content for SPA fallback (no file access needed) */
  indexHtmlContent?: string;
  /** Injected static route manifest for build-time router (Internal use) */
  staticRoutes?: { api?: any; pages?: any };
}

/**
 * Create a Buncf application with automatic routing
 */
export function createApp(options: CreateAppOptions = {}) {
  const {
    apiDir = "./src/api",
    pagesDir = "./src/pages",
    publicDir = "./src/public",
    indexHtml,
    staticRoutes,
    indexHtmlContent: injectedHtml,
  } = options;

  // Initialize routers
  // Use static routes if provided (Build mode), otherwise default to dir (Runtime/Dev)
  const apiRouter = createApiRouter({
    dir: apiDir,
    staticRoutes: staticRoutes?.api
  });
  const pagesRouter = createPagesRouter({
    dir: pagesDir,
    staticRoutes: staticRoutes?.pages
  });

  // Find index.html content
  let indexHtmlContent: string | null = injectedHtml || null;

  if (!indexHtmlContent) {
    // Runtime/Dev fallback: try reading file
    let htmlPath = indexHtml;
    if (!htmlPath) {
      const candidates = ["./src/index.html", "./index.html", "./public/index.html"];
      htmlPath = candidates.find((p) => fs.existsSync(p));
    }
    if (htmlPath && fs.existsSync(htmlPath)) {
      indexHtmlContent = fs.readFileSync(htmlPath, "utf-8");
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const port = (globalThis as any).Bun?.peek?.()?.port || 3000;
    console.log(`\n  \x1b[36m🚀 Buncf Development Server\x1b[0m`);
    console.log(`  \x1b[32m✔\x1b[0m Local:    \x1b[34mhttp://localhost:${port}\x1b[0m`);
    console.log(`  \x1b[32m✔\x1b[0m Ready in: \x1b[33msrc/api/\x1b[0m and \x1b[33msrc/pages/\x1b[0m\n`);
  }

  /**
   * Main fetch handler
   */
  async function fetch(req: Request): Promise<Response> {
    if (process.env.NODE_ENV !== "production") {
      const url = new URL(req.url);
      const method = req.method;
      const path = url.pathname;
      const start = performance.now();

      const response = await handleRequest(req, url);

      const duration = (performance.now() - start).toFixed(2);
      const status = response.status;
      const statusColor = status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : status >= 300 ? "\x1b[36m" : "\x1b[32m";

      console.log(`  \x1b[90m${new Date().toLocaleTimeString()}\x1b[0m ${method} ${path} - ${statusColor}${status}\x1b[0m \x1b[90m(${duration}ms)\x1b[0m`);
      return response;
    }

    return handleRequest(req, new URL(req.url));
  }

  async function handleRequest(req: Request, url: URL): Promise<Response> {

    // 1. Try API routes first
    if (apiRouter && url.pathname.startsWith("/api")) {
      const apiResponse = await apiRouter.handle(req);
      if (apiResponse) return apiResponse;
    }

    // 2. Try page routes
    if (pagesRouter) {
      const pageMatch = pagesRouter.match(req);
      if (pageMatch) {
        // For SPA: return index.html with injected route data
        if (indexHtmlContent) {
          // Inject route data for client hydration
          const routeData = JSON.stringify({
            pathname: pageMatch.pathname,
            params: pageMatch.params,
            query: pageMatch.query,
            pattern: pageMatch.filePath,
          });

          // Get all routes for client-side matching (Manifest)
          const allRoutes = pagesRouter.getRoutes();
          const manifestData = JSON.stringify(allRoutes);

          const script = `
            <script>
              window.__BUNCF_ROUTE__ = ${routeData};
              window.__BUNCF_MANIFEST__ = ${manifestData};
            </script>
          `;

          const htmlFinal = indexHtmlContent.replace("</head>", `${script}</head>`);

          return new Response(htmlFinal, {
            headers: { "Content-Type": "text/html" },
          });
        }
      }
    }

    // 3. Try serving static files from src (for dev mode)
    if (url.pathname.includes(".")) {
      // Check common source directories
      const possiblePaths = [
        `./src${url.pathname}`,
        `.${url.pathname}`,
        `./src/public${url.pathname}`,
        `./public${url.pathname}`,
      ];

      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          // 3a. Handle TSX/TS/JSX (Transpile only, NO Tailwind plugin here to avoid Node.js builtins error)
          if (filePath.match(/\.(tsx|ts|jsx)$/)) {
            try {
              const result = await Bun.build({
                entrypoints: [filePath],
                format: "esm",
                target: "browser",
                external: ["*.css"], // Keep CSS imports as requests so we can process them separately
              });

              if (result.success && result.outputs[0]) {
                const code = await result.outputs[0].text();
                return new Response(code, {
                  headers: { "Content-Type": "application/javascript" },
                });
              }
            } catch (e) {
              console.error(`[buncf] Failed to transpile ${filePath}:`, e);
            }
          }

          // 3b. Handle CSS (Tailwind processing)
          if (filePath.endsWith(".css")) {
            try {
              let plugins = [];
              try {
                // @ts-ignore
                const { default: tailwind } = await import("bun-plugin-tailwind");
                plugins.push(tailwind);
              } catch (e) { /* no plugin */ }

              const result = await Bun.build({
                entrypoints: [filePath],
                // Use 'node' target for CSS build to allow plugin to use Node APIs (fs, path) during transformation
                // The output is just CSS text, so it's safe for browser.
                target: "node",
                plugins,
              });

              if (result.success && result.outputs[0]) {
                const text = await result.outputs[0].text();
                return new Response(text, {
                  headers: { "Content-Type": "text/css" },
                });
              }
            } catch (e) {
              console.error(`[buncf] Failed to bundle CSS ${filePath}:`, e);
            }
          }

          // 3c. Serve other files directly or fallback if build failed
          const file = Bun.file(filePath);
          const contentType = getContentType(filePath);
          return new Response(file, {
            headers: { "Content-Type": contentType },
          });
        }
      }
    }

    // 4. Fallback: serve index.html for SPA catch-all (hydrated)
    // Try page routes (for initial hydration data) - catch-all
    let pageMatch = null;
    if (pagesRouter) {
      pageMatch = pagesRouter.match(req);
    }

    if (indexHtmlContent && !url.pathname.includes(".")) {
      // 1. Get all routes for client-side matching (Manifest)
      const allRoutes = pagesRouter ? pagesRouter.getRoutes() : [];

      // 2. Prepare route data for hydration
      const routeData = JSON.stringify({
        pathname: pageMatch ? pageMatch.pathname : url.pathname,
        params: pageMatch ? pageMatch.params : {},
        query: pageMatch ? pageMatch.query : Object.fromEntries(url.searchParams),
        pattern: pageMatch ? pageMatch.filePath : null,
      });

      const manifestData = JSON.stringify(allRoutes);

      const script = `
         <script>
           window.__BUNCF_ROUTE__ = ${routeData};
           window.__BUNCF_MANIFEST__ = ${manifestData};
         </script>
       `;

      const htmlWithRoute = indexHtmlContent.replace("</head>", `${script}</head>`);

      return new Response(htmlWithRoute, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // 5. Not found (if no index.html)
    return new Response("Not Found", { status: 404 });
  }

  return {
    fetch,
    routes: {}, // Empty - we handle everything in fetch
    development: process.env.NODE_ENV !== "production",
  };
}

/**
 * Get content type from file extension
 */
function getContentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    jsx: "application/javascript",
    ts: "application/javascript",
    tsx: "application/javascript",
    json: "application/json",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
  };
  return types[ext || ""] || "application/octet-stream";
}
