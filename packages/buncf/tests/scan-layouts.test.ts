
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { scanLayouts } from "../src/utils/scan-layouts";

const TEST_DIR = path.resolve(process.cwd(), "test-scan-layouts");

describe("scanLayouts", () => {
  beforeAll(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR);
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  test("finds nested layouts", async () => {
    const struct = [
      "dir1/_layout.tsx",
      "dir2/subdir/_layout.ts",
      "_layout.jsx"
    ];

    for (const f of struct) {
      const p = path.join(TEST_DIR, f);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, "");
    }

    const results = await scanLayouts(TEST_DIR);

    expect(results).toHaveLength(3);
    const routes = results.map(r => r.route).sort();
    expect(routes).toEqual(["/", "/dir1", "/dir2/subdir"]);
  });

  test("prioritizes extensions correctly (tsx > ts > jsx > js)", async () => {
    const dir = path.join(TEST_DIR, "priority");
    fs.mkdirSync(dir, { recursive: true });

    // Create all 4 types
    fs.writeFileSync(path.join(dir, "_layout.js"), "");
    fs.writeFileSync(path.join(dir, "_layout.jsx"), "");
    fs.writeFileSync(path.join(dir, "_layout.ts"), "");
    fs.writeFileSync(path.join(dir, "_layout.tsx"), "");

    const results = await scanLayouts(TEST_DIR);
    const match = results.find(r => r.route === "/priority");

    expect(match).toBeDefined();
    expect(match!.filepath).toEndWith("_layout.tsx");
  });

  test("prioritizes ts over js", async () => {
      const dir = path.join(TEST_DIR, "ts-over-js");
      fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(path.join(dir, "_layout.js"), "");
      fs.writeFileSync(path.join(dir, "_layout.ts"), "");

      const results = await scanLayouts(TEST_DIR);
      const match = results.find(r => r.route === "/ts-over-js");

      expect(match).toBeDefined();
      expect(match!.filepath).toEndWith("_layout.ts");
    });

  test("handles empty directory", async () => {
    const emptyDir = path.join(TEST_DIR, "empty");
    fs.mkdirSync(emptyDir, { recursive: true });
    const results = await scanLayouts(emptyDir);
    expect(results).toEqual([]);
  });
});
