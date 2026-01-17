import React from "react";
import { CodeBlock } from "@/components/ui/code-block";

export const meta = () => [{ title: "Cloudflare Bindings - Buncf Docs" }];

export default function BindingsDocs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Cloudflare Bindings</h1>
        <p className="text-xl text-muted-foreground">
          Access KV, D1, R2, and environment variables with full type support.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="config">Configuration</h2>
        <p className="leading-7">
          Define your bindings in <code>wrangler.json</code>.
        </p>
        <CodeBlock filename="wrangler.json" language="json" code={`{
  "name": "my-app",
  "kv_namespaces": [
    { "binding": "MY_KV", "id": "your-kv-id" }
  ],
  "d1_databases": [
    { "binding": "DB", "database_name": "my-db", "database_id": "..." }
  ],
  "vars": {
    "API_KEY": "secret"
  }
}`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="access">Access in Code</h2>
        <p className="leading-7">
          Use the <code>getCloudflareContext</code> helper.
        </p>
        <CodeBlock filename="src/api/data.ts" code={`import { getCloudflareContext } from "buncf";

export async function GET() {
  const { env, ctx } = getCloudflareContext();
  
  // KV access
  const value = await env.MY_KV.get("key");
  
  // D1 access
  const result = await env.DB.prepare("SELECT * FROM users").all();

  return Response.json({ value, users: result.results });
}`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="local-dev">Local Development</h2>
        <p className="leading-7">
          Buncf uses <a href="https://miniflare.dev" className="text-pink-500 hover:underline">Miniflare</a> to emulate Cloudflare bindings locally.
        </p>
        <CodeBlock language="bash" code={`# Local emulation
buncf dev

# Live Cloudflare data (Proxy to real KV/D1)
buncf dev --remote`} />
      </div>

    </div>
  );
}
