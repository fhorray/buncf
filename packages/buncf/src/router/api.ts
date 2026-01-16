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
export function createApiRouter(options: { dir: string; prefix?: string }) {
  const { dir, prefix = "/api" } = options;
  const absoluteDir = path.resolve(dir);

  // Check if directory exists
  if (!fs.existsSync(absoluteDir)) {
    console.log(`[buncf] No API directory found at ${dir}`);
    return null;
  }

  // Use Bun's FileSystemRouter
  const router = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: absoluteDir,
    fileExtensions: [".ts", ".js", ".tsx", ".jsx"],
  });

  /**
   * Handle an incoming request against API routes
   */
  async function handleApiRequest(req: Request): Promise<Response | null> {
    const url = new URL(req.url);

    // Remove prefix to match against router
    let pathname = url.pathname;
    if (!pathname.startsWith(prefix)) {
      return null; // Not an API request
    }

    // Get path without prefix for matching
    const apiPath = pathname.slice(prefix.length) || "/";

    const match = router.match(apiPath);
    if (!match) {
      return null; // No matching route
    }

    try {
      // Dynamically import the matched file
      const module: ApiModule = await import(match.filePath);

      // Get handler for HTTP method
      const method = req.method.toUpperCase() as HttpMethod;
      const handler = module[method] || module.default;

      if (!handler) {
        return new Response(`Method ${method} not allowed`, { status: 405 });
      }

      // Attach params to request (extend Request)
      const enrichedReq = Object.assign(req, {
        params: match.params || {},
        query: match.query || {},
      });

      return await handler(enrichedReq);
    } catch (error: any) {
      console.error(`[buncf] API Error in ${match.filePath}:`, error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return {
    router,
    handle: handleApiRequest,
    reload: () => router.reload(),
  };
}
