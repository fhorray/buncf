import type { MiddlewareConfig } from "buncf";

export default [
  {
    name: "auth",
    matcher: ["/auth", "/auth/*"],
    handler: async (req, next) => {
      console.log("Auth middleware");
      const isAuthenticated = true;
      if (!isAuthenticated) {
        return new Response("Unauthorized", { status: 401 });
      }
      return next();
    }
  }
] satisfies MiddlewareConfig[];