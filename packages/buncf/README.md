# buncf

> Deploy Bun applications to Cloudflare Workers with zero configuration

[![npm version](https://img.shields.io/npm/v/buncf.svg)](https://www.npmjs.com/package/buncf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 **Zero Config** - Just write Bun code, deploy to Cloudflare
- 🔄 **Bun.serve Compatibility** - Use familiar `Bun.serve()` API
- 📁 **File-System Routing** - Next.js-style pages and API routes (optional)
- 🎨 **Tailwind Support** - Built-in CSS processing
- 📦 **Public Folder** - Next.js-style `/public` directory support
- ⚡ **Fast Builds** - Powered by Bun's native bundler
- ⚛️ **React Hooks** - useRouter, useParams, Link component

## Installation

```bash
bun add buncf
```

## Routing Options

Buncf supports **two routing modes**. Choose what fits your project:

### Option 1: File-System Routing (Recommended)

Auto-generate routes from your file structure:

```typescript
// src/index.ts
import { serve } from 'bun';
import { createApp } from 'buncf';

serve(createApp()); // Auto-scans src/api and src/pages
```

```
src/
├── api/
│   ├── hello.ts         → /api/hello
│   └── users/[id].ts    → /api/users/:id
└── pages/
    ├── index.tsx        → /
    └── blog/[slug].tsx  → /blog/:slug
```

### Option 2: Manual Routing

Define routes explicitly (original Bun.serve style):

```typescript
// src/index.ts
import { serve } from 'bun';
import html from './index.html';

serve({
  routes: {
    '/': html,
    '/api/hello': () => Response.json({ message: 'Hello' }),
    '/api/users/:id': (req) => Response.json({ id: req.params.id }),
  },
});
```

## File-System API Routes

Create files in `src/api/`. Export HTTP method handlers:

```typescript
// src/api/users/[id].ts
export function GET(req: Request) {
  return Response.json({ user: req.params.id });
}

export function POST(req: Request) {
  return Response.json({ created: true });
}

export function DELETE(req: Request) {
  return Response.json({ deleted: req.params.id });
}
```

## React Hooks (Client-Side)

Import from `buncf/router`:

```tsx
import { useRouter, useParams, useSearchParams, Link } from 'buncf/router';

function MyPage() {
  const router = useRouter();
  const { slug } = useParams();
  const [query, setQuery] = useSearchParams();

  return (
    <div>
      <p>Current path: {router.pathname}</p>
      <p>Slug: {slug}</p>
      <Link href="/about">About</Link>
      <button onClick={() => router.push('/')}>Go Home</button>
    </div>
  );
}
```

### Available Hooks

| Hook                | Description                       |
| ------------------- | --------------------------------- |
| `useRouter()`       | Navigation: push, replace, back   |
| `useParams()`       | Dynamic route params (e.g., [id]) |
| `useSearchParams()` | URL query string (?foo=bar)       |
| `usePathname()`     | Current pathname                  |

## CLI Commands

| Command        | Description                        |
| -------------- | ---------------------------------- |
| `buncf init`   | Scaffold new project               |
| `buncf dev`    | Development server with hot reload |
| `buncf build`  | Build for production               |
| `buncf deploy` | Build and deploy to Cloudflare     |

## Static Assets

### Public Folder

Place files in `public/` or `src/public/`. Reference with absolute paths:

```tsx
<img src="/logo.svg" />
<link rel="stylesheet" href="/styles.css" />
```

### Tailwind CSS

Import your CSS in `client.tsx`:

```tsx
import './globals.css'; // Contains @import "tailwindcss"
```

## Project Structure

```
my-app/
├── src/
│   ├── index.ts      # Server entry
│   ├── index.html    # HTML template
│   ├── client.tsx    # Client entry (React)
│   ├── globals.css   # Tailwind styles
│   ├── api/          # API routes (optional)
│   │   └── hello.ts
│   ├── pages/        # Page components (optional)
│   │   └── index.tsx
│   └── public/       # Static assets
│       └── logo.svg
├── wrangler.jsonc
└── package.json
```

## Wrangler Config

```jsonc
// wrangler.jsonc
{
  "name": "my-app",
  "main": "./.buncf/worker.js",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".buncf/assets",
    "binding": "ASSETS",
  },
}
```

## How It Works

1. **Build Phase**: `buncf build` transforms your Bun code into Cloudflare-compatible workers
2. **Asset Handling**: HTML/CSS/images are copied to `.buncf/assets`
3. **Runtime Shim**: `Bun.serve()` is polyfilled to work on Cloudflare Workers
4. **Deploy**: Wrangler uploads your worker and assets to Cloudflare

## Requirements

- Bun >= 1.0.0
- Wrangler (installed via `bun add wrangler`)

## License

MIT
