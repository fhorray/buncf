import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Copy, Terminal, Zap } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';

export const meta = () => [{ title: 'R2 Tutorial • Buncf' }];

export default function R2Page() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          R2 Object Storage
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Zero egress fee object storage, fully S3 compatible.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Step 1: Config */}
        <Card className="glass border-t-4 border-t-purple-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold">
                1
              </span>
              <CardTitle>Configure Wrangler</CardTitle>
            </div>
            <CardDescription>Bind an R2 bucket to your worker</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock
              language="json"
              code={`{
  "r2_buckets": [
    {
      "binding": "IMAGES",
      "bucket_name": "my-app-images"
    }
  ]
}`}
            />
          </CardContent>
        </Card>

        {/* Step 2: Upload */}
        <Card className="glass border-t-4 border-t-purple-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold">
                2
              </span>
              <CardTitle>Handling Uploads</CardTitle>
            </div>
            <CardDescription>
              Receive a file via POST and save directly to R2.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock
              language="typescript"
              code={`// src/api/upload.ts
import { r2 } from "buncf/bindings";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  
  if (!file) return new Response("No file", { status: 400 });

  // Stream directly to R2
  await r2.IMAGES.put(file.name, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  return Response.json({ success: true, key: file.name });
}`}
            />
          </CardContent>
        </Card>

        {/* Step 3: Serve */}
        <Card className="glass border-t-4 border-t-purple-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold">
                3
              </span>
              <CardTitle>Serving Files</CardTitle>
            </div>
            <CardDescription>
              Stream files from R2 back to the client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock
              language="typescript"
              code={`// src/api/images/[key].ts
import { r2 } from "buncf/bindings";

export async function GET(req: any) {
  const key = req.params.key;
  const object = await r2.IMAGES.get(key);

  if (!object) return new Response("Not found", { status: 404 });

  // Return stream with correct headers
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new Response(object.body, { headers });
}`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
