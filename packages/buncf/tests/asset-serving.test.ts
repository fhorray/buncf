import { describe, it, expect } from "bun:test";
import * as path from "path";
import * as fs from "fs/promises";

describe("Static Asset Serving", () => {
  const assetsDir = path.resolve(process.cwd(), ".buncf/cloudflare/assets");
  const testFilePath = path.join(assetsDir, "test.txt");
  const testFileContent = "hello world";

  // Simulate the dev server's ASSETS binding
  let assetsBinding: any;

  async function setup() {
    // Dynamically import the dev server logic AFTER tests have started
    const { initBuncfDev } = await import("../src/dev");
    await initBuncfDev();
    const { getDevContext } = await import("../src/dev");
    assetsBinding = getDevContext()?.env.ASSETS;

    // Create a dummy asset file
    await fs.mkdir(assetsDir, { recursive: true });
    await fs.writeFile(testFilePath, testFileContent);
  }

  async function teardown() {
    await fs.unlink(testFilePath).catch(() => {});
    await fs.rmdir(assetsDir).catch(() => {});
  }

  it("should serve a static file when it exists", async () => {
    await setup();
    expect(assetsBinding).toBeDefined();

    const req = new Request("http://localhost/test.txt");
    const res = await assetsBinding.fetch(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe(testFileContent);
    // Bun's Response from a file might include charset, so we'll be more flexible
    expect(res.headers.get("Content-Type")).toMatch(/^text\/plain/);

    await teardown();
  });

  it("should serve index.html for a directory request", async () => {
    await setup();
    const indexHtmlPath = path.join(assetsDir, "index.html");
    const indexHtmlContent = "<h1>Index</h1>";
    await fs.writeFile(indexHtmlPath, indexHtmlContent);

    const req = new Request("http://localhost/"); // Requesting the root (directory)
    const res = await assetsBinding.fetch(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe(indexHtmlContent);
    expect(res.headers.get("Content-Type")).toMatch(/^text\/html/);

    await fs.unlink(indexHtmlPath);
    await teardown();
  });

  it("should serve index.html as a fallback for a non-existent file (SPA behavior)", async () => {
    await setup();
    const indexHtmlPath = path.join(assetsDir, "index.html");
    const indexHtmlContent = "<h1>SPA Fallback</h1>";
    await fs.writeFile(indexHtmlPath, indexHtmlContent);

    const req = new Request("http://localhost/non-existent-page");
    const res = await assetsBinding.fetch(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe(indexHtmlContent);

    await fs.unlink(indexHtmlPath);
    await teardown();
  });

  it("should return 404 if no file and no index.html exists", async () => {
    await setup();
    // Ensure no index.html exists for this test
    const indexHtmlPath = path.join(assetsDir, "index.html");
    await fs.unlink(indexHtmlPath).catch(() => {});


    const req = new Request("http://localhost/another-missing-file");
    const res = await assetsBinding.fetch(req);

    expect(res.status).toBe(404);

    await teardown();
  });
});
