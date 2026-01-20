# Local Development Bindings (Miniflare & Wrangler)

Buncf uses a hybrid approach to provide Cloudflare Worker bindings (KV, D1, R2, etc.) during local development. This ensures that the code running in `bun buncf dev` behaves exactly as it would on Cloudflare.

## How it works

The core logic resides in `packages/buncf/src/dev.ts` within the `initBuncfDev` function. It operates with a specific priority to ensure maximum stability and performance.

### 1. Direct Miniflare (Priority 1)

For local development (without the `--remote` flag), Buncf prioritizes initializing **Miniflare 3** directly.

- **Why**: Direct initialization is significantly faster and more stable than going through the Wrangler CLI wrapper. It avoids common "hangs" and port conflicts often associated with `getPlatformProxy`.
- **Implementation**:
  - It scans for `wrangler.jsonc`, `wrangler.json`, or `wrangler.toml`.
  - Parses the configuration (including TOML parsing for KV, D1, and R2 bindings).
  - Instantiates a `Miniflare` class with the detected bindings and persistence settings (e.g., `.wrangler/state/v3/d1`).
  - Returns the `env` bindings directly.

### 2. Wrangler getPlatformProxy (Fallback / Remote)

If direct Miniflare fails (e.g., missing dependencies) or if the `--remote` flag is used, it falls back to Wrangler's official proxy mechanism.

- **getPlatformProxy**: This is the standard Cloudflare way to get bindings. In Buncf, we added a **5-second timeout** to this call to prevent the dev server from hanging indefinitely if Wrangler becomes unresponsive.
- **Remote Mode**: When `--remote` is passed, `getPlatformProxy` is used to connect to your live Cloudflare resources.

### 3. ASSETS Polyfill

Since Buncf runs the development server using `Bun.serve`, the `ASSETS` binding (used for static assets in Cloudflare Pages) is polyfilled manually.

- Each request to `env.ASSETS.fetch(req)` is intercepted.
- It looks for files in `.buncf/cloudflare/assets`.
- It implements SPA fallback (serving `index.html` for non-existent routes) to match the behavior of Cloudflare Pages.

## Usage in code

The development context is initialized in the `boot.ts` generator. To ensure stability, the user's worker code is imported **dynamically** after the bindings are ready:

```typescript
// boot.ts
await initBuncfDev({ remote });

// Only import worker AFTER bindings are stabilized
const { default: worker } = await import('./dev.js');
```

This prevents any Top-Level Await in plugins or user code from executing before the Cloudflare environment is fully emulated.
