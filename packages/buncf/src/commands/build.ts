
import * as fs from "fs";
import * as path from "path";
// @ts-ignore
import { bunToCloudflare } from "../plugin";
// @ts-ignore
import { log } from "../utils/log";
import { serverActionsClientPlugin, serverActionsWorkerPlugin, deduplicateReactPlugin } from "../plugins/server-actions";
import { autoCssPlugin } from "../plugins/css";
import { generateCloudflareTypes } from "../utils/typegen";
import { loadConfig } from "../utils/config";
import { generateRoutesManifest } from "../utils/manifest";
import { getPublicEnv } from "../utils/env";

function styleTag(route: string) {
  if (route.includes("[") || route.includes("*")) {
    return log.yellow("[Dynamic]");
  }
  return log.green("[Static]");
}

// Reusable Build Function
export const build = async (entrypoint: string) => {
  const startTime = performance.now();

  // 0. Auto Generate Cloudflare Types
  await generateCloudflareTypes();

  // Load User Config
  const config = await loadConfig();
  const userPlugins = config.plugins || [];

  // Initialize Buncf Plugins
  // @ts-ignore
  const { initializePlugins } = await import("../plugin-registry");
  const buncfPluginsConfig = config.buncfPlugins || [];
  const pluginRegistry = await initializePlugins(buncfPluginsConfig);
  const pluginBuildPlugins = pluginRegistry.buildPlugins || [];

  const combinedClientPlugins = [deduplicateReactPlugin, serverActionsClientPlugin, autoCssPlugin, ...userPlugins, ...pluginBuildPlugins];

  const buildStats = {
    routes: { static: 0, dynamic: 0, total: 0 },
    assets: 0,
    workerSize: 0,
    clientSize: 0,
    duration: 0
  };

  // Copy Plugin Assets
  if (pluginRegistry.assets) {
    if (!fs.existsSync("./.buncf/cloudflare/assets")) fs.mkdirSync("./.buncf/cloudflare/assets", { recursive: true });
    for (const [virtualPath, sourcePath] of Object.entries(pluginRegistry.assets)) {
      try {
        const destName = virtualPath.startsWith("/") ? virtualPath.slice(1) : virtualPath;
        const destPath = path.resolve("./.buncf/cloudflare/assets", destName);
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

        await Bun.write(destPath, Bun.file(sourcePath));
        buildStats.assets++;
      } catch (e) {
        console.error(`Failed to copy plugin asset ${virtualPath}:`, e);
      }
    }
  }

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
        buildStats.assets++;
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
      buildStats.assets++;
      break;
    }
  }

  const manifestStats = await generateRoutesManifest();
  buildStats.routes.static = manifestStats.staticRoutes;
  buildStats.routes.dynamic = manifestStats.dynamicRoutes;
  buildStats.routes.total = manifestStats.total;

  // Generate type-safe API client
  log.step("🔧 Generating type-safe API client...");
  // @ts-ignore
  const { generateAllApiTypes } = await import("../codegen");
  const { routeCount } = await generateAllApiTypes(process.cwd(), { verbose: false });
  log.success(`Generated API types for ${routeCount} endpoints`);

  // Client build (for client.tsx/jsx)
  const clientEntry = ["./src/client.tsx", "./src/client.jsx", "./client.tsx", "./client.jsx"].find(path => {
    try { return fs.existsSync(path); } catch (e) { return false; }
  });

  const plugins = [deduplicateReactPlugin, serverActionsClientPlugin];

  // CSS Build (globals.css, index.css)
  const cssEntries = ["./src/globals.css", "./src/index.css", "./globals.css", "./index.css"];
  for (const cssFile of cssEntries) {
    if (fs.existsSync(cssFile)) {
      log.step(`🎨 Building CSS: ${cssFile}...`);
      try {
        const cssResult = await Bun.build({
          entrypoints: [cssFile],
          outdir: "./.buncf/cloudflare/assets",
          target: "browser", // allows css output
          plugins: combinedClientPlugins,
          naming: "[name].[ext]",
          minify: true,
        });
        if (cssResult.success) {
          log.success(`CSS built: ${cssFile}`);
          buildStats.assets++;
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
      // Filter public env vars (Security: Only expose variables explicitly marked as public)
      const publicEnv = getPublicEnv();

      const clientResult = await Bun.build({
        entrypoints: [clientEntry],
        outdir: "./.buncf/cloudflare/assets",
        target: "browser",
        format: "esm",
        minify: true,
        splitting: true,
        drop: ["console", "debugger"],
        // Inject Process & Env for Client compatibility
        define: {
          "process.env.NODE_ENV": JSON.stringify("production"),
          "process.env": JSON.stringify(publicEnv),
          "process.browser": "true"
        },
        plugins: combinedClientPlugins,
        naming: {
          entry: "[name].[ext]",
          chunk: "[name]-[hash].[ext]",
          asset: "[name]-[hash].[ext]",
        },
      });
      if (clientResult.success) {
        log.success("Client build finished");
        const clientFile = "./.buncf/cloudflare/assets/client.js";
        if (fs.existsSync(clientFile)) buildStats.clientSize = fs.statSync(clientFile).size;
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
      minify: true,
      splitting: false, // Keep worker as single file for Cloudflare compatibility
      drop: ["console", "debugger"], // Prune logs from production worker
      plugins: [bunToCloudflare(entrypoint), serverActionsWorkerPlugin, ...userPlugins, ...pluginBuildPlugins],
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
      // @ts-ignore
      external: ["node:async_hooks", ...(clientEntry ? [clientEntry] : [])],
    });

    if (result.success) {
      log.success("Worker build finished: .buncf/worker.js");
      const workerFile = "./.buncf/cloudflare/worker.js";
      if (fs.existsSync(workerFile)) buildStats.workerSize = fs.statSync(workerFile).size;

      buildStats.duration = performance.now() - startTime;

      // DISPLAY FINAL REPORT
      console.log("\n".repeat(2));
      log.box(`Buncf Build Summary\nDuration: ${(buildStats.duration / 1000).toFixed(2)}s`);

      console.log(log.bold("\nRoutes:"));
      log.table(["Path", "Type"], manifestStats.manifest.map(m => [
        m.path,
        m.type === "Static" ? log.green("[Static]") : log.yellow("[Dynamic]")
      ]));

      console.log(log.bold("\nStatistics:"));
      log.table(["Metric", "Value"], [
        ["Static Routes", buildStats.routes.static.toString()],
        ["Dynamic Routes", buildStats.routes.dynamic.toString()],
        ["Total Routes", buildStats.routes.total.toString()],
        ["Total Assets", buildStats.assets.toString()],
        ["Worker Bundle", (buildStats.workerSize / 1024).toFixed(2) + " KB"],
        ["Client Bundle", (buildStats.clientSize / 1024).toFixed(2) + " KB"]
      ]);
      console.log("");

      return true;
    } else {
      log.error("Worker build failed:");
      console.error(JSON.stringify(result.logs, null, 2));
      return false;
    }
  } catch (e: any) {
    log.error(`Worker build error: ${e.message || e}`);
    if (e.errors) {
      console.error(JSON.stringify(e.errors, null, 2));
    }
    return false;
  }
};
