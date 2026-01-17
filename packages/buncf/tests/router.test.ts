import { describe, it, expect } from "bun:test";
import { createPagesRouter } from "../src/router/pages";

describe("Pages Router (Static Map Strategy)", () => {
  const staticRoutes = {
    "/": "src/pages/index.tsx",
    "/about": "src/pages/about.tsx",
    "/blog/[slug]": "src/pages/blog/[slug].tsx",
    "/users/[id]/profile": "src/pages/users/[id]/profile.tsx",
  };

  const router = createPagesRouter({
    dir: "./src/pages", // Mock dir
    staticRoutes,
  });

  it("should match root route", () => {
    const match = router.match(new Request("http://localhost/"));
    expect(match).not.toBeNull();
    expect(match?.pathname).toBe("/");
    expect(match?.filePath).toBe("src/pages/index.tsx");
  });

  it("should match static route", () => {
    const match = router.match(new Request("http://localhost/about"));
    expect(match).not.toBeNull();
    expect(match?.filePath).toBe("src/pages/about.tsx");
  });

  it("should match dynamic route with param", () => {
    const match = router.match(new Request("http://localhost/blog/hello-world"));
    expect(match).not.toBeNull();
    expect(match?.filePath).toBe("src/pages/blog/[slug].tsx");
    expect(match?.params).toEqual({ slug: "hello-world" });
  });

  it("should match nested dynamic route", () => {
    const match = router.match(new Request("http://localhost/users/123/profile"));
    expect(match).not.toBeNull();
    expect(match?.filePath).toBe("src/pages/users/[id]/profile.tsx");
    expect(match?.params).toEqual({ id: "123" });
  });

  it("should NOT match partial routes", () => {
    const match = router.match(new Request("http://localhost/blog")); // Missing slug
    expect(match).toBeNull();
  });

  it("should capture all query params", () => {
    const match = router.match(new Request("http://localhost/about?foo=bar&baz=123"));
    expect(match).not.toBeNull();
    expect(match?.query).toEqual({ foo: "bar", baz: "123" });
  });

  // Testing the trailing slash behavior explicitly
  it("should fail strictly on trailing slash without normalization", () => {
    // The router expects normalized paths.
    // matches /about
    const match = router.match(new Request("http://localhost/about/"));
    expect(match).toBeNull();
  });

  it("should match URL encoded dynamic params", () => {
    const match = router.match(new Request("http://localhost/blog/hello%20world"));
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({ slug: "hello%20world" });
  });
});
