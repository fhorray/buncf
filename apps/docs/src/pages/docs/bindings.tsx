import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'Magic Bindings - Buncf' },
  { name: 'description', content: 'Using Cloudflare bindings (D1, KV, R2) in Buncf' },
];

export default function Bindings() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Magic Bindings</h1>
      <p>
        Buncf simplifies accessing Cloudflare bindings. Instead of passing `env` through
        every function, you can import bindings directly from <code>buncf/bindings</code>.
      </p>

      <h2>Configuration</h2>
      <p>First, define your bindings in <code>wrangler.json</code>:</p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`{
  "d1_databases": [
    {
      "binding": "MY_DB",
      "database_name": "prod-db",
      "database_id": "xxxx-xxxx"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "MY_KV",
      "id": "xxxx-xxxx"
    }
  ],
  "vars": {
    "API_KEY": "secret"
  }
}`}
          language="json"
          filename="wrangler.json"
        />
      </div>

      <h2>Usage</h2>
      <p>Import specific namespaces (d1, kv, r2, env) to access your resources.</p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`import { d1, kv, r2, env, context } from 'buncf/bindings';

export async function GET() {
  // 1. D1 Database
  const result = await d1.MY_DB.prepare('SELECT * FROM users').all();

  // 2. KV Storage
  await kv.MY_KV.put('last_access', new Date().toISOString());
  const value = await kv.MY_KV.get('some_key');

  // 3. R2 Object Storage
  const object = await r2.MY_BUCKET.get('image.png');

  // 4. Environment Variables
  const key = env.API_KEY;

  // 5. Execution Context (waitUntil, passThroughOnException)
  context.ctx.waitUntil(logAnalytics());

  return Response.json({ result, value });
}`}
          language="typescript"
        />
      </div>

      <h2>Type Safety</h2>
      <p>
        Buncf automatically generates a type definition file <code>.buncf/cloudflare-env.d.ts</code>
        based on your <code>wrangler.json</code>. This ensures that <code>d1.MY_DB</code> and
        <code>env.API_KEY</code> are correctly typed in your editor.
      </p>
    </div>
  );
}
