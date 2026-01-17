import { describe, it, expect, mock } from "bun:test";
import { getCloudflareContext, runWithCloudflareContext } from "../src/context";
import { initBuncfDev, getDevContext } from "../src/dev";

describe("Cloudflare Context", () => {
  it("should throw if called outside context and no dev init", () => {
    expect(() => getCloudflareContext()).toThrow("getCloudflareContext() called outside of request context");
  });

  it("should return context when running inside runWithCloudflareContext", () => {
    const mockEnv = { MY_KV: "value" };
    const mockCtx = { waitUntil: () => { }, passThroughOnException: () => { } };
    const mockCf = { country: "US" };

    runWithCloudflareContext({ env: mockEnv, ctx: mockCtx, cf: mockCf }, () => {
      const ctx = getCloudflareContext();
      expect(ctx.env).toEqual(mockEnv);
      expect(ctx.ctx).toEqual(mockCtx);
      expect(ctx.cf).toEqual(mockCf);
    });
  });

  // We can't easily test initBuncfDev fully because it imports 'miniflare' which might not be installed or slow.
  // But we can test the fallback logic if we assume initBuncfDev was called (by manually mocking devContext if possible, 
  // but devContext variable is not exported for writing).
  // We can't mock the module internal state easily without rewiring.
  // So we'll skip dev mode fallback test here unless we export a setter for testing.
  // Or we can mock `getDevContext` if we mocked the module?
  // bun:test relies on ES modules, hard to mock internal state of another module.

  // However, we can verify that getCloudflareContext calls getDevContext fallback.
});
