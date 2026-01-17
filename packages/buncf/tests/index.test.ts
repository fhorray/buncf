import { describe, it, expect, beforeEach } from "bun:test";
import { bunToCloudflare } from "../src/plugin";
import * as path from "path";

describe("bunToCloudflare plugin", () => {
  const entry = path.resolve(process.cwd(), "index.ts");
  const plugin = bunToCloudflare(entry);
  const setup = plugin.setup as any;

  // Mock build object
  const buildMock = {
    onLoad: (options: any, callback: any) => {
      buildMock.options = options;
      buildMock.callback = callback;
    },
    options: null as any,
    callback: null as any,
  };

  beforeEach(() => {
    buildMock.options = null;
    buildMock.callback = null;
    setup(buildMock);
  });

  it("should match TS and JS files", () => {
    expect(buildMock.options.filter.test("test.ts")).toBe(true);
    expect(buildMock.options.filter.test("test.js")).toBe(true);
    expect(buildMock.options.filter.test("test.tsx")).toBe(true);
    expect(buildMock.options.filter.test("test.jsx")).toBe(true);
    expect(buildMock.options.filter.test("test.json")).toBe(false);
  });

  it("should rewrite bun imports to shim", async () => {
    const originalCode = `import { serve } from "bun";\nconsole.log(serve);`;

    // Mock Bun.file
    const originalFile = globalThis.Bun.file;
    globalThis.Bun.file = ((pathUri: string) => {
      // Strict check for entry file to avoid returning code for index.html lookup
      if (path.resolve(pathUri) === entry) {
        return {
          text: async () => originalCode,
          exists: async () => true
        };
      }
      if (pathUri.includes("runtime.")) return originalFile(pathUri);
      return {
        text: async () => "",
        exists: async () => false
      };
    }) as any;

    const result = await buildMock.callback({ path: entry });

    // Restore Bun.file
    globalThis.Bun.file = originalFile;

    // Use regex to be flexible with whitespace
    expect(result.contents).toMatch(/const\s*{\s*serve\s*}\s*=\s*__BunShim__;/);
    expect(result.contents).not.toContain('import { serve } from "bun";');
  });

  it("should rewrite default bun import", async () => {
    const originalCode = `import Bun from "bun";\nconsole.log(Bun.serve);`;

    // Mock Bun.file
    const originalFile = globalThis.Bun.file;
    globalThis.Bun.file = ((pathUri: string) => {
      // Strict check for entry file to avoid returning code for index.html lookup
      if (path.resolve(pathUri) === entry) {
        return {
          text: async () => originalCode,
          exists: async () => true
        };
      }
      if (pathUri.includes("runtime.")) return originalFile(pathUri);
      return {
        text: async () => "",
        exists: async () => false
      };
    }) as any;

    const result = await buildMock.callback({ path: entry });

    // Restore Bun.file
    globalThis.Bun.file = originalFile;

    expect(result.contents).toContain('const Bun = __BunShim__;');
    expect(result.contents).not.toContain('import Bun from "bun";');
  });

  it("should inject runtime when Bun.serve is present", async () => {
    const originalCode = `export default Bun.serve({ port: 3000 });`;

    // Mock Bun.file
    const originalFile = globalThis.Bun.file;
    globalThis.Bun.file = ((pathUri: string) => {
      // Strict check for entry file to avoid returning code for index.html lookup
      if (path.resolve(pathUri) === entry) {
        return {
          text: async () => originalCode,
          exists: async () => true
        };
      }
      if (pathUri.includes("runtime.")) return originalFile(pathUri);
      return {
        text: async () => "",
        exists: async () => false
      };
    }) as any;

    const result = await buildMock.callback({ path: entry });

    // Restore Bun.file
    globalThis.Bun.file = originalFile;

    expect(result.contents).toContain('// --- INJECTED RUNTIME');
    expect(result.contents).toContain('// --- WORKER EXPORT ---');
    expect(result.contents).toContain('const __worker_export__ =');
  });
});
