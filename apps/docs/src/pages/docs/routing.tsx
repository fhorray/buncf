import React from "react";
import { CodeBlock } from "@/components/ui/code-block";

export const meta = () => [{ title: "Routing - Buncf Docs" }];

export default function RoutingDocs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">File-System Routing</h1>
        <p className="text-xl text-muted-foreground">
          Buncf automatically scans <code>src/api/</code> and <code>src/pages/</code> to generate routes.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0" id="overview">Overview</h2>
        <CodeBlock filename="Project Structure" code={`src/
├── api/
│   ├── hello.ts         → GET/POST /api/hello
│   └── users/[id].ts    → GET/PUT/DELETE /api/users/:id
└── pages/
    ├── index.tsx        → /
    ├── about.tsx        → /about
    └── blog/[slug].tsx  → /blog/:slug`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="api-routes">API Routes</h2>
        <p className="leading-7">
          Export HTTP method handlers from files in <code>src/api/</code>.
        </p>
        <CodeBlock filename="src/api/users/[id].ts" code={`export function GET(req: Request & { params: { id: string } }) {
  return Response.json({ userId: req.params.id });
}

export function PUT(req: Request & { params: { id: string } }) {
  return Response.json({ updated: req.params.id });
}

export function DELETE(req: Request & { params: { id: string } }) {
  return Response.json({ deleted: req.params.id });
}`} />
      </div>

       <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="page-routes">Page Routes</h2>
        <p className="leading-7">
          Export React components from files in <code>src/pages/</code>.
        </p>
        <CodeBlock filename="src/pages/blog/[slug].tsx" code={`import { useParams } from "buncf/router";

export default function BlogPost() {
  const { slug } = useParams();
  return <h1>Post: {slug}</h1>;
}`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="hono">Hono Integration</h2>
        <p className="leading-7">
          Buncf fully supports <a href="https://hono.dev" className="text-pink-500 hover:underline">Hono</a> for more complex API needs.
        </p>
        <CodeBlock filename="src/api/[...route].ts" code={`import { Hono } from "hono";
const app = new Hono().basePath("/api");

app.get("/hello", (c) => c.json({ message: "Hello from Hono!" }));
app.get("/users", (c) => c.json([{ id: 1, name: "Alice" }]));

// Export Hono's fetch handler directly
export default app.fetch;`} />
      </div>
      
       <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="error-pages">Error Pages</h2>
        <p className="leading-7">
           Create special files in <code>src/pages/</code> to customize global states:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><code>_error.tsx</code> - Global Error Boundary</li>
            <li><code>_loading.tsx</code> - Global Loading State (Suspense)</li>
            <li><code>_notfound.tsx</code> - 404 Page</li>
        </ul>
        <CodeBlock filename="src/pages/_notfound.tsx" code={`export default function NotFound() {
  return <h1>404 - Page Not Found</h1>;
}`} />
      </div>

    </div>
  );
}
