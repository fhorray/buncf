import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, DocNavigation, InlineCode } from "@/components/docs/doc-components";
import { Lock } from "lucide-react";

export default function BindingsPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={Lock}
        title="Magic Bindings"
        description="Access Cloudflare bindings without boilerplate."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Overview</h2>
        <Paragraph>
          Magic bindings let you import Cloudflare services directly without passing context through your application. 
          buncf automatically injects the correct bindings based on your <InlineCode>wrangler.json</InlineCode> configuration.
        </Paragraph>
        <CodeBlock
          code={`import { d1, kv, r2, env, context } from 'buncf/bindings';`}
          language="typescript"
          showLineNumbers={false}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">D1 Database</h2>
        <Paragraph>
          Access D1 SQL databases:
        </Paragraph>
        <CodeBlock
          code={`import { d1 } from 'buncf/bindings';

export async function GET() {
  // Access your D1 database by binding name
  const users = await d1.MY_DB
    .prepare('SELECT * FROM users WHERE active = ?')
    .bind(true)
    .all();

  return Response.json(users.results);
}

// Insert data
export async function POST(req: Request) {
  const { name, email } = await req.json();
  
  const result = await d1.MY_DB
    .prepare('INSERT INTO users (name, email) VALUES (?, ?)')
    .bind(name, email)
    .run();

  return Response.json({ id: result.meta.last_row_id });
}`}
          language="typescript"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">KV Storage</h2>
        <Paragraph>
          Access Cloudflare Workers KV for key-value storage:
        </Paragraph>
        <CodeBlock
          code={`import { kv } from 'buncf/bindings';

export async function GET() {
  // Get a value
  const value = await kv.MY_KV.get('my-key');
  
  // Get with metadata
  const { value: data, metadata } = await kv.MY_KV.getWithMetadata('my-key');
  
  // Get as JSON
  const user = await kv.MY_KV.get('user:123', 'json');

  return Response.json({ value, user });
}

export async function POST(req: Request) {
  const { key, value } = await req.json();
  
  // Put a value
  await kv.MY_KV.put(key, value);
  
  // Put with expiration (in seconds)
  await kv.MY_KV.put('session', 'data', { expirationTtl: 3600 });
  
  // Put with metadata
  await kv.MY_KV.put('user:123', JSON.stringify(user), {
    metadata: { createdAt: Date.now() }
  });

  return Response.json({ success: true });
}`}
          language="typescript"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">R2 Object Storage</h2>
        <Paragraph>
          Access R2 for object/file storage:
        </Paragraph>
        <CodeBlock
          code={`import { r2 } from 'buncf/bindings';

export async function GET() {
  // Get an object
  const object = await r2.MY_BUCKET.get('images/photo.jpg');
  
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    },
  });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  // Upload a file
  await r2.MY_BUCKET.put(\`uploads/\${file.name}\`, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return Response.json({ success: true });
}

export async function DELETE(req: Request) {
  const { key } = await req.json();
  
  // Delete an object
  await r2.MY_BUCKET.delete(key);

  return Response.json({ deleted: true });
}`}
          language="typescript"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Environment Variables</h2>
        <Paragraph>
          Access environment variables and secrets:
        </Paragraph>
        <CodeBlock
          code={`import { env } from 'buncf/bindings';

export async function GET() {
  // Access env vars defined in wrangler.json
  const apiKey = env.API_KEY;
  const stripeKey = env.STRIPE_SECRET_KEY;
  
  return Response.json({ 
    hasApiKey: !!apiKey,
    environment: env.ENVIRONMENT || 'development',
  });
}`}
          language="typescript"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Request Context</h2>
        <Paragraph>
          Access Cloudflare-specific request information:
        </Paragraph>
        <CodeBlock
          code={`import { context } from 'buncf/bindings';

export async function GET() {
  // Cloudflare request properties
  const cf = context.cf;
  
  return Response.json({
    country: cf?.country,
    city: cf?.city,
    region: cf?.region,
    timezone: cf?.timezone,
    colo: cf?.colo,
    isEU: cf?.isEUCountry,
  });
}`}
          language="typescript"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Configuration</h2>
        <Paragraph>
          Configure bindings in your <InlineCode>wrangler.json</InlineCode>:
        </Paragraph>
        <CodeBlock
          code={`{
  "name": "my-app",
  "main": ".buncf/cloudflare/worker.js",
  "compatibility_date": "2025-01-01",
  
  "d1_databases": [
    { "binding": "MY_DB", "database_id": "xxxx-xxxx-xxxx" }
  ],
  
  "kv_namespaces": [
    { "binding": "MY_KV", "id": "xxxx-xxxx-xxxx" }
  ],
  
  "r2_buckets": [
    { "binding": "MY_BUCKET", "bucket_name": "my-bucket" }
  ],
  
  "vars": {
    "API_KEY": "your-api-key",
    "ENVIRONMENT": "production"
  }
}`}
          language="json"
          filename="wrangler.json"
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/actions", label: "Server Actions" }}
        next={{ href: "/docs/layouts", label: "Layouts & Metadata" }}
      />
    </article>
  );
}
