/**
 * Isolated AsyncLocalStorage initialization for Cloudflare Workers.
 */

let instance: any = null;

export function initAsyncLocalStorage() {
  if (instance) return instance;

  try {
    // try to require synchronously if possible (node/bun)
    const { AsyncLocalStorage } = require("node:async_hooks");
    instance = new AsyncLocalStorage();
  } catch (e) {
    // Fallback or ignore for browser/pure-worker environments
  }

  return instance;
}

export function getAsyncLocalStorage() {
  if (!instance) {
    initAsyncLocalStorage();
  }
  return instance;
}
