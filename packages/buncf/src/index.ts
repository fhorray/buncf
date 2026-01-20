
// Re-export types for consumers
export * from './types';
export { getCloudflareContext, runWithCloudflareContext } from './context';
export { initBuncfDev } from './dev';
export { createWorkerHandler } from './worker-factory';

// Plugin System
export { initializePlugins, type PluginRegistryResult } from './plugin-registry';

// Re-export server-side router (createApp)
// For hooks/Link, use: import { useRouter } from "buncf/router"
export { createApp, createApiRouter, createPagesRouter } from "./router";

// API definition helpers for type-safe endpoints
export { defineHandler, defineBody } from "./define";

// RPC & Server Actions
export { defineAction, handleAction, type ActionContext, type ActionDef } from "./action";

// SSR Renderer
export { renderApp } from "./server/renderer";

// No build-time plugins exported here to avoid fs/path pollution in client code