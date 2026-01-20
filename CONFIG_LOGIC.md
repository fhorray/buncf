# Buncf Configuration Logic (`buncf.config.ts`)

This document explains the technical implementation and runtime behavior of the `buncf.config.ts` system.

## Overview

Buncf uses an optional configuration file (`buncf.config.ts`) located at the project root to allow users to customize the build process, primarily by injecting [Bun Plugins](https://bun.sh/docs/runtime/plugins). This approach keeps the core CLI generic while enabling powerful extensions like Tailwind CSS processing.

## Implementation Details

### 1. Dynamic Loading

The configuration is loaded using a utility located at `packages/buncf/src/utils/config.ts`.

Key features:

- **Location**: It searches for `buncf.config.ts` in the current working directory (`process.cwd()`).
- **Dynamic Import**: Uses ESM `import()` to load the file, allowing it to contain any valid TypeScript/JavaScript.
- **Cache Busting**: During development and testing, a timestamp and a random string are appended to the import URL (`?t=...&r=...`) to ensure that changes to the config file are picked up immediately without restarting the process.

### 2. Integration with Build Process

The `loadConfig` utility is called in two main command handlers:

- `packages/buncf/src/commands/dev.ts`
- `packages/buncf/src/commands/build.ts`

#### Plugin Merging

When `buncf dev` or `buncf build` is executed:

1.  Buncf calls `loadConfig()`.
2.  Any plugins found in the `plugins` array of the exported configuration are extracted.
3.  These user-defined plugins are spread into the `plugins` array of the `Bun.build` call for both the **Client** and **CSS** bundles (and Server if applicable).

```typescript
// Internal logic simplified
const config = await loadConfig();
const userPlugins = config.plugins || [];

await Bun.build({
  // ... core config
  plugins: [...userPlugins, buncfCorePlugin()],
});
```

### 3. Runtime Identification

The `buncf.config.ts` file is **strictly a build-time configuration**. It is identified by the CLI when running commands.

- **Dev Mode**: The config is re-loaded whenever a build is triggered.
- **Build Mode**: The config is loaded once at the start of the build process.

It is **not** bundled into the final worker code. If you need runtime configuration (like API keys), use `wrangler.json` (environment variables) or the `buncf/bindings` system.

## Example: Tailwind CSS

Without `buncf.config.ts`, Buncf handles `.css` files as raw assets. By adding the following config, the `bun-plugin-tailwind` intercepts `.css` loads and processes the `@tailwind` directives.

```typescript
// buncf.config.ts
import { tailwind } from 'bun-plugin-tailwind';

export default {
  plugins: [tailwind],
};
```

## Troubleshooting

- **Config not loading**: Ensure the file is named exactly `buncf.config.ts` and is in the same directory where you run `bun buncf dev`.
- **Plugin conflicts**: Buncf core plugins generally run after user plugins to ensure that transformations like Tailwind are applied before Buncf processes the assets.
