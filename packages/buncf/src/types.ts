
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

// Cloudflare Environment Types
export interface CloudflareEnv {
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
  [key: string]: any;
}


