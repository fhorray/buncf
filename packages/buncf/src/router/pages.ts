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
 * Create a pages router from a directory
 */
/**
 * Create a pages router from a directory (or static map)
 */
export function createPagesRouter(options: {
  dir: string;
  staticRoutes?: Record<string, string>; // Route Pattern -> File Path
}) {
  const { dir, staticRoutes } = options;
  const absoluteDir = path.resolve(dir);

  let matchRoute: (path: string) => { filePath: string; params: Record<string, string> } | null;
  let getRouteList: () => string[];

  // Strategy 1: Static Routes (Bundled)
  if (staticRoutes && Object.keys(staticRoutes).length > 0) {
    const routes = Object.entries(staticRoutes).map(([routePath, filePath]) => {
      // Convert Next.js style [param] to :param for matching if needed, 
      // but Bun Router output usually gives us :param or we can regex match.
      // Let's assume keys are like "/blog/[slug]" or "/about".

      const paramNames: string[] = [];
      // Regex to match dynamic segments [slug]
      const regexPath = routePath
        .replace(/\[([a-zA-Z0-9_]+)\]/g, (_, paramName) => {
          paramNames.push(paramName);
          return "([^/]+)";
        })
        .replace(/\//g, "\\/"); // Escape slashes

      const regex = new RegExp(`^${regexPath}$`);
      return { regex, paramNames, routePath, filePath };
    });

    matchRoute = (currentPath: string) => {
      for (const route of routes) {
        if (route.regex.test(currentPath)) {
          const matches = currentPath.match(route.regex);
          const params: Record<string, string> = {};
          if (matches) {
            matches.slice(1).forEach((val, i) => {
              params[route.paramNames[i] as string] = val;
            });
          }
          return { filePath: route.filePath, params };
        }
      }
      return null; // No match
    };

    getRouteList = () => Object.keys(staticRoutes);

  } else {
    // Strategy 2: Runtime FileSystemRouter
    if (!fs.existsSync(absoluteDir)) {
      // console.log(`[buncf] No pages directory found at ${dir}`);
      matchRoute = () => null;
      getRouteList = () => [];
    } else {
      const router = new Bun.FileSystemRouter({
        style: "nextjs",
        dir: absoluteDir,
        fileExtensions: [".tsx", ".jsx", ".ts", ".js"],
      });

      matchRoute = (p) => {
        const m = router.match(p);
        if (m) return { filePath: m.filePath, params: m.params };
        return null;
      };

      getRouteList = () => {
        // Runtime scan logic
        // We can use the existing scanDir logic or just iterate router.routes if public
        // But scanDir is fine.
        const routes: string[] = [];
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
        return routes;
      };
    }
  }

  /**
   * Match a request/path against pages
   */
  function match(req: Request | string): PageMatch | null {
    const url = typeof req === "string" ? new URL(req, "http://localhost") : new URL(req.url);
    const pathname = url.pathname;

    const result = matchRoute(pathname);
    if (!result) return null;

    return {
      filePath: result.filePath,
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
