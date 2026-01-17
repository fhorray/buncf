import { describe, it, expect } from "bun:test";
import { createRouteMatcher } from "../src/router/matcher";

describe("Route Matcher", () => {
  const routes = [
    { pattern: "/", data: "root" },
    { pattern: "/about", data: "about" },
    { pattern: "/users", data: "users-list" },
    { pattern: "/users/[id]", data: "user-detail" },
    { pattern: "/users/[id]/settings", data: "user-settings" },
    { pattern: "/blog/[slug]", data: "blog-post" },
    { pattern: "/files/[...path]", data: "file-catch-all" },
    { pattern: "/api/[version]/status", data: "api-status" },
  ];

  const matcher = createRouteMatcher(routes);

  it("should match static routes exactly", () => {
    expect(matcher.match("/")?.data).toBe("root");
    expect(matcher.match("/about")?.data).toBe("about");
    expect(matcher.match("/users")?.data).toBe("users-list");
  });

  it("should normalize trailing slash for static routes", () => {
    // The matcher expects normalized input, or handles normalization?
    // Implementation says: Normalize trailing slashes for static routes.
    // And match function: Normalize the path.
    expect(matcher.match("/about/")?.data).toBe("about");
  });

  it("should match dynamic routes with [param]", () => {
    const match = matcher.match("/users/123");
    expect(match?.data).toBe("user-detail");
    expect(match?.params).toEqual({ id: "123" });
  });

  it("should match strings with special chars in parameters", () => {
    const match = matcher.match("/blog/hello-world_123");
    expect(match?.data).toBe("blog-post");
    expect(match?.params).toEqual({ slug: "hello-world_123" });
  });

  it("should match nested dynamic routes", () => {
    const match = matcher.match("/users/456/settings");
    expect(match?.data).toBe("user-settings");
    expect(match?.params).toEqual({ id: "456" });
  });

  it("should match catch-all routes [...path]", () => {
    const match1 = matcher.match("/files/images/logo.png");
    expect(match1?.data).toBe("file-catch-all");
    expect(match1?.params).toEqual({ path: "images/logo.png" });

    const match2 = matcher.match("/files/deeply/nested/resource");
    expect(match2?.data).toBe("file-catch-all");
    expect(match2?.params).toEqual({ path: "deeply/nested/resource" });
  });

  it("should prioritize static routes over dynamic", () => {
    // Assuming we had conflict. 
    // Let's create a conflicting matcher
    const conflictingRoutes = [
      { pattern: "/posts/new", data: "static-new" },
      { pattern: "/posts/[slug]", data: "dynamic-slug" },
    ];
    const m = createRouteMatcher(conflictingRoutes);

    expect(m.match("/posts/new")?.data).toBe("static-new");
    expect(m.match("/posts/old")?.data).toBe("dynamic-slug");
  });

  it("should prioritize specific dynamic routes over catch-all", () => {
    const specificVsCatchAll = [
      { pattern: "/docs/[...slug]", data: "catch-all" },
      { pattern: "/docs/intro", data: "static-intro" },
      { pattern: "/docs/[category]/list", data: "dynamic-list" },
    ];
    const m = createRouteMatcher(specificVsCatchAll);

    // Static wins
    expect(m.match("/docs/intro")?.data).toBe("static-intro");

    // Specific dynamic wins? 
    // /docs/api/list -> matches [category]/list AND [...slug]
    // Our sort logic puts [...slug] LAST.
    expect(m.match("/docs/api/list")?.data).toBe("dynamic-list");
    expect(m.match("/docs/api/list")?.params).toEqual({ category: "api" });

    // Catch-all fallthrough
    expect(m.match("/docs/some/other/path")?.data).toBe("catch-all");
  });

  it("should handle mixed params :key and [key]", () => {
    // :key support is also in matcher.ts
    const m = createRouteMatcher([{ pattern: "/legacy/:id", data: "legacy" }]);
    expect(m.match("/legacy/999")?.data).toBe("legacy");
    expect(m.match("/legacy/999")?.params).toEqual({ id: "999" });
  });

  it("should return null for no match", () => {
    expect(matcher.match("/unknown")).toBeNull();
    expect(matcher.match("/users/123/unknown")).toBeNull();
  });
});
