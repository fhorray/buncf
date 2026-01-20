import * as fs from "fs";
import * as path from "path";
import type { BuncfConfig } from "../types";

/**
 * Dynamically load the buncf.config.ts file from the current working directory.
 * Returns a typed BuncfConfig object.
 */
export async function loadConfig(): Promise<BuncfConfig> {
  const configPath = path.resolve(process.cwd(), "buncf.config.ts");

  if (fs.existsSync(configPath)) {
    try {
      // Use dynamic import with extra cache busting for tests
      const configUrl = `${configPath}?t=${Date.now()}&r=${Math.random().toString(36).slice(2)}`;
      const mod = await import(configUrl);
      const config = mod.default || mod || {};
      return config as BuncfConfig;
    } catch (e) {
      console.error("[buncf] Failed to load buncf.config.ts:", e);
      return {};
    }
  }

  return {};
}
