import * as path from "path";
import { Glob } from "bun";

export interface LayoutEntry {
  route: string;
  filepath: string;
}

/**
 * Scans a directory for layout files (_layout.{tsx,ts,jsx,js}).
 * Uses Bun.Glob for efficient async scanning.
 * Prioritizes extensions: tsx > ts > jsx > js.
 *
 * @param pagesDir The directory to scan (absolute path)
 * @returns Promise<LayoutEntry[]>
 */
export async function scanLayouts(pagesDir: string): Promise<LayoutEntry[]> {
  // Bun.Glob supports brace expansion for multiple extensions
  const glob = new Glob("**/_layout.{tsx,ts,jsx,js}");

  // We need to collect all candidates first to handle priority
  // Map of directory path (relative to pagesDir) -> list of layout filenames
  const layoutsByDir = new Map<string, string[]>();

  for await (const file of glob.scan({ cwd: pagesDir, onlyFiles: true })) {
      const dir = path.dirname(file);
      if (!layoutsByDir.has(dir)) {
          layoutsByDir.set(dir, []);
      }
      layoutsByDir.get(dir)!.push(path.basename(file));
  }

  const result: LayoutEntry[] = [];
  const priority = { ".tsx": 4, ".ts": 3, ".jsx": 2, ".js": 1 };

  for (const [dir, files] of layoutsByDir) {
      // Sort files by priority
      // If extension is not in map (shouldn't happen due to glob), treat as lowest
      files.sort((a, b) => {
          const extA = path.extname(a) as keyof typeof priority;
          const extB = path.extname(b) as keyof typeof priority;
          return (priority[extB] || 0) - (priority[extA] || 0);
      });

      // Pick the highest priority
      const bestFile = files[0];
      const fullPath = path.join(pagesDir, dir, bestFile);

      // Calculate route key
      // dir is relative to pagesDir, e.g. "dashboard/settings" or "."
      let routeKey = "/" + (dir === "." ? "" : dir);

      // Normalize separators for all platforms
      routeKey = routeKey.split(path.sep).join(path.posix.sep);

      result.push({
          route: routeKey,
          filepath: fullPath
      });
  }

  return result;
}
