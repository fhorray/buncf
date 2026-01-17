#!/usr/bin/env bun
import { spawn } from "bun";
import { bunToCloudflare } from "./plugin";
// Lazy loaded: generateAllApiTypes (imported dynamically in build/dev commands)
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

// Package version (sync with package.json)
const VERSION = "0.1.0";

const log = {
  info: (msg: string) => console.log(chalk.blue(`ℹ `) + msg),
  success: (msg: string) => console.log(chalk.green(`✓ `) + msg),
  warn: (msg: string) => console.log(chalk.yellow(`⚠ `) + msg),
  error: (msg: string) => console.error(chalk.red(`✗ `) + msg),
  step: (msg: string) => console.log(chalk.dim(`[${new Date().toLocaleTimeString()}] `) + chalk.cyan(msg)),
  title: (msg: string) => console.log("\n" + chalk.bold.cyan(msg) + "\n"),
};

const showBanner = () => {
  console.log(chalk.cyan(`
   __                            ___ 
  |  |--.--.--.-----..----.----.|  _|
  |  _  |  |  |     ||  __|  __||  _|
  |_____|_____|__|__||____|____||_|  v${VERSION} (DEV-MANUAL-SCAN)
  ${chalk.dim("Build & Deploy Bun to Cloudflare Workers")}
`));
};

// Parse command and flags
const args = Bun.argv.slice(2);
const command = args.find(arg => !arg.startsWith("-"));
const flags = {
  help: args.includes("--help") || args.includes("-h"),
  version: args.includes("--version") || args.includes("-v"),
  verbose: args.includes("--verbose"),
};

// Default entrypoint search
const entrypoints = ["./src/index.ts", "./index.ts", "./src/index.js", "./index.js"];

// Help text
const showHelp = () => {
  showBanner();
  console.log(`
${chalk.bold("USAGE")}
  ${chalk.cyan("buncf")} <command> [options]

${chalk.bold("COMMANDS")}
  ${chalk.cyan("init")}        Scaffold a new project
  ${chalk.cyan("build")}       Build for production
  ${chalk.cyan("deploy")}      Build and deploy to Cloudflare Workers
  ${chalk.cyan("dev")}         Start development server with bindings

${chalk.bold("OPTIONS")}
  ${chalk.yellow("-h, --help")}      Show this help message
  ${chalk.yellow("-v, --version")}   Show version number
  ${chalk.yellow("--verbose")}       Enable verbose output
  ${chalk.yellow("--remote")}        Use remote Cloudflare bindings in dev

${chalk.bold("EXAMPLES")}
  ${chalk.dim("$")} buncf init               Create new project
  ${chalk.dim("$")} buncf build              Build production bundle
  ${chalk.dim("$")} buncf deploy             Deploy to Cloudflare
  ${chalk.dim("$")} buncf dev --remote       Dev with live data

${chalk.bold("LEARN MORE")}
  Documentation: ${chalk.underline.blue("https://github.com/fhorray/buncf")}
`);
};

// Function handle init command
async function initProject(projectNameArg?: string) {
  console.clear();
  showBanner();

  let projectName = projectNameArg;
  let template = "default";

  if (!projectName) {
    const readline = require("node:readline").createInterface({
      input: process.stdin,
      output: process.stdout
    });

    projectName = await new Promise(resolve => {
      readline.question(chalk.cyan("  What is your project named? ") + chalk.dim("(my-buncf-app) "), (answer: string) => {
        resolve(answer.trim() || "my-buncf-app");
      });
    });

    template = await new Promise(resolve => {
      readline.question(chalk.cyan("  Which template would you like to use? ") + chalk.dim("(default/hono) "), (answer: string) => {
        readline.close();
        const t = answer.trim().toLowerCase();
        resolve(t === "hono" ? "hono" : "default");
      });
    });
  }

  console.log("");
  const projectDir = projectName === "." ? process.cwd() : path.join(process.cwd(), projectName!);
  const isCurrentDir = projectName === ".";

  // Step 1: Create directory
  console.log(chalk.cyan("  Creating project structure..."));
  console.log("");

  if (!isCurrentDir && !fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  const dirs = ["src", "src/api", "src/pages", "public"];
  for (const dir of dirs) {
    const fullPath = path.join(projectDir, dir);
    if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
  }

  // Generate all files
  const files: { path: string; content: string }[] = [];

  const dependencies: Record<string, string> = {
    react: "^19.0.0",
    "react-dom": "^19.0.0",
    "bun-plugin-tailwind": "latest"
  };

  if (template === "hono") {
    dependencies["hono"] = "latest";
  }

  // package.json
  files.push({
    path: "package.json",
    content: JSON.stringify({
      name: isCurrentDir ? path.basename(process.cwd()) : projectName,
      module: "src/index.ts",
      type: "module",
      scripts: {
        dev: "bun buncf dev",
        build: "bun buncf build",
        deploy: "bun buncf deploy",
        "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
      },
      devDependencies: {
        buncf: "latest",
        wrangler: "latest",
        miniflare: "latest",
        "@types/bun": "latest",
        "@types/react": "latest",
        "@types/react-dom": "latest"
      },
      dependencies
    }, null, 2)
  });

  // wrangler.jsonc
  files.push({
    path: "wrangler.jsonc",
    content: JSON.stringify({
      name: isCurrentDir ? path.basename(process.cwd()) : projectName,
      main: "./.buncf/cloudflare/worker.js",
      compatibility_date: new Date().toISOString().split("T")[0],
      compatibility_flags: ["nodejs_compat"],
      assets: { directory: ".buncf/cloudflare/assets", binding: "ASSETS" }
    }, null, 2)
  });

  // tsconfig.json
  files.push({
    path: "tsconfig.json",
    content: JSON.stringify({
      compilerOptions: {
        lib: ["ESNext", "DOM"],
        target: "ESNext",
        module: "Preserve",
        moduleDetection: "force",
        jsx: "react-jsx",
        allowJs: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        verbatimModuleSyntax: true,
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        noFallthroughCasesInSwitch: true,
        types: ["./cloudflare-env.d.ts", "./buncf-env.d.ts"],
        baseUrl: ".",
        paths: {
          "$api": ["./.buncf/api-client.ts"],
          "$routes": ["./.buncf/routes.ts"]
        }
      }
    }, null, 2)
  });

  // buncf-env.d.ts
  files.push({
    path: "buncf-env.d.ts",
    content: `/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

// Generated by buncf init

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.webp" {
  const content: string;
  export default content;
}

declare module "*.gif" {
  const content: string;
  export default content;
}

declare module "*.html" {
  const content: string;
  export default content;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

/**
 * Buncf Type Augmentation
 * 
 * This file connects your wrangler-generated CloudflareEnv types to buncf.
 * It will NOT be overwritten by \`bun cf-typegen\`.
 */

// Import something from buncf to make this a module augmentation, not ambient declaration
import type {} from "buncf";

declare module "buncf" {
  // Augment the type registry to use your CloudflareEnv
  interface BuncfTypeRegistry {
    env: CloudflareEnv;
  }
}
`
  });

  // .gitignore
  files.push({
    path: ".gitignore",
    content: `.buncf
node_modules
dist
      .env
      .env.local
      `
  });

  // src/index.ts
  files.push({
    path: "src/index.ts",
    content: `import { createApp } from "buncf";

  export default createApp({
    indexHtml: "./src/index.html"
  });
  `
  });

  // src/index.html
  files.push({
    path: "src/index.html",
    content: `< !DOCTYPE html >
    <html lang="en" >
      <head>
      <meta charset="UTF-8" >
        <meta name="viewport" content = "width=device-width, initial-scale=1.0" >
          <title>Buncf App </title>
            < link rel = "stylesheet" href = "./globals.css" >
              </head>
              < body >
              <div id="root" > </div>
                < script type = "module" src = "./client.tsx" > </script>
                  </body>
                  </html>
                    `
  });

  // src/globals.css
  files.push({
    path: "src/globals.css",
    content: `@import "tailwindcss";

:root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }

body {
    background: var(--background);
    color: var(--foreground);
    font - family: system - ui, -apple - system, sans - serif;
  }
  `
  });

  // src/client.tsx
  files.push({
    path: "src/client.tsx",
    content: `import { StrictMode } from "react";
  import { createRoot } from "react-dom/client";
  import { BuncfRouter } from "buncf/router";
  import { routes } from "$routes";
  import "./globals.css";

  function Layout({ children }: { children: React.ReactNode }) {
    return (
      <div className= "min-h-screen bg-gradient-to-br from-gray-900 to-black text-white" >
      <nav className="border-b border-gray-800 px-6 py-4" >
        <span className="font-bold text-xl" >🔥 Buncf </span>
          </nav>
          < main className = "container mx-auto px-6 py-12" >
            { children }
            </main>
            </div>
  );
  }

  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      <StrictMode>
      <BuncfRouter layout={ Layout } routes = { routes } />
      </StrictMode>
    );
  }
  `
  });

  // src/pages/index.tsx
  files.push({
    path: "src/pages/index.tsx",
    content: `import { Link } from "buncf/router";

  export default function HomePage() {
    return (
      <div className= "max-w-2xl" >
      <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent" >
        Welcome to Buncf
          </h1>
          < p className = "text-xl text-gray-400 mb-8" >
            Build and deploy Bun applications to Cloudflare Workers with zero configuration.
      </p>
              < div className = "flex gap-4" >
                <Link href="/about" className = "px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition" >
                  Learn More
                    </Link>
                    < a href = "/api/hello" className = "px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-medium transition" >
                      Try API →
    </a>
      </div>
      </div>
  );
  }
  `
  });

  // src/pages/about.tsx
  files.push({
    path: "src/pages/about.tsx",
    content: `import { Link } from "buncf/router";

  export default function AboutPage() {
    return (
      <div className= "max-w-2xl" >
      <Link href="/" className = "text-cyan-400 hover:underline mb-4 inline-block" >← Back </Link>
        < h1 className = "text-4xl font-bold mb-4" > About Buncf </h1>
          < p className = "text-gray-400" >
            Buncf is a framework for deploying Bun applications to Cloudflare Workers.
        It provides file - system routing, React support, and type - safe API clients.
      </p>
      </div>
  );
  }
  `
  });

  // src/api/hello.ts OR src/api/[...route].ts
  if (template === "hono") {
    // Hono Template
    files.push({
      path: "src/api/[...route].ts",
      content: `import { Hono } from 'hono';

const app = new Hono().basePath('/api');

app.get('/hello', (c) => {
  return c.json({
    message: 'Hello form Hono inside Buncf!',
    path: c.req.path
  });
});

app.get('/users/:id', (c) => {
    return c.json({
        id: c.req.param('id'),
        source: 'Hono'
    });
});

// Catch-all for other Hono routes
app.all('*', (c) => {
    return c.json({ error: 'Not Found in Hono' }, 404);
});

export default app.fetch;
`
    });
  } else {
    // Default Template
    files.push({
      path: "src/api/hello.ts",
      content: `import { defineHandler } from "buncf";

interface HelloResponse {
  message: string;
  timestamp: string;
}

export const GET = defineHandler<{}, HelloResponse>((req) => {
  return Response.json({
    message: "Hello from Buncf API!",
    timestamp: new Date().toISOString()
  });
});
`
    });
  }

  // README.md
  files.push({
    path: "README.md",
    content: `# ${projectName}

Created with [Buncf](https://github.com/fhorray/buncf).

## Quick Start

    \`\`\`bash
bun dev      # Start development server
bun build    # Build for production
bun deploy   # Deploy to Cloudflare
\`\`\`

## Project Structure

\`\`\`
├── src/
│   ├── api/        # API routes
│   ├── pages/      # Page components
│   ├── client.tsx  # Client entry
│   └── index.ts    # Server entry
├── public/         # Static assets
└── wrangler.jsonc  # Cloudflare config
\`\`\`
`
  });

  // Write all files
  for (const file of files) {
    fs.writeFileSync(path.join(projectDir, file.path), file.content);
  }

  // Display tree
  console.log(chalk.dim("  " + (isCurrentDir ? "./" : projectName + "/")));
  const tree = [
    "├── src/",
    "│   ├── api/",
    "│   │   └── hello.ts",
    "│   ├── pages/",
    "│   │   ├── index.tsx",
    "│   │   └── about.tsx",
    "│   ├── client.tsx",
    "│   ├── globals.css",
    "│   ├── index.html",
    "│   └── index.ts",
    "├── public/",
    "├── package.json",
    "├── tsconfig.json",
    "├── wrangler.jsonc",
    "└── README.md"
  ];
  for (const line of tree) {
    console.log(chalk.dim("  " + line));
  }
  console.log("");

  // Step 2: Install dependencies
  console.log(chalk.cyan("  Installing dependencies..."));
  console.log("");

  try {
    const { spawnSync } = require("node:child_process");
    spawnSync("bun", ["install"], { cwd: projectDir, stdio: "inherit" });
    console.log("");
  } catch (e) {
    log.warn("Could not install dependencies. Run 'bun install' manually.");
  }

  // Step 3: Initialize git
  console.log(chalk.cyan("  Initializing git repository..."));
  try {
    const { spawnSync } = require("node:child_process");
    spawnSync("git", ["init"], { cwd: projectDir, stdio: "ignore" });
    spawnSync("git", ["add", "."], { cwd: projectDir, stdio: "ignore" });
    console.log(chalk.green("  ✓") + " Git repository initialized");
  } catch (e) {
    // Git not available, skip
  }

  // Final output
  console.log("");
  console.log(chalk.green.bold("  ✨ Success!") + " Created " + chalk.cyan(projectName) + " at " + chalk.dim(projectDir));
  console.log("");
  console.log("  Next steps:");
  console.log("");
  if (!isCurrentDir) {
    console.log("    " + chalk.cyan("cd") + " " + projectName);
  }
  console.log("    " + chalk.cyan("bun dev") + "       Start development server");
  console.log("    " + chalk.cyan("bun build") + "     Build for production");
  console.log("    " + chalk.cyan("bun deploy") + "    Deploy to Cloudflare");
  console.log("");
  console.log("  " + chalk.dim("Documentation: https://github.com/fhorray/buncf"));
  console.log("");
}



// Helper to generate client routes manifest
async function generateRoutesManifest() {
  log.step("🗺️ Generating client routes manifest (.buncf/routes.ts)...");
  try {
    const pagesDir = path.resolve(process.cwd(), "src/pages");
    let routeEntries: string[] = [];

    if (fs.existsSync(pagesDir)) {
      // const router = new Bun.FileSystemRouter({
      //   dir: pagesDir,
      //   style: "nextjs"
      // }); 
      // Manual Scan to bypass Bun Router caching issues on Windows
      const glob = new Bun.Glob("**/*.{tsx,jsx,ts,js}");
      const files = Array.from(glob.scanSync({ cwd: pagesDir, onlyFiles: true }));
      console.log(`[debug] pagesDir: ${pagesDir}`);
      console.log(`[debug] Found ${files.length} page files via glob:`, files);

      routeEntries = files.map((file) => {
        const absFile = path.resolve(pagesDir, file);
        // Generate Route Key manually
        // 1. Remove extension
        let routePath = file.replace(/\.(tsx|jsx|ts|js)$/, "");
        // 2. Handle index
        if (routePath.endsWith("index")) routePath = routePath.slice(0, -5);
        if (routePath.endsWith("/")) routePath = routePath.slice(0, -1);
        // 3. Normalize slashes
        routePath = "/" + routePath.split(path.sep).join("/");
        // 4. Ensure root is / not //
        if (routePath === "") routePath = "/";
        if (routePath.length > 1 && routePath.endsWith("/")) routePath = routePath.slice(0, -1);
        // Fix double slashes if any (e.g. /users/index -> /users/)
        routePath = routePath.replace(/\/+/g, "/");

        // Debug
        // console.log(`  Manual Route: ${routePath} -> ${file}`);

        const relPath = path.relative(".buncf", absFile).split(path.sep).join(path.posix.sep);
        const importPath = relPath.startsWith(".") ? relPath : `./${relPath}`;
        return `  "${routePath}": () => import("${importPath}")`;
      });
    }

    const routesContent = `
/**
 * Auto-generated by buncf
 * Do not edit this file manually
 */
import { type ComponentType } from "react";

export const routes: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
${routeEntries.join(",\n")}
};

 // Type Augmentation for Routes
declare module "buncf" {
  interface BuncfTypeRegistry {
    routes: {
${routeEntries.map(e => e.split(":")[0]).filter(key => !key?.includes("[")).map(key => `      ${key}: true;`).join("\n")}
    };
  }
}
`;
    if (!fs.existsSync(".buncf")) fs.mkdirSync(".buncf");
    await Bun.write(".buncf/routes.ts", routesContent);
  } catch (e) {
    console.error("Failed to generate routes manifest:", e);
  }
}

// Reusable Build Function
const build = async (entrypoint: string) => {
  // Copy public folder to assets (Next.js-like behavior)
  const publicFolders = ["./src/public", "./public"];
  for (const publicFolder of publicFolders) {
    try {
      const glob = new Bun.Glob("**/*");
      const files = glob.scanSync({ cwd: publicFolder, onlyFiles: true });
      let copied = 0;
      for (const file of files) {
        const src = `${publicFolder}/${file}`;
        const dest = `./.buncf/cloudflare/assets/${file}`;
        await Bun.write(dest, Bun.file(src));
        copied++;
      }
      if (copied > 0) {
        log.step(`📁 Copied ${copied} files from ${publicFolder} to .buncf/cloudflare/assets`);
      }
    } catch {
      // Folder doesn't exist, skip
    }
  }

  // Ensure index.html is copied to assets if it exists in root or src (for SPA fallback)
  // AND rewrite references to client scripts (tsx -> js)
  const indexCandidates = ["./src/index.html", "./index.html"];
  for (const candidate of indexCandidates) {
    if (fs.existsSync(candidate)) {
      log.step(`📄 Found ${candidate}, processing for production...`);
      let htmlContent = await Bun.file(candidate).text();

      // Rewrite references for production (Force absolute paths)
      // 1. Scripts: .tsx, .ts, .jsx -> .js (and ensure absolute path)
      htmlContent = htmlContent
        .replace(/src=["'](?:\.?\/)?(.*)\.tsx["']/g, 'src="/$1.js"')
        .replace(/src=["'](?:\.?\/)?(.*)\.ts["']/g, 'src="/$1.js"')
        .replace(/src=["'](?:\.?\/)?(.*)\.jsx["']/g, 'src="/$1.js"');

      // 2. Styles: Ensure .css links are absolute
      htmlContent = htmlContent.replace(/href=["'](?:\.?\/)?(.*)\.css["']/g, 'href="/$1.css"');

      // 3. General: Replace any remaining leading "./" with "/" in src/href
      htmlContent = htmlContent
        .replace(/src=["']\.\/(.*)["']/g, 'src="/$1"')
        .replace(/href=["']\.\/(.*)["']/g, 'href="/$1"');

      await Bun.write("./.buncf/cloudflare/assets/index.html", htmlContent);
      break;
    }
  }

  await generateRoutesManifest();

  // Generate type-safe API client
  log.step("🔧 Generating type-safe API client...");
  const { generateAllApiTypes } = await import("./codegen");
  const { routeCount } = await generateAllApiTypes(process.cwd(), { verbose: flags.verbose });
  log.success(`Generated API types for ${routeCount} endpoints`);

  // Client build (for client.tsx/jsx)
  const clientEntry = ["./src/client.tsx", "./src/client.jsx", "./client.tsx", "./client.jsx"].find(path => Bun.file(path).size > 0);

  // Helper to load tailwind if available
  let tailwindPlugin = null;
  try {
    // @ts-ignore
    const { default: tailwind } = await import("bun-plugin-tailwind");
    tailwindPlugin = tailwind;
  } catch (e) { /* no plugin */ }

  const plugins = tailwindPlugin ? [tailwindPlugin] : [];

  // CSS Build (globals.css, index.css)
  const cssEntries = ["./src/globals.css", "./src/index.css", "./globals.css", "./index.css"];
  for (const cssFile of cssEntries) {
    if (Bun.file(cssFile).size > 0) {
      log.step(`🎨 Building CSS: ${cssFile}...`);
      try {
        const cssResult = await Bun.build({
          entrypoints: [cssFile],
          outdir: "./.buncf/cloudflare/assets",
          target: "browser", // allows css output
          plugins: plugins,
          naming: "[name].[ext]"
        });
        if (cssResult.success) {
          log.success(`CSS built: ${cssFile}`);
        } else {
          console.error("CSS build failed:", cssResult.logs);
        }
      } catch (e) {
        console.error("CSS build error:", e);
      }
    }
  }

  if (clientEntry) {
    log.step("🎨 Building Client...");
    try {
      const clientResult = await Bun.build({
        entrypoints: [clientEntry],
        outdir: "./.buncf/cloudflare/assets",
        target: "browser",
        format: "esm",
        plugins: plugins,
        naming: "[name].[ext]",
      });
      if (clientResult.success) {
        log.success("Client build finished");
      } else {
        log.error("Client build failed:");
        console.error(JSON.stringify(clientResult.logs, null, 2));
      }
    } catch (e) {
      log.error(`Client build error: ${e}`);
    }
  }

  log.step("🔨 Building Worker...");
  try {
    const result = await Bun.build({
      entrypoints: [entrypoint],
      outdir: "./.buncf/cloudflare",
      target: "bun",
      format: "esm",
      plugins: [bunToCloudflare(entrypoint)],
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
        "process.env": "globalThis.process.env",
      },
      loader: {
        ".html": "file",
      },
      naming: {
        entry: "worker.[ext]",
        asset: "assets/[name]-[hash].[ext]",
      },
      external: ["node:async_hooks", ...(clientEntry ? [clientEntry] : [])],
    });

    if (result.success) {
      log.success("Worker build finished: .buncf/cloudflare/worker.js");
      return true;
    } else {
      log.error("Worker build failed:");
      console.error(JSON.stringify(result.logs, null, 2));
      return false;
    }
  } catch (e) {
    log.error(`Worker build error: ${e}`);
    return false;
  }
};

const getEntrypoint = () => {
  const entrypoint = entrypoints.find(path => Bun.file(path).size > 0);
  if (!entrypoint) {
    log.error("No entrypoint found.");
    console.log(`
${chalk.dim("Please create one of the following files:")}
  • src/index.ts
  • index.ts
  • src/index.js
  • index.js
`);
    process.exit(1);
  }
  return entrypoint;
};

// Handle flags first
if (flags.version) {
  console.log(`buncf v${VERSION}`);
  process.exit(0);
}

if (flags.help || !command) {
  showHelp();
  process.exit(0);
}

// Handle commands
if (command === "build") {
  const entrypoint = getEntrypoint();
  log.title(`🚀 Building for Production...`);
  const success = await build(entrypoint);
  console.log("");
  process.exit(success ? 0 : 1);

} else if (command === "deploy") {
  const entrypoint = getEntrypoint();
  log.title(`🚀 Deploying to Cloudflare...`);
  const success = await build(entrypoint);
  if (!success) process.exit(1);

  console.log("");
  const deploy = spawn(["bun", "wrangler", "deploy"], {
    stdio: ["inherit", "inherit", "inherit"],
  });

  await deploy.exited;
  process.exit(deploy.exitCode);

  // Dev Command Implementation
} else if (command === "dev") {
  const entrypoint = getEntrypoint();
  console.clear();
  showBanner();
  log.info(`Starting dev server...`);

  // 1. Client Build Watcher
  const clientEntry = ["./src/client.tsx", "./src/client.jsx", "./client.tsx", "./client.jsx"].find(path => Bun.file(path).size > 0);

  if (clientEntry) {
    // @ts-ignore
    const { default: tailwind } = await import("bun-plugin-tailwind");

    // Generate routes once
    await generateRoutesManifest();

    // Generate type-safe API client
    const { generateAllApiTypes } = await import("./codegen");
    await generateAllApiTypes(process.cwd(), { verbose: flags.verbose });

    // Initial build + Watch
    const buildClient = async () => {
      try {
        await Bun.build({
          entrypoints: [clientEntry],
          outdir: "./.buncf/assets",
          target: "browser",
          format: "esm",
          plugins: [tailwind],
          naming: "[name].[ext]",
        });
        console.log(chalk.dim("[wait]") + "  compiling client...");
        console.log(chalk.green("[ready]") + " client compiled successfully");
      } catch (e) {
        log.error("Client build failed");
      }
    };

    await buildClient();

    // Watch for client changes (including pages for route regen)
    // Watch for client changes (including pages for route regen)
    let routeGenTimer: ReturnType<typeof setTimeout>;
    // Use absolute path for watcher reliability
    const watcher = fs.watch(path.resolve(process.cwd(), "src"), { recursive: true }, async (event: any, filename: any) => {
      // console.log(`[watch] ${event} ${filename}`);
      if (filename) {
        if (filename.includes("pages")) {
          // console.log("[watch] Pages change detected...");
          clearTimeout(routeGenTimer);
          routeGenTimer = setTimeout(async () => {
            console.log("[watch] Regenerating routes...");
            await generateRoutesManifest();
          }, 200);
        }
        if (filename.includes("api")) {
          // Regenerate API types on api folder changes
          clearTimeout(routeGenTimer);
          routeGenTimer = setTimeout(async () => {
            console.log("[watch] Regenerating API types...");
            const { generateAllApiTypes } = await import("./codegen");
            await generateAllApiTypes(process.cwd());
          }, 200);
        }
        if (filename.endsWith(".tsx") || filename.endsWith(".css") || filename.endsWith(".jsx")) {
          await buildClient();
        }
      }
    });
  }

  // 2. Start Server with Native Watch
  // We use standard Bun watch but pipe output to format it
  console.log(chalk.dim("[wait]") + "  starting server...");

  const proc = spawn(["bun", "run", "--watch", entrypoint], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, FORCE_COLOR: "1" }
  });

  const printOutput = async (stream: ReadableStream) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      // Clean up clear screen codes to prevent flicker if we control it
      // And prefix logs
      const lines = text.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.includes("Saved!")) {
          console.log(chalk.green("[ready]") + " server reloaded");
          continue;
        }
        // Passthrough other logs
        process.stdout.write(line + "\n");
      }
    }
  };

  printOutput(proc.stdout);
  printOutput(proc.stderr);

  // Keep alive
  await proc.exited;

} else if (command === "init") {
  const projectName = args[args.indexOf("init") + 1];
  await initProject(projectName);
  process.exit(0);
} else {
  log.error(`Unknown command: ${command}`);
  console.log(`\nRun ${chalk.cyan("buncf --help")} for usage information.\n`);
  process.exit(1);
}
