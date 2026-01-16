import type { BunPlugin } from "bun";

/**
 * Configuration for the buncf build process
 */
export interface BuncfConfig {
  /** Directory containing static assets (default: "public" or "src/public") */
  publicDir?: string;
  /** Output directory for built assets (default: ".buncf/assets") */
  assetsDir?: string;
  /** Output directory for worker (default: ".buncf") */
  outDir?: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * HTTP method handler function
 */
export type RouteHandlerFn = (req: Request) => Response | Promise<Response>;

/**
 * Per-method route handlers
 */
export interface MethodHandlers {
  GET?: RouteHandlerFn;
  POST?: RouteHandlerFn;
  PUT?: RouteHandlerFn;
  PATCH?: RouteHandlerFn;
  DELETE?: RouteHandlerFn;
  HEAD?: RouteHandlerFn;
  OPTIONS?: RouteHandlerFn;
  /** Default handler for unmatched methods */
  default?: RouteHandlerFn | string;
}

/**
 * Route handler can be:
 * - A function that returns a Response
 * - An object with method-specific handlers
 * - A string path to a static asset
 */
export type RouteHandler = RouteHandlerFn | MethodHandlers | string;

/**
 * Routes configuration object
 * Keys are URL patterns (e.g., "/api/users/:id")
 * Values are handlers
 */
export type Routes = Record<string, RouteHandler>;

/**
 * Extended Request with route parameters
 */
export interface BuncfRequest extends Request {
  params: Record<string, string>;
}

/**
 * Bun.serve options compatible with buncf
 */
export interface ServeOptions {
  /** Route definitions */
  routes?: Routes;
  /** Custom fetch handler (alternative to routes) */
  fetch?: (req: Request) => Response | Promise<Response>;
  /** Port number (used in local dev, ignored on Cloudflare) */
  port?: number;
}

/**
 * The main buncf plugin for Bun.build
 */
export declare function bunToCloudflare(config?: BuncfConfig): BunPlugin;
