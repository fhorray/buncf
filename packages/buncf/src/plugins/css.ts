import type { BunPlugin } from "bun";
import * as fs from "fs";
import * as path from "path";

export const autoCssPlugin: BunPlugin = {
  name: "buncf-auto-css",
  setup(build) {
    const cwd = process.cwd();

    // Check for Tailwind/PostCSS markers in package.json
    const checkPkg = (dir: string): { hasTailwind: boolean; hasPostCSS: boolean } => {
      try {
        const pkgPath = path.join(dir, "package.json");
        if (!fs.existsSync(pkgPath)) return { hasTailwind: false, hasPostCSS: false };
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        const hasTailwind = !!(
          pkg.dependencies?.tailwindcss ||
          pkg.devDependencies?.tailwindcss ||
          pkg.dependencies?.["@tailwindcss/postcss"] ||
          pkg.devDependencies?.["@tailwindcss/postcss"]
        );
        const hasPostCSS = !!(
          pkg.dependencies?.postcss ||
          pkg.devDependencies?.postcss ||
          ["postcss.config.js", "postcss.config.cjs", "postcss.config.mjs"].some(f => fs.existsSync(path.join(dir, f)))
        );
        return { hasTailwind, hasPostCSS };
      } catch (e) {
        return { hasTailwind: false, hasPostCSS: false };
      }
    };

    const localMarkers = checkPkg(cwd);
    let hasTailwind = localMarkers.hasTailwind;
    let postcssConfig = localMarkers.hasPostCSS;

    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const source = await Bun.file(args.path).text();
      if (!source) return { contents: "", loader: "css" };

      // Content-based detection (Tailwind v4 directives)
      const hasTailwindDirectives =
        source.includes('@import "tailwindcss"') ||
        source.includes('@tailwind') ||
        source.includes('@theme') ||
        source.includes('@layer');

      if (!hasTailwind && !postcssConfig && !hasTailwindDirectives) {
        return { contents: source, loader: "css" };
      }

      try {
        let css = source;

        // Resolution logic: Try to find postcss/tailwindcss in project or monorepo roots
        const resolveDep = (dep: string) => {
          try {
            return Bun.resolveSync(dep, cwd);
          } catch (e) {
            try {
              // Try parent directory (monorepo root)
              return Bun.resolveSync(dep, path.join(cwd, ".."));
            } catch (e2) {
              try {
                // Try one more level up if needed
                return Bun.resolveSync(dep, path.join(cwd, "../.."));
              } catch (e3) {
                return null;
              }
            }
          }
        };

        const postcssPath = resolveDep("postcss");
        if (!postcssPath) {
          if (hasTailwindDirectives) {
            console.warn(`[buncf] Tailwind directives found in ${path.basename(args.path)}, but 'postcss' is not installed.`);
            console.warn(`[buncf] Please install 'postcss' and '@tailwindcss/postcss' (for v4) or 'tailwindcss' (for v3).`);
          }
          return { contents: source, loader: "css" };
        }

        const { default: postcss } = await import(postcssPath);
        let plugins: any[] = [];

        // Try to load PostCSS config if it exists
        const postcssLoadConfigPath = resolveDep("postcss-load-config");
        if (postcssLoadConfigPath) {
          try {
            const { default: loadConfig } = await import(postcssLoadConfigPath);
            // @ts-ignore
            const loaded = await loadConfig({ file: args.path, cwd });
            plugins = loaded.plugins;
          } catch (e) { }
        }

        // If no plugins from config, or no config, check for Tailwind
        if (plugins.length === 0 && (hasTailwind || hasTailwindDirectives)) {
          let twPluginPath = resolveDep("@tailwindcss/postcss") || resolveDep("tailwindcss");

          if (twPluginPath) {
            const { default: twPlugin } = await import(twPluginPath);
            plugins = [twPlugin];

            // For v3, add autoprefixer if available
            if (!twPluginPath.includes("@tailwindcss/postcss")) {
              const apPath = resolveDep("autoprefixer");
              if (apPath) {
                const { default: autoprefixer } = await import(apPath);
                plugins.push(autoprefixer);
              }
            }
          }
        }

        if (plugins.length > 0) {
          const result = await postcss(plugins).process(source, {
            from: args.path,
          });
          css = result.css;
        }

        return {
          contents: css,
          loader: "css",
        };
      } catch (e: any) {
        console.warn(`[buncf] Auto CSS processing failed for ${path.basename(args.path)}. Falling back to raw CSS.`);
        console.error(e.message || e);
        return { contents: source, loader: "css" };
      }
    });
  },
};
