# Middleware Stack

Buncf uses a **Declarative Middleware Stack** pattern. Instead of a single function, you define an ordered stack of middlewares that can match specific routes using standard `URLPattern`.

## Setup

Create a file at `src/middleware.ts` (or `.js`) that exports an array of middleware objects.

```typescript
// src/middleware.ts
import type { MiddlewareConfig } from "buncf";

export default [
    // 1. Logger (No matches = runs on EVERYTHING)
    {
        name: "logger",
        handler: async (req, next) => {
            console.log(`[${req.method}] ${req.url}`);
            const start = performance.now();
            
            const res = await next(); // Run next middleware
            
            const elapsed = performance.now() - start;
            res.headers.set("X-Response-Time", `${elapsed.toFixed(2)}ms`);
            return res;
        }
    },

    // 2. Auth Guard (Matches only /api/private/*)
    {
        name: "auth",
        matcher: "/api/private/*",
        handler: async (req, next) => {
            const token = req.headers.get("Authorization");
            if (!token) {
                return new Response("Unauthorized", { status: 401 });
            }
            // Do logic...
            return next();
        }
    },

    // 3. User Enrichment (Matches /users/:id)
    {
        name: "user-context",
        matcher: "/users/:id",
        handler: async (req, next) => {
            // You can modify request here if needed (e.g. headers)
            req.headers.set("X-User-Enriched", "true");
            return next();
        }
    }
] satisfies MiddlewareConfig[];
```

## Configuration Object

```typescript
interface MiddlewareConfig {
    name?: string;
    
    // URLPattern(s) to match.
    // If omitted, matches ALL requests.
    // Examples: "/api/*", "/users/:id", ["/route1", "/route2"]
    matcher?: string | string[];

    // Async handler
    handler: (req: Request, next: () => Promise<Response>) => Response | Promise<Response>;
}
```

## How it works

1. **Order Matters**: Middlewares run in the order defined in the array.
2. **Matching**: Buncf uses the standard `URLPattern` API. If a request matches the pattern, the handler is executed. If `matcher` is undefined, it always runs.
3. **Control Flow**: You control the flow by calling `next()`.
   - Call `await next()` to proceed to the next middleware or the final route handler.
   - Return a `Response` directly to short-circuit (e.g., Auth failure).
   - You can modify the Response AFTER `next()` returns (e.g., adding logging headers).
4. **Server-Side Execution**: Middleware runs on the server (Worker) BEFORE any page rendering or API logic.

## Compatibility

- Works in `buncf dev`
- Works in Cloudflare Workers (`buncf deploy`)
- Supports standard `Request` / `Response` objects
