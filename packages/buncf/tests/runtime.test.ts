import { describe, it, expect } from "bun:test";
import runtimeFromSource from "../src/runtime";

describe("Runtime Worker Handler", () => {
  it("should handle requests using the initialized handler", async () => {
    expect(runtimeFromSource.fetch).toBeDefined();
    expect(typeof runtimeFromSource.fetch).toBe("function");
  });
});
