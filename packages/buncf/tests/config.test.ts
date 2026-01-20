import { expect, test, describe, afterEach, beforeEach } from "bun:test";
import { loadConfig } from "../src/utils/config";
import * as fs from "fs";
import * as path from "path";

describe("Config Loader", () => {
  const configPath = path.resolve(process.cwd(), "buncf.config.ts");

  beforeEach(() => {
    if (fs.existsSync(configPath)) {
      fs.renameSync(configPath, configPath + ".bak");
    }
  });

  afterEach(() => {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    if (fs.existsSync(configPath + ".bak")) {
      fs.renameSync(configPath + ".bak", configPath);
    }
  });

  test("should return empty object if config file does not exist", async () => {
    const config = await loadConfig();
    expect(config).toEqual({});
  });

  test("should load plugins from buncf.config.ts", async () => {
    const mockPlugin = { name: "test-plugin", setup: () => { } };
    fs.writeFileSync(configPath, `export default { plugins: [{ name: "test-plugin" }] };`);

    const config = await loadConfig();
    expect(config.plugins).toBeDefined();
    expect(config.plugins?.[0].name).toBe("test-plugin");
  });

  test("should handle invalid config file gracefully", async () => {
    fs.writeFileSync(configPath, `throw new Error("fail");`);
    const config = await loadConfig();
    expect(config).toEqual({});
  });
});
