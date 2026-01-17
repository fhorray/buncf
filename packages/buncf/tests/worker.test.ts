import { describe, it, expect, beforeEach, mock } from "bun:test";
import worker, { __BunShim__ } from "../src/runtime";
import type { CloudflareEnv } from "../src/types";

// --- Mocks ---

// Mock Cloudflare Environment
const mockEnv: CloudflareEnv = {
  ASSETS: {
    fetch: mock(async (req: Request) => {
      const url = new URL(req.url);
      if (url.pathname === "/style.css") {
        return new Response("body { color: red; }", { headers: { "Content-Type": "text/css" } });
      }
      return new Response("Not Found", { status: 404 });
    }),
  },
  MY_VAR: "test-value",
};

// Mock ExecutionContext
interface MockExecutionContext {
  waitUntil: (promise: Promise<any>) => void;
  passThroughOnException: () => void;
}

const mockCtx: MockExecutionContext = {
  waitUntil: mock((promise: Promise<any>) => {
    return promise;
  }),
  passThroughOnException: mock(() => { }),
};

describe("Cloudflare Worker Runtime (Bun Adapter)", () => {

  beforeEach(() => {
    // Reset logic handled by overwriting serve
  });

  it("should initialize Bun shim globally", () => {
    expect(__BunShim__).toBeDefined();
    expect(__BunShim__.serve).toBeDefined();
  });

  it("should sync environment variables from Env to Bun.env", async () => {
    __BunShim__.serve({ fetch: () => new Response("OK") });
    await worker.fetch(new Request("http://localhost/"), mockEnv, mockCtx);

    const bunEnv = __BunShim__.env;
    expect(bunEnv).toBeDefined();
    expect(bunEnv.MY_VAR).toBe("test-value");
  });

  it("should handle User Handler", async () => {
    __BunShim__.serve({
      fetch: () => new Response("User Response"),
    });

    const res = await worker.fetch(new Request("http://localhost/"), mockEnv, mockCtx);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("User Response");
  });

  it("should handle ASSETS fallback (when User Handler 404s)", async () => {
    __BunShim__.serve({
      fetch: () => new Response("Not Found", { status: 404 }),
      assetPrefix: "assets"
    });

    const req = new Request("http://localhost/assets/style.css");
    const res = await worker.fetch(req, mockEnv, mockCtx);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/css");
    expect(await res.text()).toBe("body { color: red; }");
  });

  it("should return User 404 if Asset also missing", async () => {
    __BunShim__.serve({
      fetch: () => new Response("User 404", { status: 404 }),
    });

    const req = new Request("http://localhost/missing.png");
    const res = await worker.fetch(req, mockEnv, mockCtx);

    expect(res.status).toBe(404);
    expect(await res.text()).toBe("User 404");
  });

  it("should handle custom error handler", async () => {
    // Suppress expected console error
    const originalError = console.error;
    console.error = () => { };

    try {
      __BunShim__.serve({
        fetch: async () => { throw new Error("Boom"); },
        error: async (err: Error) => new Response(`Custom Error: ${err.message}`, { status: 500 })
      });

      const res = await worker.fetch(new Request("http://localhost/crash"), mockEnv, mockCtx);
      expect(res.status).toBe(500);
      expect(await res.text()).toBe("Custom Error: Boom");
    } finally {
      console.error = originalError;
    }
  });

  it("should use default 500 if error handler throws or missing", async () => {
    // Suppress expected console error
    const originalError = console.error;
    console.error = () => { };

    try {
      __BunShim__.serve({
        fetch: async () => { throw new Error("Boom2"); },
      });

      const res = await worker.fetch(new Request("http://localhost/crash2"), mockEnv, mockCtx);
      expect(res.status).toBe(500);
      expect(await res.text()).toBe("Boom2");
    } finally {
      console.error = originalError;
    }
  });

});
