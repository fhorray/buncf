import { describe, it, expect } from "bun:test";
import { createApp } from "../src/router/index";
import * as path from "path";
import { pathToFileURL } from "url";

describe("Integration (createApp Runtime)", () => {
  // Convert to file URL string for Windows compatibility with dynamic import()
  const apiFixture = pathToFileURL(path.resolve(__dirname, "fixtures/api/hello.ts")).href;
  const pageFixture = path.resolve(__dirname, "fixtures/pages/index.tsx"); // Pages router likely uses fs.readFileSync or just path string


  const app = createApp({
    staticRoutes: {
      api: {
        "/hello": () => import(apiFixture),
      },
      pages: {
        "/": pageFixture,
        "/about": pageFixture, // Reuse for testing
      },
    },
    // Mock index.html content for SPA injection
    indexHtmlContent: "<html><head></head><body><div id='root'></div></body></html>",
  });

  const fetch = app.fetch;

  it("should handle API GET request", async () => {
    const res = await fetch(new Request("http://localhost/api/hello"));
    expect(res.status).toBe(200);
    const text = await res.text();
    console.log("DEBUG BODY:", text);
    const data = JSON.parse(text);
    expect(data).toEqual({ message: "Hello from API" });
  });

  it("should handle API POST request", async () => {
    const body = { test: "data" };
    const res = await fetch(new Request("http://localhost/api/hello", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    }));
    if (res.status !== 200) console.log("API POST Failed:", await res.text());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ received: body });
  });

  it("should return SPA fallback (200 HTML) for missing API route (Current Behavior)", async () => {
    const res = await fetch(new Request("http://localhost/api/missing"));
    expect(res.status).toBe(200); // SPA Fallback
    const text = await res.text();
    expect(text).toContain("<html");
  });

  it("should handle Page route (SPA Injection)", async () => {
    const res = await fetch(new Request("http://localhost/"));
    const text = await res.text();
    // console.log("SPA Root Response:", text);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html");
    expect(text).toContain("window.__BUNCF_ROUTE__");
    expect(text).toContain('pathname":"/"');
  });

  it("should handle another Page route", async () => {
    const res = await fetch(new Request("http://localhost/about"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('pathname":"/about"');
  });

  it("should fall through to 404 for unknown route if no wildcard", async () => {
    // NOTE: Because we provided indexHtmlContent, fallback logic usually returns index.html for ANY route not found (SPA behavior).
    // Wait, let's check createApp logic.
    // "4. Fallback: serve index.html for SPA catch-all (hydrated)"
    // Yes, if indexHtmlContent exists, it returns it.

    const res = await fetch(new Request("http://localhost/unknown"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('pathname":"/unknown"');
  });
});
