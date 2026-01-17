#!/usr/bin/env bun
import { spawn } from "bun";
import { bunToCloudflare } from "./plugin";
import * as fs from "fs";
import * as path from "path";

// Package version (sync with package.json)
const VERSION = "0.1.0";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg: string) => console.log(`${colors.dim}[${new Date().toLocaleTimeString()}]${colors.reset} ${msg}`),
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
  console.log(`
${colors.bright}buncf${colors.reset} - Deploy Bun applications to Cloudflare Workers

${colors.bright}USAGE${colors.reset}
  buncf <command> [options]

${colors.bright}COMMANDS${colors.reset}
  init        Scaffold a new project
  build       Build for production
  deploy      Build and deploy to Cloudflare Workers
  dev         (deprecated) Use 'bun run --watch' instead

${colors.bright}OPTIONS${colors.reset}
  -h, --help      Show this help message
  -v, --version   Show version number
      --verbose   Enable verbose output

${colors.bright}EXAMPLES${colors.reset}
  buncf init               Create new project
  buncf build              Build production bundle
  buncf deploy             Deploy to Cloudflare
  buncf --help             Show help

${colors.bright}LEARN MORE${colors.reset}
  Documentation: https://github.com/francyelton/buncf
`);
};

// Function handle init command
const initProject = async () => {
  log.info("Initializing new buncf project...");

  const files = {
    "package.json": JSON.stringify({
      name: "my-buncf-app",
      module: "src/index.ts",
      type: "module",
      scripts: {
        "dev": "buncf dev",
        "build": "buncf build",
        "deploy": "buncf deploy"
      },
      dependencies: {
        "react": "^18.3.0",
        "react-dom": "^18.3.0"
      },
      devDependencies: {
        "buncf": "latest",
        "@types/bun": "latest",
        "bun-plugin-tailwind": "latest",
        "@types/react": "^18.3.0",
        "@types/react-dom": "^18.3.0"
      }
    }, null, 2),
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        lib: ["ESNext", "DOM"],
        module: "esnext",
        target: "esnext",
        moduleResolution: "bundler",
        moduleDetection: "force",
        allowImportingTsExtensions: true,
        noEmit: true,
        composite: true,
        strict: true,
        downlevelIteration: true,
        skipLibCheck: true,
        jsx: "react-jsx",
        allowSyntheticDefaultImports: true,
        forceConsistentCasingInFileNames: true,
        allowJs: true,
        types: ["bun-types"]
      }
    }, null, 2),
    "wrangler.jsonc": JSON.stringify({
      name: "my-buncf-app",
      main: "./.buncf/cloudflare/worker.js",
      compatibility_date: new Date().toISOString().split('T')[0],
      compatibility_flags: ["nodejs_compat"],
      assets: {
        directory: ".buncf/cloudflare/assets",
        binding: "ASSETS"
      }
    }, null, 2),
    "src/index.ts": `import { serve } from "bun";
import index from "./index.html";

serve({
  routes: {
    "/": index,
    "/api/hello": () => Response.json({ message: "Hello World!" })
  }
});
`,
    "src/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buncf App</title>
    <script type="module" src="./client.tsx"></script>
    <link rel="stylesheet" href="./globals.css">
</head>
<body>
    <div id="root"></div>
</body>
</html>`,
    "src/client.tsx": `import { createRoot } from "react-dom/client";
import "./globals.css";

const App = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <h1 className="text-4xl font-bold text-blue-600">Hello form Bun + Cloudflare!</h1>
        </div>
    );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
`,
    "src/globals.css": `@import "tailwindcss";`
  };

  // Create src folder
  if (!fs.existsSync("src")) {
    fs.mkdirSync("src");
  }

  // Write files
  for (const [filename, content] of Object.entries(files)) {
    if (!fs.existsSync(filename)) {
      await Bun.write(filename, content);
      log.success(`Created ${filename}`);
    } else {
      log.warn(`Skipped ${filename} (already exists)`);
    }
  }

  log.step("Installing dependencies...");
  const proc = spawn(["bun", "install"], { stdio: ["inherit", "inherit", "inherit"] });
  await proc.exited;

  log.success("Project initialized! To start:");
  console.log(`
  ${colors.cyan}bun run dev${colors.reset}
`);
};


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

  // Generate Client-Side Routes Manifest (.buncf/routes.ts)
  log.step("🗺️ Generating client routes manifest (.buncf/routes.ts)...");
  try {
    const pagesDir = path.resolve(process.cwd(), "src/pages");
    let routeEntries: string[] = [];

    if (fs.existsSync(pagesDir)) {
      const router = new Bun.FileSystemRouter({
        dir: pagesDir,
        style: "nextjs"
      });
      routeEntries = Object.entries(router.routes).map(([route, filePath]) => {
        // Generate relative path from .buncf/routes.ts to src/pages/...
        // .buncf/routes.ts is 1 level deep from root? No, .buncf folder.
        // src/pages is 1 level deep.
        // Rel path from .buncf/ to src/pages/file: ../src/pages/file
        // Normalize paths
        const absFile = filePath;
        // Compute relative path
        const relPath = path.relative(".buncf", absFile).split(path.sep).join(path.posix.sep);
        const importPath = relPath.startsWith(".") ? relPath : `./${relPath}`;
        return `  "${route}": () => import("${importPath}")`;
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
`;
    // Ensure .buncf exists (it does because of copy assets logic, wait no, assets copied to .buncf/cloudflare/assets)
    // We want .buncf/routes.ts
    // Check if .buncf exists
    if (!fs.existsSync(".buncf")) fs.mkdirSync(".buncf");

    await Bun.write(".buncf/routes.ts", routesContent);
  } catch (e) {
    console.error("Failed to generate routes manifest:", e);
  }

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
      plugins: [bunToCloudflare()],
      loader: {
        ".html": "file",
      },
      naming: {
        entry: "worker.[ext]",
        asset: "assets/[name]-[hash].[ext]",
      },
      external: clientEntry ? [clientEntry] : [],
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
${colors.dim}Please create one of the following files:${colors.reset}
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
  console.log(`\n${colors.bright}🚀 Building for Production...${colors.reset}\n`);
  const success = await build(entrypoint);
  console.log("");
  process.exit(success ? 0 : 1);

} else if (command === "deploy") {
  const entrypoint = getEntrypoint();
  console.log(`\n${colors.bright}🚀 Deploying to Cloudflare...${colors.reset}\n`);
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
  log.info(`Starting dev server...`);

  // 1. Client Build Watcher
  const clientEntry = ["./src/client.tsx", "./src/client.jsx", "./client.tsx", "./client.jsx"].find(path => Bun.file(path).size > 0);

  if (clientEntry) {
    // @ts-ignore
    const { default: tailwind } = await import("bun-plugin-tailwind");

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
          // @ts-ignore - Bun types might miss watch option in some versions but it exists
          // actually Bun.build doesn't support persistent watch callback easily yet in single call API generally, 
          // but we can use fs.watch or polling for simplicity if native watch isn't exposed perfectly in this context.
          // However, let's use a simple rebuild on change for now or just run it once if watch is complex.
          // Better: just run it. And use a file watcher.
        });
        // log.success is too noisy for every rebuild? Next.js says "transport compiled..."
        console.log(`${colors.dim}[wait]${colors.reset}  compiling client...`);
        console.log(`${colors.green}[ready]${colors.reset} client compiled successfully`);
      } catch (e) {
        log.error("Client build failed");
      }
    };

    await buildClient();

    // Watch for client changes
    // Simplified watcher for src folder for now
    const watcher = fs.watch("./src", { recursive: true }, async (event, filename) => {
      if (filename && (filename.endsWith(".tsx") || filename.endsWith(".css") || filename.endsWith(".jsx"))) {
        await buildClient();
      }
    });
  }

  // 2. Start Server with Native Watch
  // We use standard Bun watch but pipe output to format it
  console.log(`${colors.dim}[wait]${colors.reset}  starting server...`);

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
          console.log(`${colors.green}[ready]${colors.reset} server reloaded`);
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
  await initProject();
  process.exit(0);
} else {
  log.error(`Unknown command: ${command}`);
  console.log(`\nRun ${colors.cyan}buncf --help${colors.reset} for usage information.\n`);
  process.exit(1);
}
