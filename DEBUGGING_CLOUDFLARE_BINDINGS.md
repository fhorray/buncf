# Debugging Cloudflare Bindings (KV, D1, Env Vars)

This document explains the resolution of the issue where Cloudflare bindings (like `env.MY_KV`) and environment variables (`process.env`) were returning `undefined` in production, despite working locally.

## The Problem

The root cause was a combination of **Context Isolation** and **Context Shadowing** within the `buncf` runtime wrapper.

### 1. Context Isolation (Instance Mismatch)
The `bunToCloudflare` plugin was injecting a duplicate copy of the `context.ts` code directly into the bundled worker. 
At the same time, the user's application (API routes) was importing the same context logic from the `buncf` package in `node_modules`.

Because `AsyncLocalStorage` depends on a singleton instance to track state, having two identical but separate copies of the code created two isolated "storage buckets". The runtime was putting the Cloudflare environment into one bucket, but the application was trying to read from the other (empty) one.

### 2. Context Shadowing (Dev Mode in Prod)
The `createApp()` function had a guard to provide a mock context during local development:

```typescript
// OLD INCORRECT LOGIC in router/index.ts
async function fetch(req: Request) {
  if (process.env.NODE_ENV !== "production") {
    // This block was executing in production!
    return runWithCloudflareContext({ env: {}, ... }, () => handleRequest(req));
  }
  return handleRequest(req);
}
```

Because `process.env.NODE_ENV` was not being explicitly inlined as `"production"` during the build, this block executed even on Cloudflare Workers. It initiated a **second** context run with an **empty** environment, effectively shadowing the correct context initiated by the main runtime wrapper.

---

## The Solution

### 1. Unifying the Context Instance
We stopped injecting the context code and modified the plugin to rewrite the runtime's internal imports to point to the official `buncf` package. This ensures that only one instance of `AsyncLocalStorage` exists in the entire bundle.

**Modified `plugin.ts`:**
```typescript
// From injection to module import
runtimeCode = runtimeCode.replace(
  "import { runWithCloudflareContext } from './context';",
  'import { runWithCloudflareContext } from "buncf";'
);
```

### 2. Explicit Production Inlining
We updated the CLI build process to force the inlining of `NODE_ENV`. This allows the Bun compiler to "dead-code eliminate" the development-only blocks during the build.

**Modified `cli.ts`:**
```typescript
// forcing production status
define: {
  "process.env.NODE_ENV": JSON.stringify("production"),
  "process.env": "globalThis.process.env",
}
```

### 3. Context Guarding
Added a check in `createApp` to prevent overwriting an existing valid context.

**Modified `router/index.ts`:**
```typescript
async function fetch(req: Request) {
  if (process.env.NODE_ENV !== "production") {
    const existing = getCloudflareContext();
    // NEVER overwrite if we already have a real environment
    if (existing && Object.keys(existing.env).length > 0) {
      return handleRequest(req, new URL(req.url));
    }
    // ... local dev logic ...
  }
  return handleRequest(req);
}
```

---

## Result
After these changes, the `wrangler tail` logs confirmed:
1. `runWithCloudflareContext` is called once by the runtime with all bindings (`MY_KV`, `ASSETS`, etc.).
2. The `createApp` dev-block is correctly ignored.
3. API routes successfully retrieve the bindings via `getCloudflareContext()`.

**Example of working API:**
```typescript
export async function GET(req: Request) {
  const { env } = getCloudflareContext();
  await env.MY_KV.put("status", "working"); // Success!
  return Response.json({ status: "ok" });
}
```
