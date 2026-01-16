import { type BunPlugin } from "bun";
import * as fs from "fs";
import * as path from "path";

// Re-export types for consumers
export * from "./types";

// Re-export server-side router (createApp)
// For hooks/Link, use: import { useRouter } from "buncf/router"
export { createApp, createApiRouter, createPagesRouter } from "./router";

// Function to read the runtime code relative to this file
// When distributed, we assume runtime.ts (or its compiled version) is accessible.
// For simplicity in this monorepo/source usage, we read the TS file directly.
function getRuntimeCode() {
  try {
    const runtimePath = path.join(import.meta.dir, "runtime.ts");
    return fs.readFileSync(runtimePath, "utf-8");
  } catch (e) {
    console.error("Failed to read runtime.ts", e);
    // Fallback or error
    return "// Error loading runtime adapter";
  }
}

export const bunToCloudflare = (): BunPlugin => ({
  name: "bun-to-cloudflare",
  setup(build) {
    const runtimeCode = getRuntimeCode();

    build.onLoad({ filter: /\.(ts|js|tsx|jsx)$/ }, async (args) => {
      let originalCode = await Bun.file(args.path).text();

      // Fix Import Hoisting & Global Dependence:
      // Rewrite "import ... from 'bun'" to use our local "__BunShim__" variable.
      originalCode = originalCode.replace(
        /import\s+\{\s*([^}]+)\s*\}\s+from\s*["']bun["'];?/g,
        "const { $1 } = __BunShim__;"
      );
      // Handle "import Bun from 'bun'"
      originalCode = originalCode.replace(
        /import\s+Bun\s+from\s*["']bun["'];?/g,
        "const Bun = __BunShim__;"
      );

      const loader = args.path.endsWith("sx") ? "tsx" : "ts";

      // Only inject entry points that strictly use Bun.serve
      // In a robust implementation, checking build.config.entrypoints is better,
      // but 'includes("Bun.serve")' is a decent heuristic for the main server.
      if (!originalCode.includes("Bun.serve") && !originalCode.includes("serve(")) {
        return { contents: originalCode, loader };
      }

      // We remove the imports/exports from the runtime code to embed it safely
      // or we can structure it differently.
      // Strategy:
      // 1. Inject the Shim Logic (Bun mock) at the TOP.
      // 2. The user code runs (initializing Bun.serve -> setting __handler__).
      // 3. Inject the Export Handler at the BOTTOM.

      // Parse runtime parts roughly (fragile, but keeping simple for now)
      // Ideally we would bundle 'runtime.ts' and inject it.
      // For this step, we will assume runtime.ts has the specific markers or just inject fully?
      // runtime.ts as written has an 'export default'. We need that to be the LAST thing.

      // Let's strip the 'export default' from runtimeCode and move it to the end?
      // Or better: wrapping.

      // Simplified Runtime Injection:
      // Remove "export default" from runtime and rename it to a variable, then export it at the very end.
      const runtimeNoExport = runtimeCode.replace("export default", "const __worker_export__ =");

      const combinedCode = `
// --- ADAPTER RUNTIME START ---
${runtimeNoExport}
// --- ADAPTER RUNTIME END ---

// --- USER CODE START ---
${originalCode}
// --- USER CODE END ---

// --- EXPORT FOR WORKER ---
export default __worker_export__;
`;

      return {
        contents: combinedCode,
        loader,
      };
    });
  },
});