/**
 * API Scanner - Extracts route types from src/api files
 * 
 * This module scans API endpoint files and extracts type information
 * from defineHandler and defineBody calls to generate a typed API client.
 */

import * as fs from "fs";
import * as path from "path";

/**
 * Represents extracted type information from a single route handler
 */
export interface RouteTypeInfo {
  /** Route path like "/users/:id" */
  path: string;
  /** HTTP method */
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** TypeScript type string for params, e.g., "{ id: string }" */
  params?: string;
  /** TypeScript type string for request body */
  body?: string;
  /** TypeScript type string for response */
  response?: string;
  /** Original file path for imports */
  filePath: string;
}

/**
 * Scans an API file and extracts type parameters from defineHandler/defineBody calls
 * Uses regex-based parsing (simpler than full AST for our use case)
 */
function extractTypesFromFile(filePath: string, routePath: string): RouteTypeInfo[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const results: RouteTypeInfo[] = [];

  // Match: export const METHOD = defineHandler<ParamsType, ResponseType>(...)
  const handlerRegex = /export\s+(?:const|function)\s+(GET|POST|PUT|PATCH|DELETE)\s*=\s*defineHandler\s*<\s*([^,>]+)\s*(?:,\s*([^>]+))?\s*>/g;

  let match;
  while ((match = handlerRegex.exec(content)) !== null) {
    const [, method, paramsType, responseType] = match;
    results.push({
      path: routePath,
      method: method as RouteTypeInfo["method"],
      params: paramsType?.trim() || undefined,
      response: responseType?.trim() || undefined,
      filePath
    });
  }

  // Match: export const METHOD = defineBody<ParamsType, BodyType, ResponseType>(...)
  const bodyHandlerRegex = /export\s+(?:const|function)\s+(GET|POST|PUT|PATCH|DELETE)\s*=\s*defineBody\s*<\s*([^,>]+)\s*,\s*([^,>]+)\s*(?:,\s*([^>]+))?\s*>/g;

  while ((match = bodyHandlerRegex.exec(content)) !== null) {
    const [, method, paramsType, bodyType, responseType] = match;
    results.push({
      path: routePath,
      method: method as RouteTypeInfo["method"],
      params: paramsType?.trim() || undefined,
      body: bodyType?.trim() || undefined,
      response: responseType?.trim() || undefined,
      filePath
    });
  }

  // Fallback: Match simple exports without defineHandler (untyped)
  // export function GET(...) or export const GET = (...)
  if (results.length === 0) {
    const simpleExportRegex = /export\s+(?:const|function|async\s+function)\s+(GET|POST|PUT|PATCH|DELETE)/g;
    while ((match = simpleExportRegex.exec(content)) !== null) {
      const [, method] = match;
      results.push({
        path: routePath,
        method: method as RouteTypeInfo["method"],
        response: "unknown",
        filePath
      });
    }

    // Hono / Express Style Handler Detection (Best Effort)
    // Matches: .get("/path", ...) or .post('/path', ...)
    // We assume these are mounted under /api since we are scanning src/api
    const routerRegex = /\.(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/gi;
    while ((match = routerRegex.exec(content)) !== null) {
      if (!match[1] || !match[2]) continue;
      const method = match[1];
      const rawPath = match[2];
      const upperMethod = method.toUpperCase() as RouteTypeInfo["method"];

      // Normalize path: Ensure it starts with /api if not present
      // (Assuming Hono inside src/api is mounted at /api or relative to it)
      let fullPath = rawPath;
      if (!fullPath.startsWith("/")) fullPath = "/" + fullPath;
      if (!fullPath.startsWith("/api")) fullPath = "/api" + fullPath;

      results.push({
        path: fullPath,
        method: upperMethod,
        response: "unknown", // Cannot easily infer return type from regex
        filePath
      });
    }
  }

  return results;
}

/**
 * Converts file path to API route path
 * e.g., "users/[id].ts" -> "/users/:id"
 */
function filePathToRoutePath(filePath: string, apiDir: string): string {
  // Get relative path from api directory
  let relativePath = path.relative(apiDir, filePath);

  // Remove extension
  relativePath = relativePath.replace(/\.(ts|tsx|js|jsx)$/, "");

  // Handle index files
  if (relativePath.endsWith("index")) {
    relativePath = relativePath.slice(0, -5);
  }
  if (relativePath.endsWith("/") || relativePath.endsWith("\\")) {
    relativePath = relativePath.slice(0, -1);
  }

  // Convert [param] to :param
  relativePath = relativePath.replace(/\[([^\]]+)\]/g, ":$1");

  // Normalize slashes
  relativePath = relativePath.split(path.sep).join("/");

  // Ensure leading slash
  return "/api/" + relativePath;
}

/**
 * Scans all API files in the given directory and extracts type information
 */
export async function scanApiDirectory(apiDir: string): Promise<RouteTypeInfo[]> {
  const results: RouteTypeInfo[] = [];

  if (!fs.existsSync(apiDir)) {
    return results;
  }

  const glob = new Bun.Glob("**/*.{ts,tsx,js,jsx}");
  const files = Array.from(glob.scanSync({ cwd: apiDir, onlyFiles: true }));

  for (const file of files) {
    const filePath = path.resolve(apiDir, file);
    const routePath = filePathToRoutePath(filePath, apiDir);
    const fileTypes = extractTypesFromFile(filePath, routePath);
    results.push(...fileTypes);
  }

  return results;
}

/**
 * Groups routes by path for easier type generation
 */
export function groupRoutesByPath(routes: RouteTypeInfo[]): Map<string, RouteTypeInfo[]> {
  const grouped = new Map<string, RouteTypeInfo[]>();

  for (const route of routes) {
    const existing = grouped.get(route.path) || [];
    existing.push(route);
    grouped.set(route.path, existing);
  }

  return grouped;
}
