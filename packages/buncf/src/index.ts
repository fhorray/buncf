
// Re-export types for consumers
export * from "./types";

// Re-export server-side router (createApp)
// For hooks/Link, use: import { useRouter } from "buncf/router"
export { createApp, createApiRouter, createPagesRouter } from "./router";

// No build-time plugins exported here to avoid fs/path pollution in client code