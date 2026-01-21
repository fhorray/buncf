import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'Project Structure - Buncf' },
  { name: 'description', content: 'Understanding the Buncf file structure' },
];

export default function Structure() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Project Structure</h1>
      <p>
        Buncf follows a convention-over-configuration approach.
        Here is the anatomy of a typical Buncf project:
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`my-app/
├── src/
│   ├── api/               # API Routes
│   │   ├── hello.ts           → /api/hello
│   │   └── users/
│   │       ├── index.ts       → /api/users
│   │       └── [id].ts        → /api/users/:id
│   │
│   ├── pages/             # Page Routes (React)
│   │   ├── _layout.tsx        # Root layout (HTML shell)
│   │   ├── _loading.tsx       # Suspense fallback
│   │   ├── _error.tsx         # Error boundary
│   │   ├── _notfound.tsx      # 404 page
│   │   ├── index.tsx          → /
│   │   └── about.tsx          → /about
│   │
│   ├── client.tsx         # Client entry point
│   ├── index.html         # HTML template
│   ├── index.ts           # Server entry (optional custom config)
│   └── globals.css        # Global styles
│
├── public/                # Static assets (favicon, images)
├── .buncf/                # Generated build artifacts (do not edit)
├── buncf.config.ts        # Optional Buncf configuration
├── wrangler.json          # Cloudflare configuration
├── package.json
└── tsconfig.json`}
          language="text"
        />
      </div>

      <h2>Key Directories & Files</h2>

      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-lg">src/pages/</h3>
          <p className="text-muted-foreground">
            Contains your application's React pages. The file structure maps directly to URLs.
            Supports dynamic segments like <code>[id].tsx</code>.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg">src/api/</h3>
          <p className="text-muted-foreground">
            Contains API endpoints. Files should export functions named after HTTP methods
            (GET, POST, etc.).
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg">src/client.tsx</h3>
          <p className="text-muted-foreground">
            The entry point for the browser bundle. This is where React hydration starts.
            Typically imports global styles.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg">wrangler.json</h3>
          <p className="text-muted-foreground">
            Configuration for Cloudflare Workers. Use this to define bindings for D1, KV, R2,
            and environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}
