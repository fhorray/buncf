/**
 * Example CMS Plugin for Buncf
 * 
 * Demonstrates:
 * 1. Unified Plugin System (Bun build hooks + Buncf runtime)
 * 2. React Page Injection
 * 3. Middleware Context Access
 */

import type { BuncfPlugin, BuncfPluginContext } from "buncf";

// In-memory store
interface Post {
  id: string;
  title: string;
  content: string;
}
const posts: Map<string, Post> = new Map();
posts.set("1", { id: "1", title: "Hello World", content: "Welcome to Buncf CMS" });

export interface CMSPluginOptions {
  adminPath?: string;
}

export function cmsPlugin(options: CMSPluginOptions = {}): BuncfPlugin {
  const { adminPath = "/admin" } = options;

  return {
    name: "buncf-cms",
    basePath: adminPath,

    // 1. Build Hook (Standard Bun Plugin)
    setup(build) {
       // Example: Add a virtual module or other build-time logic
       // console.log("CMS Plugin Build Setup");
    },

    // 2. Runtime Routes (Buncf Extension)
    routes: async (req: Request, ctx: BuncfPluginContext): Promise<Response> => {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method;

      // API: GET /api/posts
      if (path === "/api/posts" && method === "GET") {
        return Response.json(Array.from(posts.values()));
      }

      // API: POST /api/posts
      if (path === "/api/posts" && method === "POST") {
         const body = await req.json() as any;
         const id = Date.now().toString();
         const post = { id, title: body.title, content: body.content };
         posts.set(id, post);
         return Response.json(post);
      }

      // If no route matched, return 404 (or null/undefined to pass through)
      return new Response("Not Found", { status: 404 });
    },

    // 3. React Pages Injection (Buncf Extension)
    pages: {
        // We map a route pattern to a lazy-loaded component
        // Since we are in the plugin file, we can import relative to here.
        // But for this example, we'll inline a component using a data URI or just point to a file if we had one.
        // Ideally, this points to `() => import("./pages/AdminDashboard")`.

        // IMPORTANT: The path key here is the ROUTE PATTERN.
        // If basePath is set on the plugin, these routes are RELATIVE to basePath?
        // No, typically `pages` keys are absolute routes in the app (like file system router).
        // If we want them under /admin, we must specify /admin.
        // Let's assume absolute paths for flexibility.

        [`${adminPath}/dashboard`]: () => import("./pages/AdminDashboard"),
    },

    // 4. Middleware (Buncf Extension)
    middleware: [
        {
            matcher: `${adminPath}/*`,
            handler: async (req, next) => {
                // console.log("CMS Middleware Checking Auth...");
                return next();
            }
        }
    ]
  };
}
