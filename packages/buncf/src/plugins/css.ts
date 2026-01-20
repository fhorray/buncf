import type { BunPlugin } from "bun";
import * as fs from "fs";
import * as path from "path";
import type { Processor } from "postcss";

export const autoCssPlugin: BunPlugin = {
  name: "buncf-auto-css",
  async setup(build) {
    const cwd = process.cwd();
    let processor: Processor | null = null;

    // --- One-time setup ---

    const checkPkg = (dir: string): { hasTailwind: boolean } => {
      try {
        const pkgPath = path.join(dir, "package.json");
        if (!fs.existsSync(pkgPath)) return { hasTailwind: false };
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        return {
          hasTailwind: !!(
            pkg.dependencies?.tailwindcss ||
            pkg.devDependencies?.tailwindcss ||
            pkg.dependencies?.["@tailwindcss/postcss"] ||
            pkg.devDependencies?.["@tailwindcss/postcss"]
          ),
        };
      } catch (e) {
        return { hasTailwind: false };
      }
    };

    const resolveDep = (dep: string) => {
      // Try to resolve from cwd, then parent, then parent's parent
      for (const dir of [cwd, path.join(cwd, ".."), path.join(cwd, "../..")]) {
        try {
          return Bun.resolveSync(dep, dir);
        } catch (e) {
          continue;
        }
      }
      return null;
    };

    try {
      const postcssPath = resolveDep("postcss");
      if (postcssPath) {
        const { default: postcss } = await import(postcssPath);
        let plugins: any[] = [];

        const postcssLoadConfigPath = resolveDep("postcss-load-config");
        if (postcssLoadConfigPath) {
          try {
            const { default: loadConfig } = await import(postcssLoadConfigPath);
            // @ts-ignore
            const loaded = await loadConfig({ cwd });
            if (loaded.plugins?.length) {
              plugins = loaded.plugins;
            }
          } catch (e) {

          }
        }

        if (plugins.length === 0 && checkPkg(cwd).hasTailwind) {
          const twPluginPath = resolveDep("@tailwindcss/postcss") || resolveDep("tailwindcss");
          if (twPluginPath) {
            const { default: twPlugin } = await import(twPluginPath);
            plugins.push(twPlugin);

            if (!twPluginPath.includes("@tailwindcss/postcss")) { // Tailwind CSS v3
              const apPath = resolveDep("autoprefixer");
              if (apPath) {
                const { default: autoprefixer } = await import(apPath);
                plugins.push(autoprefixer);
              }
            }
          }
        }

        if (plugins.length > 0) {
          processor = postcss(plugins);
        }
      }
    } catch (e: any) {
      console.warn(`[buncf] Failed to initialize PostCSS processor. CSS may not be processed correctly.`);
      console.error(e.message || e);
    }

    // --- Per-file processing ---

    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const source = await Bun.file(args.path).text();
      if (!source) return { contents: "", loader: "css" };

      const hasTailwindDirectives =
        source.includes('@import "tailwindcss"') ||
        source.includes('@tailwind') ||
        source.includes('@theme') ||
        source.includes('@layer');

      if (!processor) {
        if (hasTailwindDirectives) {
          console.warn(`[buncf] Tailwind directives found in ${path.basename(args.path)}, but 'postcss' is not installed.`);
          console.warn(`[buncf] Please install 'postcss' and '@tailwindcss/postcss' (for v4) or 'tailwindcss' (for v3).`);
        }
        return { contents: source, loader: "css" };
      }

      try {
        const result = await processor.process(source, { from: args.path });
        return { contents: result.css, loader: "css" };
      } catch (e: any) {
        console.warn(`[buncf] Auto CSS processing failed for ${path.basename(args.path)}. Falling back to raw CSS.`);
        console.error(e.message || e);
        return { contents: source, loader: "css" };
      }
    });
  },
};
