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
export function createPagesRouter(options: { dir: string }) {
  const { dir } = options;
  const absoluteDir = path.resolve(dir);

  // Check if directory exists
  if (!fs.existsSync(absoluteDir)) {
    console.log(`[buncf] No pages directory found at ${dir}`);
    return null;
  }

  // Use Bun's FileSystemRouter
  const router = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: absoluteDir,
    fileExtensions: [".tsx", ".jsx", ".ts", ".js"],
  });

  /**
   * Match a request/path against pages
   */
  function match(req: Request | string): PageMatch | null {
    const result = router.match(req);
    if (!result) return null;

    return {
      filePath: result.filePath,
      pathname: result.pathname,
      params: result.params || {},
      query: result.query || {},
    };
  }

  /**
   * Get all routes for manifest generation
   */
  function getRoutes(): string[] {
    // Scan directory for all page files
    const routes: string[] = [];
    const scanDir = (dir: string, prefix: string = "") => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          scanDir(path.join(dir, entry.name), `${prefix}/${entry.name}`);
        } else if (entry.name.match(/\.(tsx|jsx|ts|js)$/)) {
          const name = entry.name.replace(/\.(tsx|jsx|ts|js)$/, "");
          if (name === "index") {
            routes.push(prefix || "/");
          } else {
            routes.push(`${prefix}/${name}`);
          }
        }
      }
    };
    scanDir(absoluteDir);
    return routes;
  }

  return {
    router,
    match,
    getRoutes,
    reload: () => router.reload(),
  };
}
