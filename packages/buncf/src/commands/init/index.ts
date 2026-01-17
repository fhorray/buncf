
import * as fs from "node:fs";
import * as path from "node:path";
import { log, colors } from "../../utils/log";
import { multiSelect, createFileWriter } from "./utils";

// Templates
import * as base from "./templates/base";
import * as auth from "./templates/auth";
import * as drizzle from "./templates/drizzle";
import * as shadcn from "./templates/shadcn";
import * as home from "./templates/home";
import { playgroundPage } from "./templates/playground";
import { rootLayout } from "./templates/layout";

export async function init(projectName: string) {
  const cwd = process.cwd();
  const projectDir = path.resolve(cwd, projectName);

  if (fs.existsSync(projectDir)) {
    log.error(`Directory ${projectName} already exists.`);
    return;
  }

  log.title(`✨ Welcome to Buncf Init!`);

  const choices = await multiSelect("Which stack would you like to build with?", [
    { name: "Tailwind CSS", value: "tailwind", description: "Modern styling with Tailwind 4" },
    { name: "Shadcn UI", value: "shadcn", description: "Essential UI components (Button, Input, Card, ...)" },
    { name: "Better Auth", value: "auth", description: "Authentication for Cloudflare D1" },
    { name: "Drizzle ORM", value: "drizzle", description: "Type-safe DB for Cloudflare D1" }
  ]);

  const useTailwind = choices.includes("tailwind") || choices.includes("shadcn");
  const useShadcn = choices.includes("shadcn");
  const useBetterAuth = choices.includes("auth");
  const useDrizzle = choices.includes("drizzle");

  process.stdout.write("\x1b[2J\x1b[0;0H"); // Last clear
  log.step(`Creating project: ${colors.cyan(projectName)}...`);
  fs.mkdirSync(projectDir);

  const write = createFileWriter(projectDir);

  // --- DEPENDENCIES ---
  const deps: Record<string, string> = {
    "buncf": "latest",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2",
    "lucide-react": "latest"
  };

  const devDeps: Record<string, string> = {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.0.0",
    "wrangler": "latest",
    "bun": "latest",
    "tw-animate-css": "latest"
  };

  if (useTailwind) {
    devDeps["tailwindcss"] = "latest";
    devDeps["bun-plugin-tailwind"] = "latest";
  }

  if (useShadcn) {
    deps["class-variance-authority"] = "^0.7.0";
    deps["@radix-ui/react-slot"] = "latest";
    deps["@radix-ui/react-label"] = "latest";
  }

  if (useBetterAuth) {
    deps["better-auth"] = "latest";
  }

  if (useDrizzle) {
    deps["drizzle-orm"] = "latest";
    devDeps["drizzle-kit"] = "latest";
  }

  // --- CONFIG FILES ---
  write("package.json", base.pkgJson(projectName, deps, devDeps));
  write("tsconfig.json", JSON.stringify(base.tsConfig, null, 2));
  write("cloudflare-env.d.ts", `interface CloudflareEnv { ASSETS: Fetcher; DB: D1Database; }`);
  write("buncf-env.d.ts", `import type { } from "buncf";\ndeclare module "buncf" { interface BuncfTypeRegistry { env: CloudflareEnv; } }\ndeclare module "*.html" { const content: string; export default content; }`);

  // --- CORE STRUCTURE ---
  write("src/index.ts", `import { createApp } from "buncf";\nexport default createApp();`);
  write("src/index.html", base.indexHtml(projectName));
  write("src/client.tsx", base.clientTsx(useBetterAuth));
  write("src/globals.css", base.globalsCss(useTailwind));
  write("public/logo.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`);
  write(".gitignore", `node_modules\n.buncf\n.wrangler\ndist\n.env\n*.dev.vars\ncloudflare-env.d.ts`);
  write("wrangler.json", base.wranglerTemplate(projectName));

  // --- FEATURE-SPECIFIC FILES ---
  if (useTailwind) {
    write("src/lib/utils.ts", shadcn.cnUtil);
  }

  if (useShadcn) {
    write("src/components/ui/button.tsx", shadcn.buttonTemplate);
    write("src/components/ui/input.tsx", shadcn.inputTemplate);
    write("src/components/ui/label.tsx", shadcn.labelTemplate);
    write("src/components/ui/card.tsx", shadcn.cardTemplate);
    write("src/components/ui/table.tsx", shadcn.tableTemplate);
    write("src/pages/playground.tsx", playgroundPage);
  }

  if (useBetterAuth) {
    write("src/lib/auth.ts", auth.authLib);
    write("src/lib/auth-client.ts", auth.authClientLib);
    write("src/api/auth/[...all].ts", auth.authApiHandler);
    write("src/pages/auth/login.tsx", auth.loginPage);
    write("src/pages/auth/register.tsx", auth.registerPage);
  }

  if (useDrizzle) {
    write("drizzle.config.ts", drizzle.drizzleConfig);
    write("src/db/schema.ts", drizzle.dbSchema);
    write("src/db/index.ts", drizzle.dbLib);
    write("src/api/users/index.ts", drizzle.usersApi);
    write("src/pages/admin/users.tsx", drizzle.adminUsersPage);
  }

  // Final home page
  write("src/pages/index.tsx", home.homePage(choices));
  write("src/pages/_layout.tsx", rootLayout(useBetterAuth));

  log.box(`Project Created!

Folder: ${projectName}
Features: ${choices.join(", ") || "Minimal"}`);

  console.log(`
Next steps:
  cd ${projectName}
  bun install
  bun dev
`);
}
