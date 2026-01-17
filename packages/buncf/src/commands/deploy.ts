
import { spawn } from "child_process";
// @ts-ignore
import { log } from "../utils/log";
import { build } from "./build";

export async function deploy(entrypoint: string) {
  log.title("🚀 Deploying to Cloudflare...");

  // 1. Build first
  const success = await build(entrypoint);
  if (!success) {
    log.error("Build failed, aborting deploy.");
    process.exit(1);
  }

  console.log("");

  // 2. Deploy via Wrangler
  // We use "bun wrangler" to leverage local installation
  const deployProcess = spawn("bun", ["wrangler", "deploy"], {
    stdio: ["inherit", "inherit", "inherit"],
    shell: true
  });

  deployProcess.on("close", (code) => {
    process.exit(code || 0);
  });
}
