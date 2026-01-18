import { createApp } from 'buncf';

// Initialize Buncf
// Scans src/api (including [...route].ts for Hono) and src/pages
const app = createApp();

export default {
  port: 3001,
  routes: app.routes,
  fetch: app.fetch,
  development: app.development
};

// or just export default app