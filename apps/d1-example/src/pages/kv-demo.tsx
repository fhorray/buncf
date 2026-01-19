import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';

export const meta = () => [{ title: 'KV Tutorial • Buncf' }];

export default function KVPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
          KV Storage Tutorial
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Learn how to implement global, low-latency key-value storage in your
          Buncf app.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Step 1: Config */}
        <Card className="glass border-t-4 border-t-amber-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold">
                1
              </span>
              <CardTitle>Configure Wrangler</CardTitle>
            </div>
            <CardDescription>
              Add your KV namespace binding to wrangler.json
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock
              language="json"
              code={`{
  "kv_namespaces": [
    {
      "binding": "SETTINGS",
      "id": "your-kv-namespace-id",
      "preview_id": "your-preview-id"
    }
  ]
}`}
            />
          </CardContent>
        </Card>

        {/* Step 2: Implementation */}
        <Card className="glass border-t-4 border-t-amber-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold">
                2
              </span>
              <CardTitle>Usage in API Route</CardTitle>
            </div>
            <CardDescription>
              Import the `kv` proxy and access your namespace directly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock
              language="typescript"
              code={`// src/api/settings.ts
import { kv } from "buncf/bindings";

export async function GET() {
  // Read
  const theme = await kv.SETTINGS.get("theme");
  
  // Write
  await kv.SETTINGS.put("last_visit", Date.now().toString());

  return Response.json({ theme });
}`}
            />
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-6 flex gap-4">
            <Zap className="w-10 h-10 text-amber-500 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-400 mb-1">
                When to use KV?
              </h3>
              <p className="text-sm text-amber-200/80 leading-relaxed">
                Workers KV is optimized for high-read, low-write applications.
                It's eventually consistent, meaning changes may take up to 60
                seconds to propagate globally. Use it for user sessions, feature
                flags, configuration, and caching API responses.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
