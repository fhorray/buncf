
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
  serve: (options: BunServeOptions) => {
    port: number;
    url: string;
    stop: () => void;
  };
  [key: string]: any; // Allow other native Bun properties (file, write, argv, etc)
}


// Extended Request interface for usage within handlers
export interface BunRequest extends Request {
  params?: Record<string, string>;
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
 * 
 * @example
 * ```typescript
 * // In your app's cloudflare-env.d.ts or a global.d.ts:
 * declare module "buncf" {
 *   interface BuncfTypeRegistry {
 *     // Your generated CloudflareEnv type
 *     env: CloudflareEnv;
 *     // Generated Routes
 *     routes: any;
 *   }
 * }
 * ```
 */
/**
 * Route Path Helper
 * Infers valid routes from BuncfTypeRegistry, or falls back to string.
 * Allows pure string for dynamic routes.
 */
// If routes is any (default), keyof routes is string | number | symbol.
// We want to verify if specific keys exist.
export type RegisteredRoutes = BuncfTypeRegistry extends { routes: infer R } ? R : {};
export type RoutePath = (keyof RegisteredRoutes & string) | (string & {});
export interface BuncfTypeRegistry {
  // Default: uses CloudflareEnvBase
}

/**
 * The resolved Cloudflare Environment type.
 * If the user has augmented BuncfTypeRegistry with an 'env' property, use that.
 * Otherwise, fall back to CloudflareEnvBase.
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
 * The `env` property is automatically typed based on your module augmentation.
 */
export interface CloudflareContext {
  env: CloudflareEnv;
  ctx: ExecutionContext;
  cf?: IncomingRequestCfProperties;
}
