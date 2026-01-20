import type { BuncfPlugin, BuncfPluginContext, BuncfPluginSetupResult, MiddlewareConfig } from "./types";
import type { BunPlugin } from "bun";

/**
 * Aggregated result of initializing all Buncf plugins.
 */
export interface PluginRegistryResult {
  /** Combined route handler for all plugin routes */
  routeHandler: ((req: Request, ctx: BuncfPluginContext) => Promise<Response | null>) | null;

  /** Combined middleware from all plugins */
  middleware: MiddlewareConfig[];

  /** Combined assets mapping from all plugins */
  assets: Record<string, string>;

  /** Combined pages from all plugins */
  pages: Record<string, () => Promise<{ default: React.ComponentType }>>;

  /** Combined Bun plugins for build process */
  buildPlugins?: BunPlugin[];
}

/**
 * Initialize and aggregate all Buncf plugins.
 * 
 * @param plugins - Array of BuncfPlugin instances
 * @returns Aggregated routes, middleware, assets, and pages
 */
export async function initializePlugins(
  plugins: BuncfPlugin<any>[]
): Promise<PluginRegistryResult> {
  const result: PluginRegistryResult = {
    routeHandler: null,
    middleware: [],
    assets: {},
    pages: {},
  };

  if (!plugins || plugins.length === 0) {
    return result;
  }

  const pluginHandlers: Array<{
    basePath: string;
    handler: (req: Request, ctx: BuncfPluginContext) => Response | Promise<Response>;
  }> = [];

  for (const plugin of plugins) {
    try {
      console.log(`[buncf] Initializing plugin: ${plugin.name}`);

      const setupResult: BuncfPluginSetupResult = await plugin.setup({});

      // Collect routes
      if (setupResult.routes) {
        const basePath = plugin.basePath || `/_plugins/${plugin.name}`;
        pluginHandlers.push({
          basePath: basePath.endsWith("/") ? basePath.slice(0, -1) : basePath,
          handler: setupResult.routes,
        });
      }

      // Collect middleware
      if (setupResult.middleware) {
        result.middleware.push(...setupResult.middleware);
      }

      // Collect assets
      if (setupResult.assets) {
        Object.assign(result.assets, setupResult.assets);
      }

      // Collect pages
      if (setupResult.pages) {
        Object.assign(result.pages, setupResult.pages);
      }

      // Collect build plugins
      if (setupResult.buildPlugins) {
        result.buildPlugins = result.buildPlugins || [];
        result.buildPlugins.push(...setupResult.buildPlugins);
      }
    } catch (error) {
      console.error(`[buncf] Failed to initialize plugin ${plugin.name}:`, error);
    }
  }

  // Create combined route handler
  if (pluginHandlers.length > 0) {
    result.routeHandler = async (req: Request, ctx: BuncfPluginContext): Promise<Response | null> => {
      const url = new URL(req.url);
      const pathname = url.pathname;

      for (const { basePath, handler } of pluginHandlers) {
        if (pathname.startsWith(basePath)) {
          // Rewrite the URL to remove the base path for the plugin handler
          const newUrl = new URL(req.url);
          newUrl.pathname = pathname.slice(basePath.length) || "/";
          const rewrittenRequest = new Request(newUrl.toString(), req);

          try {
            const response = await handler(rewrittenRequest, ctx);
            if (response.status !== 404) {
              return response;
            }
          } catch (error) {
            console.error(`[buncf] Plugin route error:`, error);
          }
        }
      }

      return null; // No plugin handled this request
    };
  }

  return result;
}
