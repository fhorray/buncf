import type { BunPlugin } from "bun";
import * as fs from "fs";
import * as path from "path";

export const autoCssPlugin: BunPlugin = {
  name: "buncf-auto-css",
  setup(build) {
    const cwd = process.cwd();
    let hasTailwind = false;
    let postcssConfig = false;

    // Detect Tailwind
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
      hasTailwind = !!(
          pkg.dependencies?.tailwindcss ||
          pkg.devDependencies?.tailwindcss ||
          pkg.dependencies?.["@tailwindcss/postcss"] ||
          pkg.devDependencies?.["@tailwindcss/postcss"]
      );
    } catch (e) { }

    // Detect PostCSS config
    postcssConfig = ["postcss.config.js", "postcss.config.cjs", "postcss.config.mjs"].some(f => fs.existsSync(path.join(cwd, f)));

    // If no Tailwind/PostCSS, do nothing
    if (!hasTailwind && !postcssConfig) {
      return;
    }

    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const source = await Bun.file(args.path).text();

      if (!source) return { contents: "", loader: "css" };

      try {
        let css = source;

        if (postcssConfig || hasTailwind) {
           try {
             // Resolve from cwd (user's project)
             const require = await import("module").then(m => m.createRequire(path.join(cwd, "package.json")));

             // Try to resolve postcss
             let postcssPath;
             try {
                 postcssPath = require.resolve("postcss");
             } catch (e) {
                 // If not in app, throw to fallback or error
                 throw e;
             }

             const { default: postcss } = await import(postcssPath);

             let plugins: any[] = [];

             if (postcssConfig) {
               // Load user config
               let loadConfigPath;
               try { loadConfigPath = require.resolve("postcss-load-config"); } catch {}

               if (loadConfigPath) {
                   const { default: loadConfig } = await import(loadConfigPath);
                   // @ts-ignore
                   const loaded = await loadConfig({ file: args.path, cwd });
                   plugins = loaded.plugins;
               }
             } else if (hasTailwind) {
               // Try Tailwind v4 PostCSS plugin
               let twPluginPath;
               try {
                 twPluginPath = require.resolve("@tailwindcss/postcss");
               } catch {
                 try {
                   // Fallback to tailwindcss (v3)
                   twPluginPath = require.resolve("tailwindcss");
                 } catch {}
               }

               if (twPluginPath) {
                   const { default: twPlugin } = await import(twPluginPath);
                   plugins = [twPlugin];

                   // For v3, add autoprefixer if available
                   if (!twPluginPath.includes("@tailwindcss/postcss")) {
                       try {
                           const apPath = require.resolve("autoprefixer");
                           const { default: autoprefixer } = await import(apPath);
                           plugins.push(autoprefixer);
                       } catch {}
                   }
               }
             }

             if (plugins.length > 0) {
                 const result = await postcss(plugins).process(source, {
                   from: args.path,
                 });
                 css = result.css;
             }
           } catch (e: any) {
             console.warn("[buncf] Auto CSS processing failed. Falling back to raw CSS.");
             console.error(e.message);
           }
        }

        return {
          contents: css,
          loader: "css",
        };
      } catch (e: any) {
        console.error(`Error processing CSS ${args.path}:`, e);
        return { contents: source, loader: "css" };
      }
    });
  },
};
