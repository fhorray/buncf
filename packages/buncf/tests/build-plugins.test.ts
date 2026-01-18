import { describe, test, expect } from "bun:test";
import { serverActionsClientPlugin } from "../src/plugins/server-actions";
import * as fs from "fs";
import * as path from "path";

describe("Server Actions Build Plugins", () => {
  test("serverActionsClientPlugin transforms exports to fetch stubs", async () => {
    // Create a mock build object to capture the onLoad callback
    let onLoadCallback: any;
    const mockBuild = {
      onLoad: (options: any, callback: any) => {
        if (options.filter.test("test.action.ts")) {
          onLoadCallback = callback;
        }
      }
    };

    serverActionsClientPlugin.setup(mockBuild);
    expect(onLoadCallback).toBeDefined();

    // Mock an action file
    const actionPath = path.resolve(process.cwd(), "test-plugin.action.ts");
    fs.writeFileSync(actionPath, `
      export async function myAction(input) {}
      export const myConstAction = defineAction(s, async () => {});
    `);

    try {
      const result = await onLoadCallback({ path: actionPath });
      expect(result.loader).toBe("ts");
      expect(result.contents).toContain('export const myAction = async (input) => {');
      expect(result.contents).toContain('export const myConstAction = async (input) => {');
      expect(result.contents).toContain('fetch("/_action/');
      expect(result.contents).toContain('test-plugin.action.ts%3A%3AmyAction');
      expect(result.contents).toContain('test-plugin.action.ts%3A%3AmyConstAction');
    } finally {
      if (fs.existsSync(actionPath)) fs.unlinkSync(actionPath);
    }
  });

  test("serverActionsWorkerPlugin generates registry", async () => {
    let onLoadCallback: any;
    const mockBuild = {
      onResolve: () => { },
      onLoad: (options: any, callback: any) => {
        if (options.namespace === "buncf-actions") {
          onLoadCallback = callback;
        }
      }
    };

    const { serverActionsWorkerPlugin } = await import("../src/plugins/server-actions");
    serverActionsWorkerPlugin.setup(mockBuild);

    // Create a dummy action file
    const actionDir = path.resolve(process.cwd(), "src");
    if (!fs.existsSync(actionDir)) fs.mkdirSync(actionDir);
    const actionPath = path.resolve(actionDir, "test.action.ts");
    fs.writeFileSync(actionPath, `
      import { defineAction } from "../src/action";
      import { z } from "zod";
      export const myAction = defineAction(z.object({}), async () => {});
    `);

    try {
      const result = await onLoadCallback({ path: "actions-registry" });
      expect(result.loader).toBe("ts");
      expect(result.contents).toContain('import * as actionFile0 from');
      expect(result.contents).toContain('export const serverActions =');
      expect(result.contents).toContain('acc[`src/test.action.ts::${name}`] = val;');
    } finally {
      if (fs.existsSync(actionPath)) fs.unlinkSync(actionPath);
    }
  });
});
