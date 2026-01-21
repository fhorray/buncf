
// --- TYPE DEFINITIONS ---

import type { BunPlugin } from "bun";

export type BunHandlerFunction = (req: BunRequest) => Response | Promise<Response>;

export interface BunHandlerObject {
  [method: string]: BunHandlerFunction | string | undefined;
  default?: string; // For asset module default exports
}

export type BunRouteHandler = BunHandlerFunction | BunHandlerObject | string;


export interface BunServeOptions {
  port?: number | string;
  hostname?: string;
  baseURI?: string;
  routes?: Record<string, BunRouteHandler>;
  fetch?: (req: Request, server: any) => Response | Promise<Response>;
  error?: (error: Error) => Response | Promise<Response>;
  assetPrefix?: string; // Custom config
  development?: boolean;
}

export interface BunShimType {
  env: Record<string, string | undefined>;
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
  serve: (options: BunServeOptions) => {
    port: number;
    url: string;
    stop: () => void;
  };
  file?: (path: string) => any;
  write?: (path: string, content: any) => Promise<any>;
  [key: string]: any;
}


// Extended Request interface for usage within handlers
export interface BunRequest extends Request {
  params?: Record<string, string>;
}

// --- MIDDLEWARE TYPES ---

export type MiddlewareNext = () => Promise<Response>;

export interface MiddlewareConfig {
  name?: string;
  // URLPattern string (e.g. "/api/*", "/users/:id") or array of strings.
  // If undefined, matches ALL requests.
  matcher?: string | string[];
  handler: (req: Request, next: MiddlewareNext) => Response | Promise<Response>;
}

// --- CLOUDFLARE ENVIRONMENT TYPES ---

/**
 * Base Cloudflare Environment interface.
 * 
 * Users should NOT modify this directly. Instead, use module augmentation
 * to override the `Env` type in `BuncfTypeRegistry`.
 */
export interface CloudflareEnvBase {
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
  [key: string]: any;
}

/**
 * Type registry for Buncf. Users can augment this to customize types globally.
 */
export interface BuncfTypeRegistry {
  // Default: uses CloudflareEnvBase
}

// Route Path Helper
export type RegisteredRoutes = BuncfTypeRegistry extends { routes: infer R } ? R : {};
export type RoutePath = (keyof RegisteredRoutes & string) | (string & {});

/**
 * The resolved Cloudflare Environment type.
 */
export type CloudflareEnv = BuncfTypeRegistry extends { env: infer E } ? E : CloudflareEnvBase;


// Cloudflare ExecutionContext
export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

// Minimal CF Properties
export interface IncomingRequestCfProperties {
  [key: string]: any;
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
}

/**
 * CloudflareContext is the main context object available within request handlers.
 */
export interface CloudflareContext {
  env: CloudflareEnv;
  ctx: ExecutionContext;
  cf?: IncomingRequestCfProperties;
}


// --- LOADER & META TYPES ---

export interface LoaderArgs {
  params: Record<string, string>;
  query: Record<string, string>;
  request?: Request; // Request object available in SSR/Action loaders
}

export type LoaderFunction<T = any> = (args: LoaderArgs) => Promise<T> | T;

export interface MetaArgs<data = any> {
  data: data;
  params: Record<string, string>;
  query: Record<string, string>;
}

export interface MetaTag {
  [key: string]: string | undefined;
  title?: string;
  name?: string;
  property?: string;
  content?: string;
  charset?: string;
}

export type MetaFunction<data = any> = (args: MetaArgs<data>) => MetaTag[] | MetaTag;


// --- BUNCF PLUGIN TYPES ---

/**
 * Context passed to plugin route handlers.
 */
export interface BuncfPluginContext {
  /** The Cloudflare environment bindings */
  env: CloudflareEnv;
  /** The Cloudflare execution context */
  ctx: ExecutionContext;
  /** The original request */
  request: Request;
}

/**
 * A Unified Buncf Plugin.
 *
 * Extends the standard BunPlugin to add runtime capabilities.
 * These plugins can be passed directly to `createApp({ plugins: [...] })`.
 */
export interface BuncfPlugin extends BunPlugin {
  /**
   * Base path for all plugin routes (e.g., "/admin").
   * If provided, plugin routes will be mounted under this path.
   */
  basePath?: string;

  /**
   * Runtime route handler.
   * Called for requests matching the plugin's scope (or all if no basePath).
   */
  routes?: (req: Request, ctx: BuncfPluginContext) => Response | Promise<Response>;

  /**
   * Middleware to apply to the application.
   */
  middlewares?: MiddlewareConfig[];

  /**
   * Static assets to copy to the output directory.
   * Map of { "virtual path": "absolute source path" }
   */
  assets?: Record<string, string>;

  /**
   * Pages to inject into the client-side router.
   * Map of { "route": () => import("./MyPage") }
   */
  pages?: Record<string, () => Promise<{ default: React.ComponentType }>>;

  /**
   * Layouts to inject into the client-side router.
   */
  layouts?: Record<string, () => Promise<{ default: React.ComponentType }>>;
}

/**
 * Helper to define a Buncf Plugin.
 */
export function defineBuncfPlugin(plugin: BuncfPlugin): BuncfPlugin {
  return plugin;
}
