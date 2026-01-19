/// <reference path="./.buncf/cloudflare-env.d.ts" />
import type { } from "buncf";
declare module "buncf" { interface BuncfTypeRegistry { env: CloudflareEnv; } }
declare module "*.html" { const content: string; export default content; }
