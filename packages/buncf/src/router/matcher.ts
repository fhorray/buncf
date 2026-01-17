/**
 * Shared Route Matcher Utility
 * 
 * Creates a fast route matcher from a list of route patterns.
 * Supports both static routes (O(1) lookup) and dynamic routes (regex matching).
 */

export interface MatchResult {
  pattern: string;
  params: Record<string, string>;
  data?: any;
}

export interface RouteDefinition<T = any> {
  pattern: string;
  data?: T;
}

interface CompiledRoute<T> {
  regex: RegExp;
  paramNames: string[];
  pattern: string;
  data?: T;
}

/**
 * Creates a route matcher from a list of route definitions.
 * Optimizes for O(1) static route lookups with fallback to regex for dynamic routes.
 */
export function createRouteMatcher<T = any>(routes: RouteDefinition<T>[]) {
  const staticRoutes = new Map<string, RouteDefinition<T>>();
  const dynamicRoutes: CompiledRoute<T>[] = [];

  // Helper to escape regex special characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  for (const route of routes) {
    const { pattern } = route;
    const hasDynamic = pattern.includes(':') || pattern.includes('[');

    if (hasDynamic) {
      const paramNames: string[] = [];

      // 1. Escape the pattern partially or fully? 
      // We need to recognize [param] and :param. 
      // If we escape first, [ becomes \[.

      let regexPath = pattern;

      // Strategy: Split by dynamic segments, escape static parts, then join.
      // But simpler: Replace dynamic parts with a placeholder, escape the rest, then put regex back.
      // Or: Use a precise regex that matches [param] | :param | static.

      const segments = [];
      let lastIndex = 0;
      const placerRegex = /(\[\.\.\.([a-zA-Z0-9_]+)\])|(\[([a-zA-Z0-9_]+)\])|(:([a-zA-Z0-9_]+))/g;
      let match;

      while ((match = placerRegex.exec(pattern)) !== null) {
        // Static content before this match
        const staticPart = pattern.slice(lastIndex, match.index);
        if (staticPart) segments.push(escapeRegex(staticPart));

        if (match[2]) {
          // [...param] -> (.*)
          paramNames.push(match[2]);
          segments.push('(.*)');
        } else if (match[4]) {
          // [param] -> ([^/]+)
          paramNames.push(match[4]);
          segments.push('([^/]+)');
        } else if (match[6]) {
          // :param -> ([^/]+)
          paramNames.push(match[6]);
          segments.push('([^/]+)');
        }
        lastIndex = placerRegex.lastIndex;
      }

      // Remaining static content
      const remaining = pattern.slice(lastIndex);
      if (remaining) segments.push(escapeRegex(remaining));

      regexPath = segments.join('');
      const regex = new RegExp(`^${regexPath}\\/?$`);
      dynamicRoutes.push({ regex, paramNames, pattern, data: route.data });
    } else {
      const normalizedPattern = pattern.endsWith('/') && pattern !== '/'
        ? pattern.slice(0, -1)
        : pattern;
      staticRoutes.set(normalizedPattern, route);
    }
  }

  // Sort dynamic routes: Specific (more segments/longer static) > Catch-all
  dynamicRoutes.sort((a, b) => {
    // 1. Penalize catch-all (.*)
    const aCatchAll = a.regex.source.includes('(.*)');
    const bCatchAll = b.regex.source.includes('(.*)');
    if (aCatchAll && !bCatchAll) return 1;
    if (!aCatchAll && bCatchAll) return -1;

    // 2. Sort by length descending (more specific usually matches first/better? actually specific should be first)
    // Actually, in linear regex match, first match wins. 
    // We want /blog/post to match /blog/:slug, not /:any/:any
    // But here we rely on the user order usually? 
    // No, file system order is arbitrary.
    // Let's rely on segment count? 
    // Simple heuristic: Catch-all last.
    return 0;
  });

  /**
   * Match a path against the compiled routes
   */
  function match(path: string): MatchResult | null {
    // Normalize the path
    const normalizedPath = path.endsWith('/') && path !== '/'
      ? path.slice(0, -1)
      : path;

    // 1. Fast static lookup (O(1))
    const staticMatch = staticRoutes.get(normalizedPath);
    if (staticMatch) {
      return {
        pattern: staticMatch.pattern,
        params: {},
        data: staticMatch.data,
      };
    }

    // 2. Dynamic route matching
    for (const route of dynamicRoutes) {
      const matches = normalizedPath.match(route.regex);
      if (matches) {
        const params: Record<string, string> = {};
        matches.slice(1).forEach((val, i) => {
          const paramName = route.paramNames[i];
          if (paramName !== undefined) {
            params[paramName] = val;
          }
        });
        return {
          pattern: route.pattern,
          params,
          data: route.data,
        };
      }
    }

    return null;
  }

  /**
   * Get all registered patterns
   */
  function getPatterns(): string[] {
    const patterns = [...staticRoutes.keys()];
    patterns.push(...dynamicRoutes.map(r => r.pattern));
    return patterns;
  }

  return {
    match,
    getPatterns,
    staticCount: staticRoutes.size,
    dynamicCount: dynamicRoutes.length,
  };
}
