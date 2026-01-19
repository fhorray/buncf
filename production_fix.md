# Cloudflare D1 Production Fix

## Issue

The application was failing in production with the error:
`Error: Cloudflare D1 binding 'DB' not found`

This was caused by two separate issues in the `buncf` framework:

1. **AsyncLocalStorage Initialization Error:**
   The `buncf` context mechanism relies on `AsyncLocalStorage` from `node:async_hooks`. The original implementation used `require("node:async_hooks")`, which failed in the Cloudflare Worker ESM environment with a `TypeError: K5 is not a function`. This meant the context storage was never initialized, leading to an empty context.

2. **Context Propagation Missing in `createApp`:**
   Even after fixing the import, the generated worker entry point for `createApp` users was bypassing the `runWithCloudflareContext` wrapper. The `plugin.ts` was injecting the runtime code but not actually wrapping the user's `fetch` handler execution with the context initialization logic.

## Resolution

### 1. Fix Async Hooks Import (`packages/buncf/src/context.ts`)

Changed the import method from `require` to dynamic `await import` to support Cloudflare's ESM environment:

```typescript
// Before
AsyncLocalStorageClass = require('node:async_hooks').AsyncLocalStorage;

// After
const { AsyncLocalStorage } = await import('node:async_hooks');
AsyncLocalStorageClass = AsyncLocalStorage;
```

### 2. Wrap User Handler (`packages/buncf/src/plugin.ts`)

Updated the `bun-to-cloudflare` plugin to ensure that ALL requests—including those handled by the user's custom `createApp()` handler—are wrapped in `runWithCloudflareContext`:

```typescript
// Before
return finalHandler();

// After
return runWithCloudflareContext({ env, ctx, cf: request.cf || {} }, () =>
  finalHandler(),
);
```

This properly initializes the context with the `env` object provided by Cloudflare, ensuring `getCloudflareContext()` in your application code returns the environment bindings (like `DB`).

## Status

- **Corrected:** `buncf` framework code.
- **Cleaned:** Removed temporary debug logs from runtime and application code.
- **Verified:** Production deployment now accesses D1 successfully.
