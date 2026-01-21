import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'Deployment - Buncf' },
  { name: 'description', content: 'Deploying Buncf apps to Cloudflare Workers' },
];

export default function Deployment() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Deployment</h1>
      <p>
        Buncf is designed to be deployed to <strong>Cloudflare Workers</strong>.
      </p>

      <h2>The Deploy Command</h2>
      <p>
        To deploy your application, simply run:
      </p>

      <div className="not-prose my-6">
        <CodeBlock code="bun deploy" language="bash" />
      </div>

      <p>This command performs the following steps:</p>
      <ol>
        <li><strong>Build:</strong> Runs <code>buncf build</code> to compile your app.</li>
        <li><strong>Bundle:</strong> Bundles the worker and client assets into <code>.buncf/cloudflare</code>.</li>
        <li><strong>Upload:</strong> Uses <code>wrangler deploy</code> to upload the worker and assets to Cloudflare.</li>
      </ol>

      <h2>Build Output</h2>
      <p>The build artifacts are stored in the <code>.buncf</code> directory:</p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`.buncf/
├── cloudflare/
│   ├── worker.js      # The server-side worker bundle
│   └── assets/        # Static assets (client JS, CSS, public/ files)
├── routes.ts          # Generated route manifest
└── api-client.ts      # Generated API client`}
          language="text"
        />
      </div>

      <h2>Environment Variables</h2>
      <p>
        Environment variables are managed via <code>wrangler.json</code>. Do NOT store secrets
        in this file. Instead, use <code>wrangler secret put</code>.
      </p>

      <div className="not-prose my-6">
        <CodeBlock code="bunx wrangler secret put API_SECRET" language="bash" />
      </div>

      <p>Access them in your code via the <code>env</code> binding:</p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`import { env } from 'buncf/bindings';

export const GET = defineHandler(() => {
  console.log(env.API_SECRET);
  // ...
});`}
          language="typescript"
        />
      </div>
    </div>
  );
}
