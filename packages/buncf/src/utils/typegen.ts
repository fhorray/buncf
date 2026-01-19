import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
// @ts-ignore
import { log, colors } from "./log";

export async function generateCloudflareTypes() {
  const dotBuncf = path.resolve(process.cwd(), ".buncf");
  if (!fs.existsSync(dotBuncf)) fs.mkdirSync(dotBuncf, { recursive: true });

  const outputPath = path.join(dotBuncf, "cloudflare-env.d.ts");

  log.step(`✨ Generating types: ${colors.dim(".buncf/cloudflare-env.d.ts")}...`);

  try {
    // Run wrangler types
    // We use npx to ensure we use the local version if available
    const result = spawnSync("npx", [
      "wrangler", "types",
      "--env-interface", "CloudflareEnv",
      outputPath
    ], {
      stdio: "pipe", // Capture output to avoid cluttering but detect errors
      shell: true,
      encoding: "utf-8"
    });

    if (result.status !== 0) {
      log.error("Failed to generate Cloudflare types via wrangler.");
      if (result.stderr) console.error(result.stderr);
      return false;
    }

    // Success!
    return true;
  } catch (e: any) {
    log.error(`Type generation error: ${e.message}`);
    return false;
  }
}
