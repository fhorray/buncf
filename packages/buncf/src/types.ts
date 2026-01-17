
// --- TYPE DEFINITIONS ---

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
  assetPrefix?: string; // Custom config for Point 4
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

// --- GLOBAL MODULE AUGMENTATION ---



