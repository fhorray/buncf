import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, DocNavigation, InlineCode } from "@/components/docs/doc-components";
import { Rocket } from "lucide-react";

export default function DeploymentPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={Rocket}
        title="Deployment"
        description="Deploy your buncf app to Cloudflare Workers."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Quick Deploy</h2>
        <Paragraph>
          Deploy to Cloudflare Workers with a single command:
        </Paragraph>
        <CodeBlock
          code="bun deploy"
          language="bash"
          showLineNumbers={false}
        />
        <Paragraph>
          This command runs <InlineCode>buncf build</InlineCode> and then <InlineCode>wrangler deploy</InlineCode> automatically.
        </Paragraph>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Prerequisites</h2>
        <Paragraph>
          Before deploying, make sure you have:
        </Paragraph>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
          <li>A Cloudflare account</li>
          <li>Wrangler CLI installed and authenticated</li>
          <li>A properly configured <InlineCode>wrangler.json</InlineCode></li>
        </ul>
        <CodeBlock
          code={`# Install Wrangler
bun add -D wrangler

# Login to Cloudflare
npx wrangler login`}
          language="bash"
          showLineNumbers={false}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Configuration</h2>
        <Paragraph>
          Configure your deployment in <InlineCode>wrangler.json</InlineCode>:
        </Paragraph>
        <CodeBlock
          code={`{
  "name": "my-app",
  "main": ".buncf/cloudflare/worker.js",
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat"],
  
  // Custom domain (optional)
  "routes": [
    { "pattern": "myapp.com/*", "zone_name": "myapp.com" }
  ],
  
  // Environment variables
  "vars": {
    "ENVIRONMENT": "production"
  },
  
  // Bindings
  "d1_databases": [
    { 
      "binding": "DB", 
      "database_name": "my-db", 
      "database_id": "xxxx-xxxx-xxxx" 
    }
  ],
  
  "kv_namespaces": [
    { 
      "binding": "KV", 
      "id": "xxxx-xxxx-xxxx" 
    }
  ]
}`}
          language="json"
          filename="wrangler.json"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Environment Variables</h2>
        <Paragraph>
          Set secrets that shouldn't be in your config file:
        </Paragraph>
        <CodeBlock
          code={`# Set a secret
npx wrangler secret put API_KEY

# Set multiple secrets from .env file
npx wrangler secret bulk .env.production`}
          language="bash"
          showLineNumbers={false}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Preview Deployments</h2>
        <Paragraph>
          Deploy to a preview environment for testing:
        </Paragraph>
        <CodeBlock
          code={`# Deploy to preview
npx wrangler deploy --env preview

# Or use a custom environment
npx wrangler deploy --env staging`}
          language="bash"
          showLineNumbers={false}
        />
        <Paragraph>
          Configure environments in your wrangler.json:
        </Paragraph>
        <CodeBlock
          code={`{
  "name": "my-app",
  "main": ".buncf/cloudflare/worker.js",
  
  "env": {
    "preview": {
      "vars": { "ENVIRONMENT": "preview" }
    },
    "staging": {
      "vars": { "ENVIRONMENT": "staging" },
      "routes": [{ "pattern": "staging.myapp.com/*" }]
    }
  }
}`}
          language="json"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">CI/CD</h2>
        <Paragraph>
          Deploy automatically with GitHub Actions:
        </Paragraph>
        <CodeBlock
          code={`# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v2
      
      - name: Install dependencies
        run: bun install
      
      - name: Build
        run: bun run build
      
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: \${{ secrets.CF_API_TOKEN }}`}
          language="yaml"
          filename=".github/workflows/deploy.yml"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Custom Domains</h2>
        <Paragraph>
          Add a custom domain to your Worker:
        </Paragraph>
        <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-4 mb-4">
          <li>Add your domain to Cloudflare (if not already)</li>
          <li>Configure the route in <InlineCode>wrangler.json</InlineCode></li>
          <li>Deploy your Worker</li>
        </ol>
        <CodeBlock
          code={`{
  "routes": [
    { "pattern": "myapp.com/*", "zone_name": "myapp.com" },
    { "pattern": "www.myapp.com/*", "zone_name": "myapp.com" }
  ]
}`}
          language="json"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Build Output</h2>
        <Paragraph>
          The build command generates optimized assets in <InlineCode>.buncf/</InlineCode>:
        </Paragraph>
        <CodeBlock
          code={`.buncf/
├── cloudflare/
│   └── worker.js     # Bundled worker
├── client/
│   ├── assets/       # Static assets with hashes
│   └── index.html    # Client HTML
└── manifest.json     # Build manifest`}
          language="text"
          showLineNumbers={false}
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/styling", label: "Styling" }}
      />
    </article>
  );
}
