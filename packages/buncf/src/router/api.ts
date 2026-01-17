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
 * Load API routes from a directory using Bun.FileSystemRouter
 */
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

  let matchRoute: (path: string) => { filePath: string; params: Record<string, string>; importer?: () => Promise<ApiModule> } | null;

  // Strategy 1: Static Routes (Bundled)
  if (staticRoutes && Object.keys(staticRoutes).length > 0) {
    // console.log("[buncf] Using static routes:", Object.keys(staticRoutes));

    // Tiny Router implementation for static map
    const routes = Object.entries(staticRoutes).map(([routePath, importer]) => {
      // Normalize Next.js style [param] to :param for matching
      // But build time router likely gives us :param syntax if we use Bun.FileSystemRouter there
      // Let's assume keys are "/api/users/:id" formatted.

      const paramNames: string[] = [];
      const regexPath = routePath.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
        paramNames.push(paramName);
        return "([^/]+)";
      });
      const regex = new RegExp(`^${regexPath}$`);
      return { regex, paramNames, importer, routePath };
    });

    matchRoute = (currentPath: string) => {
      // currentPath is relative to prefix e.g. /users/123
      // But staticRoutes keys usually include prefix if generated from scanner that sees /api
      // Let's assume the injected keys are FULL paths e.g. "/api/hello"

      // Note: handleApiRequest logic strips prefix. 
      // If our keys are "/api/...", we should NOT strip prefix or match against full path.
      // Let's stick to matching against FULL pathname for simplicity in static mode?
      // or adjust keys. 

      // Adjust: If we match against internal 'apiPath', keys should be '/hello'.
      // But Bun.FileSystemRouter returns patterns relative to mount?
      // Let's assume keys are relative to 'dir' but with '/' start.

      for (const route of routes) {
        if (route.regex.test(currentPath)) {
          const matches = currentPath.match(route.regex);
          const params: Record<string, string> = {};
          if (matches) {
            matches.slice(1).forEach((val, i) => {
              params[route.paramNames[i] as string] = val;
            });
          }
          return { filePath: route.routePath, params, importer: route.importer };
        }
      }
      return null;
    };

  } else {
    // Strategy 2: Runtime FileSystemRouter (Dev/Node)
    if (!fs.existsSync(absoluteDir)) {
      // console.log(`[buncf] No API directory found at ${dir}`);
      matchRoute = () => null;
    } else {
      const router = new Bun.FileSystemRouter({
        style: "nextjs",
        dir: absoluteDir,
        fileExtensions: [".ts", ".js", ".tsx", ".jsx"],
      });
      matchRoute = (p) => {
        const m = router.match(p);
        if (m) return { filePath: m.filePath, params: m.params };
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

    matchResult = matchRoute(apiPath);

    if (!matchResult) {
      return null;
    }

    try {
      // Dynamically import the matched file
      let module: ApiModule;
      if (matchResult.importer) {
        module = await matchResult.importer();
      } else {
        module = await import(matchResult.filePath);
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
      console.error(`[buncf] API Error in ${matchResult.filePath}:`, error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return {
    handle: handleApiRequest,
    reload: () => { }, // No-op for static
  };
}
