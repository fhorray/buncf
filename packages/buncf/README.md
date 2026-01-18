# buncf

> Deploy Bun applications to Cloudflare Workers with zero configuration

[![npm version](https://img.shields.io/npm/v/buncf.svg)](https://www.npmjs.com/package/buncf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Zero Config**: Just run `bun add buncf` and deploy.
- **Type-Safe RPC**: Call server functions directly from client components with Zod validation.
- **Advanced Data Mutation**: Declarative forms and fetchers with auto-cancellation and loading states.
- **Hybrid Routing**: Use file-system routing for pages and Hono for complex APIs.
- **SSR Ready**: Built-in streaming renderer foundation.
- **Cloudflare Native**: First-class support for Workers, D1, R2, and KV.
- **Modern Stack**: React 19, TailwindCSS, and shadcn/ui.
- 🔄 **Bun.serve Compatibility** — Use familiar `Bun.serve()` API
- 📁 **File-System Routing** — Next.js-style pages and API routes
- 🔐 **Cloudflare Bindings** — Full support for KV, D1, R2, and environment variables
- 🎯 **Type-Safe API Client** — Auto-generated typed client for API routes (RPC-like)
- ⚛️ **Advanced Hooks** — `useFetcher`, `useAction`, and `Link` with Optimistic UI support
- 🎨 **Tailwind Support** — Built-in CSS processing with `bun-plugin-tailwind`
- 📦 **Public Folder** — Next.js-style `/public` directory support
- ⚡ **Fast Builds** — Powered by Bun's native bundler
- 🔁 **Hot Reload** — Automatic route regeneration on file changes

---

## Quick Start

```bash
# Create a new project
bunx buncf init my-app

# Navigate and start dev server
cd my-app
bun dev

# Deploy to Cloudflare
bun deploy
```

---

## Installation

```bash
bun add buncf
```

Or create a new project with the CLI:

```bash
bunx buncf init my-project
```

---

## CLI Commands

| Command        | Description                                       |
| -------------- | ------------------------------------------------- |
| `buncf init`   | Scaffold a new project with recommended structure |
| `buncf dev`    | Start development server with hot reload          |
| `buncf build`  | Build for production                              |
| `buncf deploy` | Build and deploy to Cloudflare Workers            |

### Dev Mode Options

```bash
buncf dev --remote    # Use live Cloudflare bindings (KV, D1, R2)
```

---

## File-System Routing

Buncf automatically scans `src/api/` and `src/pages/` to generate routes:

```
src/
├── api/
│   ├── hello.ts         → GET/POST /api/hello
│   └── users/[id].ts    → GET/PUT/DELETE /api/users/:id
└── pages/
    ├── index.tsx        → /
    ├── about.tsx        → /about
    └── blog/[slug].tsx  → /blog/:slug
```

### API Routes

Export HTTP method handlers from files in `src/api/`:

```typescript
// src/api/users/[id].ts
export function GET(req: Request & { params: { id: string } }) {
  return Response.json({ userId: req.params.id });
}

export function PUT(req: Request & { params: { id: string } }) {
  return Response.json({ updated: req.params.id });
}

export function DELETE(req: Request & { params: { id: string } }) {
  return Response.json({ deleted: req.params.id });
}
```

### Page Routes

Export React components from files in `src/pages/`:

```tsx
// src/pages/blog/[slug].tsx
import { useParams } from 'buncf/router';

export default function BlogPost() {
  const { slug } = useParams();
  return <h1>Post: {slug}</h1>;
}
```

### Hono Integration (Catch-All)

Buncf fully supports [Hono](https://hono.dev/) for more complex API needs.
Create `src/api/[...route].ts` to handle all matching API requests with Hono:

```typescript
// src/api/[...route].ts
import { Hono } from 'hono';
const app = new Hono().basePath('/api');

app.get('/hello', (c) => c.json({ message: 'Hello from Hono!' }));
app.get('/users', (c) => c.json([{ id: 1, name: 'Alice' }]));

// Export Hono's fetch handler directly
export default app.fetch;
```

---

## Custom Error & Loading Pages

Create special files in `src/pages/` (or `src/` root) to customize global states:

- `src/pages/_error.tsx` - Shown when an error occurs during navigation or rendering.
- `src/pages/_loading.tsx` - Shown while a page chunk is loading (SPA navigation).
- `src/pages/_notfound.tsx` - Shown when a route is not found (404).

```tsx
// src/pages/_error.tsx
export default function ErrorPage({ error }: { error: Error }) {
  return (
    <div className="error-container">
      <h1>Custom Error: {error.message}</h1>
      <a href="/">Go Back</a>
    </div>
  );
}
```

```tsx
// src/pages/_loading.tsx
export default function Loading() {
  return <div className="spinner">Loading...</div>;
}
```

```tsx
// src/pages/_notfound.tsx
export default function NotFound() {
  return <h1>404 - Page Not Found</h1>;
}
```

### Nested Layouts

Buncf supports Next.js-style nested layouts.
Create `_layout.tsx` in any directory to wrap all pages within it.

- `src/pages/_layout.tsx` - Wraps everything (Global Layout).
- `src/pages/dashboard/_layout.tsx` - Wraps `/dashboard/*`.

Layouts nest automatically: `Global > Dashboard > Page`.

```tsx
// src/pages/dashboard/_layout.tsx
export const meta = () => [
  { title: 'Dashboard - MyApp' },
  { name: 'robots', content: 'noindex' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-grid">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

### Layout Metadata

Layouts can export a `meta` function to define default metadata for all nested pages.
Supported tags: `title`, `name`, `property`, `charset`, `viewport`, etc.
Inner layouts or pages can override specific tags (last writer wins for unique attributes).

---

## Declarative Middleware

Buncf supports Next.js-style middleware. Create `src/middleware.ts` to intercept requests.

```typescript
// src/middleware.ts
import type { MiddlewareConfig } from 'buncf';

export default [
  {
    name: 'auth-guard',
    matcher: '/api/protected/*', // Supports wildcards
    handler: async (req, next) => {
      const token = req.headers.get('Authorization');
      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }
      return next(); // Proceed to next middleware or route handler
    },
  },
  {
    name: 'logger',
    matcher: '/api/*',
    handler: async (req, next) => {
      console.log(`[${req.method}] ${req.url}`);
      return next();
    },
  },
] satisfies MiddlewareConfig[];
```

---

## Type-Safe API Client (RPC-like)

Buncf auto-generates a typed API client from your endpoints.

### 1. Define Typed Handlers

```typescript
// src/api/users/[id].ts
import { defineHandler } from 'buncf';

interface User {
  id: string;
  name: string;
  email: string;
}

export const GET = defineHandler<{ id: string }, User>((req) => {
  const user = getUser(req.params.id);
  return Response.json(user);
});
```

### 2. Use the Generated Client

```tsx
// src/pages/users/[id].tsx
import { api } from '../.buncf/api-client';
import { useParams } from 'buncf/router';

export default function UserPage() {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Type-safe! Autocomplete shows available routes
    api.get('/api/users/:id', { params: { id } }).then(setUser);
  }, [id]);

  return <div>{user?.name}</div>;
}
```

### Generated Files

| File                    | Description                         |
| ----------------------- | ----------------------------------- |
| `.buncf/api-types.d.ts` | TypeScript interface for all routes |
| `.buncf/api-client.ts`  | Hono-style typed fetch wrapper      |

### Data Loaders

Buncf supports "render-as-you-fetch" with Data Loaders.
Export a `loader` function from your page to fetch data before rendering.
The `_loading.tsx` component will be shown while the loader is running.

```tsx
// src/pages/dashboard.tsx
import { api } from '../.buncf/api-client';

export const loader = async ({ params, query }) => {
  // This runs on the client
  const stats = await api.get('/api/stats');
  return stats;
};

export default function Dashboard({ data }: { data: any }) {
  return <div>Stats: {data.total_users}</div>;
}
```

---

## React Router

Import hooks and components from `buncf/router`:

```tsx
import {
  useRouter,
  useParams,
  useSearchParams,
  usePathname,
  Link,
  BuncfRouter,
} from 'buncf/router';
```

### Available Hooks

| Hook                | Description                                      |
| ------------------- | ------------------------------------------------ |
| `useRouter()`       | Navigation: `push`, `replace`, `back`, `forward` |
| `useParams()`       | Dynamic route params (e.g., `{ id: "123" }`)     |
| `useSearchParams()` | Query string params (`?foo=bar`)                 |
| `usePathname()`     | Current pathname string                          |

### Link Component

```tsx
<Link href="/about">About</Link>
<Link href="/users/1" prefetch>User 1</Link>
```

### Router Provider

Wrap your app with `BuncfRouter` in `client.tsx`:

```tsx
// src/client.tsx
import { BuncfRouter } from 'buncf/router';
import { routes } from './.buncf/routes';
import Layout from './_layout';

createRoot(document.getElementById('root')!).render(
  <BuncfRouter layout={Layout} routes={routes} />,
);
```

---

## Cloudflare Bindings

Access KV, D1, R2, and environment variables with full type support.

### Configuration

```json
// wrangler.json
{
  "name": "my-app",
  "main": "./.buncf/cloudflare/worker.js",
  "compatibility_date": "2025-01-01",
  "assets": {
    "directory": ".buncf/cloudflare/assets",
    "binding": "ASSETS"
  },
  "kv_namespaces": [{ "binding": "MY_KV", "id": "your-kv-id" }],
  "vars": {
    "API_KEY": "secret"
  }
}
```

### Access in Code

```typescript
// src/api/data.ts
import { getCloudflareContext } from 'buncf';

export async function GET() {
  const { env, ctx, cf } = getCloudflareContext();

  // KV access
  const value = await env.MY_KV.get('key');

  // Environment variables
  const apiKey = env.API_KEY;
  // Also available as: process.env.API_KEY

  return Response.json({ value, apiKey });
}
```

### Development with Local Bindings

Buncf uses Miniflare to emulate Cloudflare bindings locally:

```bash
buncf dev          # Local emulation
buncf dev --remote # Live Cloudflare data
```

---

## Static Assets

### Public Folder

Place files in `public/` or `src/public/`:

```
public/
├── favicon.ico
├── logo.svg
└── robots.txt
```

Reference with absolute paths:

```tsx
<img src="/logo.svg" alt="Logo" />
<link rel="icon" href="/favicon.ico" />
```

### Tailwind CSS

Create `src/globals.css`:

```css
@import 'tailwindcss';
```

Import in `src/client.tsx`:

```tsx
import './globals.css';
```

---

## Project Structure

```
my-app/
├── src/
│   ├── index.ts        # Server entry point
│   ├── index.html      # HTML template
│   ├── client.tsx      # Client entry (React)
│   ├── _layout.tsx     # Shared layout component
│   ├── globals.css     # Tailwind/global styles
│   ├── api/            # API routes
│   │   ├── hello.ts
│   │   └── users/
│   │       ├── index.ts
│   │       └── [id].ts
│   └── pages/          # Page components
│       ├── index.tsx
│       ├── about.tsx
│       └── users/
│           └── [id].tsx
├── public/             # Static assets
├── .buncf/             # Generated files (gitignored)
│   ├── routes.ts       # Client route manifest
│   ├── api-types.d.ts  # API type definitions
│   └── api-client.ts   # Typed API client
├── wrangler.json       # Cloudflare config
└── package.json
```

---

## Build Output

After running `buncf build`:

```
.buncf/
├── cloudflare/
│   ├── worker.js       # Bundled worker
│   └── assets/
│       ├── index.html
│       ├── client.js
│       └── globals.css
├── routes.ts           # Client routes
├── api-types.d.ts      # API types
└── api-client.ts       # API client
```

---

## How It Works

1. **Scanning** — CLI scans `src/api/` and `src/pages/` for route files
2. **Type Extraction** — Parses `defineHandler<TParams, TResponse>` for types
3. **Code Generation** — Creates typed client and route manifests
4. **Build** — Bun bundles server and client code
5. **Shim Injection** — Bun APIs polyfilled for Cloudflare Workers
6. **Deploy** — Wrangler uploads worker and assets

---

## Requirements

- **Bun** >= 1.0.0
- **Wrangler** >= 3.0.0 (installed via `bun add wrangler`)
- **Node.js** >= 18 (for Wrangler CLI)

---

## License

MIT © [Francyelton Nobre](https://github.com/francyelton)
