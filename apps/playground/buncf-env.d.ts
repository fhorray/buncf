declare module "*.svg" {
  /**
   * A path to the SVG file
   */
  const path: `${string}.svg`;
  export = path;
}

declare module "*.module.css" {
  /**
   * A record of class names to their corresponding CSS module classes
   */
  const classes: { readonly [key: string]: string };
  export = classes;
}

declare module "*.html" {
  const content: string;
  export default content;
}

/**
 * Buncf Type Augmentation
 * 
 * This file connects your wrangler-generated CloudflareEnv types to buncf.
 * It will NOT be overwritten by `bun cf-typegen`.
 */

// Import something from buncf to make this a module augmentation, not ambient declaration
import type { } from "buncf";

declare module "buncf" {
  // Augment the type registry to use your CloudflareEnv
  interface BuncfTypeRegistry {
    env: CloudflareEnv;
  }
}
