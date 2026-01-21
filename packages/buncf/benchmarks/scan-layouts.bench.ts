
import * as fs from "fs";
import * as path from "path";
import { describe, bench } from "bun:test";
import { scanLayouts } from "../src/utils/scan-layouts";

// --- SETUP TEST DATA ---
const TEST_DIR = path.resolve(process.cwd(), "bench-temp-layouts");
const NUM_DIRS = 50;
const DEPTH = 5;

// Recursive function to create directories
function createDirs(base: string, depth: number) {
  if (depth === 0) return;

  // Create a layout in this dir
  // Mix of extensions
  const extensions = ["tsx", "ts", "jsx", "js"];
  const ext = extensions[Math.floor(Math.random() * extensions.length)];
  fs.writeFileSync(path.join(base, `_layout.${ext}`), "export default function Layout() {}");

  // Occasionally create a conflict to test priority (not strictly for perf, but good for reality check)
  if (Math.random() > 0.8) {
     fs.writeFileSync(path.join(base, `_layout.js`), "export default function Layout() {}");
  }

  // Create subdirectories
  const numSub = Math.floor(Math.random() * 3) + 1; // 1-3 subdirs
  for (let i = 0; i < numSub; i++) {
    const subDir = path.join(base, `sub-${i}`);
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir);
      createDirs(subDir, depth - 1);
    }
  }
}

function setup() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR);
  // Just create a bunch of folders
  for (let i=0; i<NUM_DIRS; i++) {
      const d = path.join(TEST_DIR, `dir-${i}`);
      fs.mkdirSync(d);
      createDirs(d, DEPTH);
  }
  console.log(`Created test directory at ${TEST_DIR}`);
}

function teardown() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

// --- OLD IMPLEMENTATION (Sync Recursive) ---
function oldScanLayouts(pagesDir: string) {
    const layoutRoutes: string[] = [];
    if (fs.existsSync(pagesDir)) {
      const scan = (dir: string, baseRoute: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scan(fullPath, `${baseRoute}/${file}`);
          } else if (file.match(/^_layout\.(tsx|jsx|ts|js)$/)) {
            let routeKey = baseRoute === "" ? "/" : baseRoute;
            if (!routeKey.startsWith("/")) routeKey = "/" + routeKey;

            // Just simulate the pushing logic, ignoring relative path calc for perf test
            layoutRoutes.push(`${routeKey}: ${fullPath}`);
          }
        }
      };
      scan(pagesDir, "");
    }
    return layoutRoutes;
}

// --- RUN BENCHMARK ---
setup();

// Warmup
oldScanLayouts(TEST_DIR);

const start = performance.now();
for(let i=0; i<100; i++) {
    oldScanLayouts(TEST_DIR);
}
const end = performance.now();
console.log(`Old Implementation (Sync): ${(end - start).toFixed(2)}ms for 100 runs`);
console.log(`Average per run: ${((end - start)/100).toFixed(4)}ms`);

// --- NEW IMPLEMENTATION (Async Glob) ---
// Warmup
await scanLayouts(TEST_DIR);

const startNew = performance.now();
for(let i=0; i<100; i++) {
    await scanLayouts(TEST_DIR);
}
const endNew = performance.now();
console.log(`New Implementation (Async Glob): ${(endNew - startNew).toFixed(2)}ms for 100 runs`);
console.log(`Average per run: ${((endNew - startNew)/100).toFixed(4)}ms`);
console.log(`Speedup: ${((end - start) / (endNew - startNew)).toFixed(2)}x`);


teardown();
