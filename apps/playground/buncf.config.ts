/**
 * Buncf Configuration for Playground App
 * 
 * Demonstrates the new advanced plugin system.
 */
import { cmsPlugin } from "./src/plugins/cms";
// import tailwind from "bun-plugin-tailwind"; // REMOVED to test auto-detection



export default {
  // Bun build plugins (for CSS processing, etc.)
  plugins: [
    // tailwind
  ],

  // High-level Buncf plugins (for routes, pages, middleware)
  buncfPlugins: [
    cmsPlugin({
      adminPath: "/admin",
    }),
  ],
};
