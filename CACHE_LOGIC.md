# Buncf Global Cache Logic

Buncf implements a multi-layered caching strategy designed for maximum performance on Cloudflare Workers and browsers. This document explains the technical choices and how they work together.

## 🛠️ Performance Architecture

### 1. Asset Hashing (Cache Busying)

During the production build, every client-side chunk and asset (CSS, images, JS) is generated with a content-based hash:
`[name]-[hash].[ext]` (e.g., `chunk-abc123.js`).

**Why?**
If the content of a file changes, the filename changes. This makes the filename a unique identifier for a specific version of the code, allowing us to tell the browser it can cache the file "forever" without worrying about users seeing outdated code.

### 2. Aggressive HTTP Headers

The Buncf router automatically injects optimized `Cache-Control` headers into responses based on the file's location and type.

| Path        | Header                                | Strategy                                                                                  |
| :---------- | :------------------------------------ | :---------------------------------------------------------------------------------------- |
| `.buncf/**` | `public, max-age=31536000, immutable` | **Immutable Cache**: 1 year. Since these files are hashed, they never need re-validation. |
| `public/**` | `public, max-age=31536000, immutable` | **Immutable Cache**: Assumes user-provided static assets are stable or versioned.         |
| Others      | `public, max-age=3600`                | **Optimistic Cache**: 1 hour. Safe for less critical or frequently changing assets.       |

### 3. Code Splitting & Granular Caching

Instead of one giant `client.js`, Buncf splits your app into multiple chunks.

- **Shared Chunks**: Libraries like React/DOM stay in their own chunks.
- **Page Chunks**: Logic for specifically `/about` or `/dashboard` is loaded on demand.

**Why?**
When you change the color of a button on the Home page, the browser only needs to download the modified Home page chunk. The giant React chunk stays in the browser's cache, saving bandwidth and speed!

### 4. Zero-Friction Hydration

Even with aggressive caching, Buncf ensures search engines see your content.

- The **initial load** is server-rendered (SSR) by the Worker.
- Subsequent navigations are handled by the cached JS, providing an SPA (Single Page Application) feel with zero server round-trips for logic.

## 🚀 Impact on Cloudflare Workers

Because most assets are served from the browser's local cache or Cloudflare's Edge Cache (CDN), your Worker's CPU time is preserved for what matters: **Executing your Business Logic and API calls.**

---

_Buncf: Built for speed, scaled for the edge._
