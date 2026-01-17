/**
 * Codegen Entry Point
 * 
 * Re-exports all codegen functionality for CLI usage.
 */

export { scanApiDirectory, groupRoutesByPath, type RouteTypeInfo } from "./api-scanner";
export { generateApiTypes, generateTypesContent } from "./generate-types";
export { generateApiClient, generateClientContent } from "./generate-client";

import * as path from "path";
import { scanApiDirectory } from "./api-scanner";
import { generateApiTypes } from "./generate-types";
import { generateApiClient } from "./generate-client";

/**
 * Main function to generate all API types and client
 * Called by CLI during dev and build
 */
export async function generateAllApiTypes(
  cwd: string = process.cwd(),
  options: { verbose?: boolean } = {}
): Promise<{ routeCount: number }> {
  const apiDir = path.resolve(cwd, "src/api");
  const outputDir = path.resolve(cwd, ".buncf");

  // Scan API files
  const routes = await scanApiDirectory(apiDir);

  if (options.verbose) {
    console.log(`[typegen] Found ${routes.length} route handlers in src/api`);
    for (const route of routes) {
      console.log(`  ${route.method} ${route.path}`);
    }
  }

  // Generate types file
  await generateApiTypes(routes, outputDir);

  // Generate client file
  await generateApiClient(outputDir);

  return { routeCount: routes.length };
}
