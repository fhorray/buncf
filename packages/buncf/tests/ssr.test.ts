import { describe, test, expect } from "bun:test";
import * as React from "react";
import { renderApp } from "../src/server/renderer";

describe("SSR Renderer", () => {
  test("renderApp returns a readable stream", async () => {
    const req = new Request("http://localhost/");

    // Mock Routes
    const routes = {
      "/": () => Promise.resolve({ default: () => React.createElement("div", null, "Hello SSR") })
    };
    const layouts = {};

    const res = await renderApp({
      request: req,
      routes,
      layouts,
      bootstrapScripts: ["/client.js"]
    });

    expect(res.headers.get("Content-Type")).toBe("text/html");
    expect(res.body).toBeDefined();

    // Read stream to text
    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html>"); // React 18 usually adds this or we should? 
    // Actually renderToReadableStream produces the stream. 
    // Our renderApp wraps it in <html> so it should be there.

    expect(html).toContain('<div id="root">');
    expect(html).toContain('src="/client.js"');
  });
});
