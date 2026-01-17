import React from "react";
import { CodeBlock } from "@/components/ui/code-block";

export const meta = () => [{ title: "Deployment - Buncf Docs" }];

export default function DeploymentDocs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Deployment</h1>
        <p className="text-xl text-muted-foreground">
          Deploy your Buncf application to the edge in seconds.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="deploy">Deploying</h2>
        <p className="leading-7">
          Run the deploy command to build and upload your worker.
        </p>
        <CodeBlock language="bash" code={`# Login to Cloudflare (first time)
bunx wrangler login

# Deploy
bun deploy`} />
      </div>

       <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="build-output">Build Output</h2>
        <p className="leading-7">
          Buncf bundles your server code into a single worker file and optimizes your assets.
        </p>
        <CodeBlock filename=".buncf/" code={`.buncf/
├── cloudflare/
│   ├── worker.js       # Bundled worker (Bun target)
│   └── assets/
│       ├── index.html
│       ├── client.js
│       └── globals.css
├── routes.ts           # Client routes manifest
└── api-client.ts       # Typed API client`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="how-it-works">How It Works</h2>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
            <li><strong>Scanning:</strong> CLI scans <code>src/api</code> and <code>src/pages</code>.</li>
            <li><strong>Type Extraction:</strong> Parses <code>defineHandler</code> for RPC types.</li>
            <li><strong>Code Generation:</strong> Creates typed client and route manifests.</li>
            <li><strong>Build:</strong> Bun bundles server (worker) and client code separately.</li>
            <li><strong>Shim Injection:</strong> Bun APIs are polyfilled for Cloudflare Workers.</li>
            <li><strong>Deploy:</strong> Wrangler uploads the worker and assets bucket.</li>
        </ol>
      </div>

    </div>
  );
}
