import { CodeBlock } from '@/components/code-block';
import {
  PageHeader,
  Paragraph,
  DocNavigation,
  InlineCode,
} from '@/components/docs/doc-components';
import { FolderTree } from 'lucide-react';

export default function StructurePage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={FolderTree}
        title="Project Structure"
        description="Understanding the buncf project structure and file conventions."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Directory Structure</h2>
        <Paragraph>buncf follows a convention-based file structure:</Paragraph>
        <CodeBlock
          code={`my-app/
├── src/
│   ├── index.ts          # Server entry (optional)
│   ├── index.html        # HTML template
│   ├── client.tsx        # Client entry (React)
│   ├── globals.css       # Tailwind/global styles
│   │
│   ├── api/              # API Routes
│   │   ├── hello.ts          → GET/POST /api/hello
│   │   ├── users/
│   │   │   ├── index.ts      → /api/users
│   │   │   └── [id].ts       → /api/users/:id
│   │   └── [...route].ts     → Hono catch-all
│   │
│   └── pages/            # Page Routes
│       ├── _layout.tsx       # Root layout
│       ├── _loading.tsx      # Loading state
│       ├── _error.tsx        # Error boundary
│       ├── _notfound.tsx     # 404 page
│       ├── index.tsx         → /
│       └── dashboard/
│           ├── _layout.tsx   # Nested layout
│           └── index.tsx     → /dashboard
│
├── public/               # Static assets
├── .buncf/               # Generated (gitignored)
└── wrangler.json         # Cloudflare config`}
          language="text"
          filename="Project Structure"
          showLineNumbers={false}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Key Files</h2>

        <h3 className="text-lg font-semibold mt-6 mb-3">src/client.tsx</h3>
        <Paragraph>
          The client-side entry point. This is where you mount your React app
          and import global styles.
        </Paragraph>
        <CodeBlock
          code={`import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'buncf/router';
import './globals.css';

hydrateRoot(
  document,
  <BrowserRouter />
);`}
          language="tsx"
          filename="src/client.tsx"
        />

        <h3 className="text-lg font-semibold mt-6 mb-3">src/index.html</h3>
        <Paragraph>The HTML template used for server-side rendering.</Paragraph>
        <CodeBlock
          code={`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- Meta tags injected here -->
</head>
<body>
  <div id="root"><!-- SSR content --></div>
</body>
</html>`}
          language="html"
          filename="src/index.html"
        />

        <h3 className="text-lg font-semibold mt-6 mb-3">wrangler.json</h3>
        <Paragraph>Cloudflare Workers configuration file.</Paragraph>
        <CodeBlock
          code={`{
  "name": "my-app",
  "main": ".buncf/cloudflare/worker.js",
  "compatibility_date": "2025-01-01",
  "d1_databases": [],
  "kv_namespaces": [],
  "r2_buckets": []
}`}
          language="json"
          filename="wrangler.json"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Special Files</h2>
        <Paragraph>
          Files prefixed with <InlineCode>_</InlineCode> in the{' '}
          <InlineCode>pages/</InlineCode> directory have special meaning:
        </Paragraph>
        <ul className="space-y-3 mt-4">
          <li className="flex gap-3">
            <code className="text-neon text-sm">_layout.tsx</code>
            <span className="text-muted-foreground">
              Wraps all pages in the same directory and below
            </span>
          </li>
          <li className="flex gap-3">
            <code className="text-neon font-mono text-sm">_loading.tsx</code>
            <span className="text-muted-foreground">
              Shown while page is loading
            </span>
          </li>
          <li className="flex gap-3">
            <code className="text-neon font-mono text-sm">_error.tsx</code>
            <span className="text-muted-foreground">
              Error boundary for the directory
            </span>
          </li>
          <li className="flex gap-3">
            <code className="text-neon font-mono text-sm">_notfound.tsx</code>
            <span className="text-muted-foreground">404 page</span>
          </li>
        </ul>
      </section>

      <DocNavigation
        prev={{ href: '/docs/cli', label: 'CLI Commands' }}
        next={{ href: '/docs/routing', label: 'File-System Routing' }}
      />
    </article>
  );
}
