import type { BuncfPlugin, BuncfPluginContext, MiddlewareConfig } from "./types";
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

  buildPlugins: BunPlugin[];
}

/**
 * Initialize and aggregate all Buncf plugins.
 * 
 * @param plugins - Array of BuncfPlugin instances
 * @returns Aggregated routes, middleware, assets, and pages
 */
export async function initializePlugins(
  plugins: BuncfPlugin[]
): Promise<PluginRegistryResult> {
  const result: PluginRegistryResult = {
    routeHandler: null,
    middleware: [],
    assets: {},
    pages: {},
    buildPlugins: [],
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
      // Collect build hook (the plugin itself is a BunPlugin)
      result.buildPlugins.push(plugin);

      // Log for development: announce plugin loading
      if (process.env.NODE_ENV !== "production") {
        console.log(`  \x1b[36m🔌 Plugin loaded:\x1b[0m \x1b[33m${plugin.name}\x1b[0m`);
      }

      // Collect routes from the plugin
      if (plugin.routes) {
        const basePath = plugin.basePath || `/_plugins/${plugin.name}`;
        pluginHandlers.push({
          basePath: basePath.endsWith("/") ? basePath.slice(0, -1) : basePath,
          handler: plugin.routes,
        });
      }

      // Collect middleware from the plugin
      if (plugin.middlewares) {
        result.middleware.push(...plugin.middlewares);
      }

      // Collect static assets provided by the plugin
      if (plugin.assets) {
        Object.assign(result.assets, plugin.assets);
      }

      // Collect client-side React pages from the plugin
      if (plugin.pages) {
        Object.assign(result.pages, plugin.pages);
      }

    } catch (error) {
      console.error(`[buncf] Failed to register plugin ${plugin.name}:`, error);
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
          // Special case: if base path is "/admin" and path is "/admin", rewrite to "/"
          if (pathname === basePath) {
            newUrl.pathname = "/";
          } else {
            newUrl.pathname = pathname.slice(basePath.length) || "/";
          }

          const rewrittenRequest = new Request(newUrl.toString(), req);

          try {
            const response = await handler(rewrittenRequest, ctx);
            if (response && response.status !== 404) {
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
