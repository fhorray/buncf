# buncf

> Deploy Bun applications to Cloudflare Workers with zero configuration

[![npm version](https://img.shields.io/npm/v/buncf.svg)](https://www.npmjs.com/package/buncf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 **Zero Config** — Write Bun code, deploy to Cloudflare Workers
- 🔄 **Bun.serve Compatibility** — Use familiar `Bun.serve()` API
- 📁 **File-System Routing** — Next.js-style pages and API routes
- 🔐 **Cloudflare Bindings** — Full support for KV, D1, R2, and environment variables
- 🎯 **Type-Safe API Client** — Auto-generated typed client for API routes (RPC-like)
- ⚛️ **React Router** — Built-in hooks and Link component for SPA navigation
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

| Command        | Description                                      |
| -------------- | ------------------------------------------------ |
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
import { useParams } from "buncf/router";

export default function BlogPost() {
  const { slug } = useParams();
  return <h1>Post: {slug}</h1>;
}
```

---

## Type-Safe API Client (RPC-like)

Buncf auto-generates a typed API client from your endpoints.

### 1. Define Typed Handlers

```typescript
// src/api/users/[id].ts
import { defineHandler } from "buncf";

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
import { api } from "../.buncf/api-client";
import { useParams } from "buncf/router";

export default function UserPage() {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Type-safe! Autocomplete shows available routes
    api.get("/api/users/:id", { params: { id } }).then(setUser);
  }, [id]);

  return <div>{user?.name}</div>;
}
```

### Generated Files

| File                   | Description                          |
| ---------------------- | ------------------------------------ |
| `.buncf/api-types.d.ts` | TypeScript interface for all routes  |
| `.buncf/api-client.ts`  | Hono-style typed fetch wrapper       |

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
  BuncfRouter 
} from "buncf/router";
```

### Available Hooks

| Hook                | Description                                |
| ------------------- | ------------------------------------------ |
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
import { BuncfRouter } from "buncf/router";
import { routes } from "./.buncf/routes";
import Layout from "./_layout";

createRoot(document.getElementById("root")!).render(
  <BuncfRouter layout={Layout} routes={routes} />
);
```

---

## Cloudflare Bindings

Access KV, D1, R2, and environment variables with full type support.

### Configuration

```jsonc
// wrangler.jsonc
{
  "name": "my-app",
  "main": "./.buncf/cloudflare/worker.js",
  "compatibility_date": "2025-01-01",
  "assets": {
    "directory": ".buncf/cloudflare/assets",
    "binding": "ASSETS"
  },
  "kv_namespaces": [
    { "binding": "MY_KV", "id": "your-kv-id" }
  ],
  "vars": {
    "API_KEY": "secret"
  }
}
```

### Access in Code

```typescript
// src/api/data.ts
import { getCloudflareContext } from "buncf";

export async function GET() {
  const { env, ctx, cf } = getCloudflareContext();
  
  // KV access
  const value = await env.MY_KV.get("key");
  
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
@import "tailwindcss";
```

Import in `src/client.tsx`:

```tsx
import "./globals.css";
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
├── wrangler.jsonc      # Cloudflare config
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
