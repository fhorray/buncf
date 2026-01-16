/**
 * Route Manifest
 * Maps route patterns to dynamic imports
 */
import { type ComponentType } from "react";

export const routes: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  "/": () => import("./pages/index"),
  "/about": () => import("./pages/about"),
  "/blog/[slug]": () => import("./pages/blog/[slug]"),
  "/users": () => import("./pages/users/index"),
};
