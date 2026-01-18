import * as fs from "fs";
import * as path from "path";

/**
 * Plugin to force React resolution to the project root (Singleton)
 */
export const deduplicateReactPlugin = {
  name: "deduplicate-react",
  setup(build: any) {
    build.onResolve({ filter: /^react(-dom)?$/ }, (args: any) => {
      try {
        const projectRoot = process.cwd();
        const pkgName = args.path;
        const packageJsonPath = path.join(projectRoot, "node_modules", pkgName, "package.json");
        if (fs.existsSync(packageJsonPath)) {
          return { path: require.resolve(pkgName, { paths: [projectRoot] }) };
        }
      } catch (e) { }
      return undefined;
    });
  }
};

/**
 * Plugin to strip CSS imports from JS bundles
 */
export const ignoreCssPlugin = {
  name: "ignore-css",
  setup(build: any) {
    build.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
  }
};

/**
 * Plugin to transform *.action.ts files for the Browser
 * Replaces server-side logic with fetch calls
 */
export const serverActionsClientPlugin = {
  name: "server-actions-client",
  setup(build: any) {
    build.onLoad({ filter: /\.action\.(ts|js|tsx|jsx)$/ }, async (args: any) => {
      const code = await fs.promises.readFile(args.path, "utf8");
      const relativePath = path.relative(process.cwd(), args.path);

      const exportMatches = code.matchAll(/export (?:async )?function ([a-zA-Z0-9_$]+)/g);
      const constExportMatches = code.matchAll(/export const ([a-zA-Z0-9_$]+) =/g);

      let clientCode = `/** Auto-generated Server Action Stubs */\n`;
      const addStub = (name: string) => {
        const actionId = encodeURIComponent(`${relativePath}::${name}`);
        clientCode += `
export const ${name} = async (input) => {
  const res = await fetch("/_action/${actionId}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Action failed" }));
    throw new Error(error.error || "Action failed");
  }
  return res.json();
};\n`;
      };

      for (const match of exportMatches) if (match[1]) addStub(match[1]);
      for (const match of constExportMatches) if (match[1]) addStub(match[1]);

      return { contents: clientCode, loader: "ts" };
    });
  }
};

/**
 * Plugin to inject the Server Actions Registry into the Worker
 */
export const serverActionsWorkerPlugin = {
  name: "server-actions-worker",
  setup(build: any) {
    build.onResolve({ filter: /actions-registry$/ }, (args: any) => {
      return { path: args.path, namespace: "buncf-actions" };
    });

    build.onLoad({ filter: /.*/, namespace: "buncf-actions" }, async () => {
      const glob = new Bun.Glob("src/**/*.action.{ts,js,tsx,jsx}");
      const files = Array.from(glob.scanSync({ cwd: process.cwd(), onlyFiles: true }));

      let imports = "";
      let registry = "export const serverActions = {\n";

      files.forEach((file, idx) => {
        const absPath = path.resolve(process.cwd(), file);
        const relativePath = path.relative(process.cwd(), absPath);
        const importAlias = `actionFile${idx}`;
        imports += `import * as ${importAlias} from "${absPath}";\n`;
        registry += `  // Actions from ${file}\n`;
        registry += `  ...Object.entries(${importAlias}).reduce((acc, [name, val]) => {
          if (val && (typeof val === 'object' || typeof val === 'function') && (val as any)._isAction) {
            acc[\`${relativePath}::\${name}\`] = val;
          }
          return acc;
        }, {} as any),\n`;
      });

      registry += "};\n";
      return { contents: `${imports}\n${registry}`, loader: "ts" };
    });
  }
};
