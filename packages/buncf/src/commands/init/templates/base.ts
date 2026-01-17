
export const pkgJson = (name: string, deps: any, devDeps: any) => JSON.stringify({
  name,
  version: "0.1.0",
  private: true,
  type: "module",
  scripts: {
    "dev": "buncf dev",
    "build": "buncf build",
    "deploy": "buncf deploy",
    "types": "buncf types",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  },
  dependencies: deps,
  devDependencies: devDeps
}, null, 2);

export const tsConfig = {
  "compilerOptions": {
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "module": "Preserve",
    "target": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "buncf": ["./node_modules/buncf/src/index.ts"],
      "buncf/router": ["./node_modules/buncf/src/router/react.ts"],
      "$api": ["./.buncf/api-client.ts"],
      "$routes": ["./.buncf/routes.ts"]
    }
  },
  "include": ["src/**/*", "*.d.ts", ".buncf/routes.ts"]
};

export const indexHtml = (title: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="/logo.svg" />
  <title>${title}</title>
  <link rel="stylesheet" href="/globals.css" />
  <script type="module" src="/client.tsx" async></script>
</head>
<body class="bg-background text-foreground antialiased">
  <div id="root"></div>
</body>
</html>
`;

export const clientTsx = (useAuth: boolean) => `
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BuncfRouter } from "buncf/router";
// @ts-ignore - Generated at build time
import { routes, layouts } from "$routes";
import "./globals.css";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <BuncfRouter routes={routes} layouts={layouts} />
  </StrictMode>
);
`;

export const globalsCss = (useTailwind: boolean) => useTailwind ? `
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/* Terminal-themed dark mode trading dashboard */
:root {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
  --radius: 0.75rem;
}

/* Custom vibrant accents for dark theme */
:root {
  --primary: 199 89% 48%;
  /* Vibrant Cyan */
  --primary-foreground: 0 0% 100%;
}

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
}

/* Custom scrollbar for terminal feel */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: oklch(0.1 0 0);
}

::-webkit-scrollbar-thumb {
  background: oklch(0.25 0 0);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: oklch(0.35 0 0);
}
` : `
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: white;
  color: #111;
  padding: 2rem;
}
`;

export const wranglerTemplate = (name: string) => `{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "${name}",
  "main": "./.buncf/cloudflare/worker.js",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "assets": {
    "directory": "./.buncf/cloudflare/assets",
    "binding": "ASSETS"
  },
  "vars": {
    // "ENVIRONMENT": "production"
  },
  "d1_databases": [
    // {
    //   "binding": "DB",
    //   "database_name": "my-db",
    //   "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    // }
  ],
  "kv_namespaces": [
    // {
    //   "binding": "KV",
    //   "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    // }
  ],
  "r2_buckets": [
    // {
    //   "binding": "BUCKET",
    //   "bucket_name": "my-bucket"
    // }
  ]
}
`;
