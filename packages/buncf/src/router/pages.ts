/**
 * Pages Router
 * Handles file-system based page routing for React/HTML pages
 * 
 * Convention:
 * - src/pages/index.tsx → /
 * - src/pages/about.tsx → /about
 * - src/pages/blog/[slug].tsx → /blog/:slug
 */

import * as fs from "fs";
import * as path from "path";
import { createRouteMatcher } from "./matcher";

export interface PageRoute {
  pattern: string;
  filePath: string;
  params: string[];
}

export interface PageMatch {
  filePath: string;
  pathname: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

/**
 * Create a pages router from a directory (or static map)
 */
export function createPagesRouter(options: {
  dir: string;
  staticRoutes?: Record<string, string>; // Route Pattern -> File Path
  extraRoutes?: Record<string, string>; // Pattern -> Virtual Path (for plugins)
}) {
  const { dir, staticRoutes, extraRoutes } = options;
  const absoluteDir = path.resolve(dir);

  // Unified matcher interface
  let matcher: ReturnType<typeof createRouteMatcher> | null = null;

  // Combine static and extra routes
  const combinedStaticRoutes = { ...staticRoutes, ...extraRoutes };

  // Strategy 1: Static Routes (Bundled or provided explicitly)
  if (Object.keys(combinedStaticRoutes).length > 0) {
    const routeDefs = Object.entries(combinedStaticRoutes).map(([pattern, filePath]) => ({
      pattern,
      data: { filePath }
    }));
    matcher = createRouteMatcher(routeDefs);
  }

  // Internal matching function wrapper
  let internalMatch: (p: string) => { params: Record<string, string>, data: { filePath: string } } | null;
  let getRouteList: () => string[];

  if (matcher) {
    internalMatch = (p) => {
      const m = matcher!.match(p);
      if (!m) return null;
      return {
        params: m.params,
        data: m.data as { filePath: string }
      };
    };
    getRouteList = () => matcher!.getPatterns();
  } else {
    // Strategy 2: Runtime FileSystemRouter (Dev/Node)
    // In this case, we need to manually merge FileSystemRouter with extraRoutes (plugins)

    // 1. FileSystemRouter
    let fsRouter: Bun.FileSystemRouter | null = null;
    if (fs.existsSync(absoluteDir)) {
      fsRouter = new Bun.FileSystemRouter({
        style: "nextjs",
        dir: absoluteDir,
        fileExtensions: [".tsx", ".jsx", ".ts", ".js"],
      });
    }

    // 2. Extra Routes Matcher (Plugins)
    let extraMatcher: ReturnType<typeof createRouteMatcher> | null = null;
    if (extraRoutes && Object.keys(extraRoutes).length > 0) {
       const extraDefs = Object.entries(extraRoutes).map(([pattern, filePath]) => ({
          pattern,
          data: { filePath }
       }));
       extraMatcher = createRouteMatcher(extraDefs);
    }

    internalMatch = (p) => {
      // Priority: FS Router (User) > Extra (Plugins)
      if (fsRouter) {
        const m = fsRouter.match(p);
        if (m) {
          return {
            params: m.params,
            data: { filePath: m.filePath }
          };
        }
      }

      if (extraMatcher) {
        const m = extraMatcher.match(p);
        if (m) return { params: m.params, data: m.data as { filePath: string } };
      }

      return null;
    };

    getRouteList = () => {
      const routes: string[] = [];

      // Scan FS
      if (fs.existsSync(absoluteDir)) {
        const scanDir = (d: string, prefix: string = "") => {
          try {
            const entries = fs.readdirSync(d, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.isDirectory()) {
                scanDir(path.join(d, entry.name), `${prefix}/${entry.name}`);
              } else if (entry.name.match(/\.(tsx|jsx|ts|js)$/)) {
                const name = entry.name.replace(/\.(tsx|jsx|ts|js)$/, "");
                if (name === "index") {
                  routes.push(prefix || "/");
                } else {
                  routes.push(`${prefix}/${name}`);
                }
              }
            }
          } catch (e) { /* ignore */ }
        };
        scanDir(absoluteDir);
      }

      // Add Extra Routes
      if (extraRoutes) {
         routes.push(...Object.keys(extraRoutes));
      }

      return routes;
    };
  }

  /**
   * Match a request/path against pages
   */
  function match(req: Request | string): PageMatch | null {
    const url = typeof req === "string" ? new URL(req, "http://localhost") : new URL(req.url);
    const pathname = url.pathname;

    const result = internalMatch(pathname);
    if (!result) return null;

    return {
      filePath: result.data.filePath,
      pathname: pathname,
      params: result.params || {},
      query: Object.fromEntries(url.searchParams),
    };
  }

  return {
    match,
    getRoutes: getRouteList,
    reload: () => { }, // no-op
  };
}
