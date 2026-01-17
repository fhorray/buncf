import React from "react";
import { CodeBlock } from "@/components/ui/code-block";

export const meta = () => [{ title: "Middleware - Buncf Docs" }];

export default function MiddlewareDocs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Middleware</h1>
        <p className="text-xl text-muted-foreground">
          Intercept requests before they reach your route handlers.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="usage">Usage</h2>
        <p className="leading-7">
          Create <code>src/middleware.ts</code> to define your middleware stack.
        </p>
        <CodeBlock filename="src/middleware.ts" code={`import type { MiddlewareConfig } from "buncf";

export default [
  {
    name: "auth-guard",
    matcher: "/api/protected/*", // Supports wildcards
    handler: async (req, next) => {
      const token = req.headers.get("Authorization");
      if (!token) {
        return new Response("Unauthorized", { status: 401 });
      }
      return next(); // Proceed to next middleware or route handler
    }
  },
  {
    name: "logger",
    matcher: "/api/*",
    handler: async (req, next) => {
      console.log(\`[\${req.method}] \${req.url}\`);
      return next();
    }
  }
] satisfies MiddlewareConfig[];`} />
      </div>

    </div>
  );
}
