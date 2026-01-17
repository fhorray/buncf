/**
 * API Route Handler
 * Scans src/api/ directory and creates route handlers
 * 
 * Convention:
 * - src/api/hello.ts → /api/hello
 * - src/api/users/[id].ts → /api/users/:id
 * 
 * Each file can export: GET, POST, PUT, PATCH, DELETE, default
 */

import * as fs from "fs";
import * as path from "path";
import { createRouteMatcher } from "./matcher";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface ApiHandler {
  (req: Request): Response | Promise<Response>;
}

export interface ApiModule {
  GET?: ApiHandler;
  POST?: ApiHandler;
  PUT?: ApiHandler;
  PATCH?: ApiHandler;
  DELETE?: ApiHandler;
  HEAD?: ApiHandler;
  OPTIONS?: ApiHandler;
  default?: ApiHandler;
}

export interface ApiRoute {
  pattern: string;
  filePath: string;
  params: string[];
}

/**
 * Load API routes from a directory using Bun.FileSystemRouter or Static Map
 */
export function createApiRouter(options: {
  dir: string;
  prefix?: string;
  staticRoutes?: Record<string, () => Promise<ApiModule>>
}) {
  const { dir, prefix = "/api", staticRoutes } = options;
  const absoluteDir = path.resolve(dir);

  let matcher: ReturnType<typeof createRouteMatcher> | null = null;

  // Strategy 1: Static Routes (Bundled)
  if (staticRoutes && Object.keys(staticRoutes).length > 0) {
    const routeDefs = Object.entries(staticRoutes).map(([routePath, importer]) => ({
      pattern: routePath,
      data: { filePath: routePath, importer }
    }));
    matcher = createRouteMatcher(routeDefs);
  }

  let internalMatch: (p: string) => { params: Record<string, string>, data: { filePath: string, importer?: () => Promise<ApiModule> } } | null;

  if (matcher) {
    internalMatch = (p) => {
      const m = matcher!.match(p);
      if (!m) return null;
      return {
        params: m.params,
        data: m.data as { filePath: string, importer?: () => Promise<ApiModule> }
      };
    };
  } else {
    // Strategy 2: Runtime FileSystemRouter (Dev/Node)
    if (!fs.existsSync(absoluteDir)) {
      internalMatch = () => null;
    } else {
      const router = new Bun.FileSystemRouter({
        style: "nextjs",
        dir: absoluteDir,
        fileExtensions: [".ts", ".js", ".tsx", ".jsx"],
      });
      internalMatch = (p) => {
        const m = router.match(p);
        if (m) {
          return {
            params: m.params,
            data: { filePath: m.filePath }
          };
        }
        return null;
      };
    }
  }

  /**
   * Handle an incoming request against API routes
   */
  async function handleApiRequest(req: Request): Promise<Response | null> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    let matchResult;

    // For static routes, we likely keyed them with the prefix included or not?
    // Let's assume keys are like "/hello" (relative to api folder).
    if (!pathname.startsWith(prefix)) return null;
    const apiPath = pathname.slice(prefix.length) || "/";

    matchResult = internalMatch(apiPath);

    if (!matchResult) {
      return null;
    }

    try {
      // Dynamically import the matched file
      let module: ApiModule;
      if (matchResult.data.importer) {
        module = await matchResult.data.importer();
      } else {
        module = await import(matchResult.data.filePath);
      }

      // Get handler for HTTP method
      const method = req.method.toUpperCase() as HttpMethod;
      const handler = module[method] || module.default;

      if (!handler) {
        return new Response(`Method ${method} not allowed`, { status: 405 });
      }

      // Attach params to request (extend Request)
      const enrichedReq = new Proxy(req, {
        get(target, prop) {
          if (prop === "params") return matchResult?.params || {};
          if (prop === "query") return Object.fromEntries(new URL(req.url).searchParams);
          // @ts-ignore
          const value = target[prop];
          if (typeof value === "function") return value.bind(target);
          return value;
        }
      });

      return await handler(enrichedReq);
    } catch (error: any) {
      console.error(`[buncf] API Error in ${matchResult.data.filePath}:`, error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Get routes in a format compatible with Bun.serve({ routes })
   */
  function getBunRoutes(): Record<string, BunRouteHandler> {
    const bunRoutes: Record<string, BunRouteHandler> = {};

    // Helper to wrap module execution
    const createHandler = (filePath: string, importer?: () => Promise<ApiModule>): BunRouteHandler => {
      return async (req) => {
        try {
          let module: ApiModule;
          if (importer) {
            module = await importer();
          } else {
            module = await import(filePath);
          }

          const method = req.method.toUpperCase() as HttpMethod;
          const handler = module[method] || module.default;

          if (!handler) {
            return new Response(`Method ${method} not allowed`, { status: 405 });
          }
          return handler(req);
        } catch (e: any) {
          console.error(`[buncf] Error in ${filePath}:`, e);
          return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
      };
    };

    if (staticRoutes && Object.keys(staticRoutes).length > 0) {
      Object.entries(staticRoutes).forEach(([routePath, importer]) => {
        // Convert /api/users/[id] -> /api/users/:id
        // Convert /api/[...catchall] -> /api/*
        let bunPath = prefix + (routePath.startsWith("/") ? routePath : "/" + routePath);
        bunPath = bunPath
          .replace(/\[\.{3}([a-zA-Z0-9_]+)\]/g, "*") // [...slug] -> *
          .replace(/\[([a-zA-Z0-9_]+)\]/g, ":$1");    // [id] -> :id

        bunRoutes[bunPath] = createHandler(routePath, importer);
      });
    } else {
      // Runtime Scan
      if (fs.existsSync(absoluteDir)) {
        const router = new Bun.FileSystemRouter({
          style: "nextjs",
          dir: absoluteDir,
          fileExtensions: [".ts", ".js", ".tsx", ".jsx"],
        });

        Object.entries(router.routes).forEach(([routePath, filePath]) => {
          // Bun router gives /users/[id]
          let bunPath = prefix + (routePath === "/" ? "" : routePath);
          bunPath = bunPath
            .replace(/\[\.{3}([a-zA-Z0-9_]+)\]/g, "*") // [...slug] -> *
            .replace(/\[([a-zA-Z0-9_]+)\]/g, ":$1");    // [id] -> :id

          bunRoutes[bunPath] = createHandler(filePath);
        });
      }
    }

    return bunRoutes;
  }

  return {
    handle: handleApiRequest,
    getBunRoutes,
    reload: () => { }, // No-op for static
  };
}

// Add BunRouteHandler type if not imported
import type { BunRouteHandler } from "../types";
