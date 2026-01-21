
import * as fs from "node:fs";
import * as path from "node:path";
import { log, colors } from "../../utils/log";
import { multiSelect, createFileWriter } from "./utils";
import * as base from "./templates/base"; // For pkgJson generation logic which is still dynamic
import * as home from "./templates/home"; // For homePage generation logic which is still dynamic
import { rootLayout } from "./templates/layout"; // For layout generation logic which is still dynamic

interface InitOptions {
  template?: string;
}

export async function init(projectName: string, options: InitOptions = {}) {
  const cwd = process.cwd();
  const projectDir = path.resolve(cwd, projectName);

  // Resolve templates directory
  // Assuming compiled structure or source structure:
  // src/commands/init/index.ts -> ../../../templates
  const templatesDir = path.resolve(import.meta.dir, "../../../templates");

  if (!fs.existsSync(templatesDir)) {
      // Fallback for development if structure is different
      log.warn(`Templates directory not found at ${templatesDir}. Using hardcoded fallback.`);
      // In a real scenario, this should fail, but for now we might still have logic
      // But we are moving to files, so this is critical.
  }

  if (fs.existsSync(projectDir)) {
    log.error(`Directory ${projectName} already exists.`);
    return;
  }

  log.title(`✨ Welcome to Buncf Init!`);

  let choices: string[] = [];
  let isStarter = false;

  if (options.template) {
     log.info(`Using template: ${options.template}`);
     // Map template names to features
     // Currently we only have features, so let's say "full" includes everything
     if (options.template === "full") {
         choices = ["tailwind", "shadcn", "auth", "drizzle"];
     } else if (options.template === "base") {
         choices = [];
     } else {
         const starterPath = path.join(templatesDir, "starters", options.template);
         // console.log("DEBUG: Checking starter path:", starterPath);
         if (fs.existsSync(starterPath)) {
            isStarter = true;
         } else {
            log.error(`Unknown template '${options.template}'.`);
            log.info(`Available templates: base, full, minimal`);
            process.exit(1);
         }
     }
  }

  if ((!options.template && !isStarter) || (choices.length === 0 && options.template !== "base" && !isStarter)) {
      choices = await multiSelect("Which stack would you like to build with?", [
        { name: "Tailwind CSS", value: "tailwind", description: "Modern styling with Tailwind 4" },
        { name: "Shadcn UI", value: "shadcn", description: "Essential UI components (Button, Input, Card, ...)" },
        { name: "Better Auth", value: "auth", description: "Authentication for Cloudflare D1" },
        { name: "Drizzle ORM", value: "drizzle", description: "Type-safe DB for Cloudflare D1" }
      ]);
  }

  const useTailwind = choices.includes("tailwind") || choices.includes("shadcn");
  const useShadcn = choices.includes("shadcn");
  const useBetterAuth = choices.includes("auth");
  const useDrizzle = choices.includes("drizzle");

  process.stdout.write("\x1b[2J\x1b[0;0H"); // Last clear
  log.step(`Creating project: ${colors.purple(projectName)}...`);
  fs.mkdirSync(projectDir);

  // Helper to copy directory
  const copyDir = (src: string, dest: string) => {
      if (!fs.existsSync(src)) return;
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          let destName = entry.name;
          // NPM renaming safety
          if (destName === "_gitignore") destName = ".gitignore";

          const destPath = path.join(dest, destName);
          if (entry.isDirectory()) {
              if (!fs.existsSync(destPath)) fs.mkdirSync(destPath);
              copyDir(srcPath, destPath);
          } else {
              // Check if file is likely binary or text for replacement safety
              const ext = path.extname(entry.name);
              const isText = [".ts", ".tsx", ".js", ".jsx", ".json", ".html", ".css", ".md", ".txt", ".svg", ""].includes(ext) || destName === ".gitignore";

              if (isText) {
                  // Read content as text and replace placeholders
                  let content = fs.readFileSync(srcPath, "utf-8");
                  content = content.replace(/{{PROJECT_NAME}}/g, projectName);
                  fs.writeFileSync(destPath, content);
              } else {
                  // Binary copy
                  fs.copyFileSync(srcPath, destPath);
              }
          }
      }
  };

  const write = createFileWriter(projectDir);

  if (isStarter && options.template) {
    // --- Starter Template Path ---
    copyDir(path.join(templatesDir, "starters", options.template), projectDir);
  } else {
    // --- 1. Base Structure ---
    copyDir(path.join(templatesDir, "base"), projectDir);

    // --- 2. Features ---
    if (useTailwind) {
        copyDir(path.join(templatesDir, "features/tailwind"), projectDir);
    }
    if (useBetterAuth) {
        copyDir(path.join(templatesDir, "features/auth"), projectDir);
    }
    if (useDrizzle) {
        copyDir(path.join(templatesDir, "features/drizzle"), projectDir);
    }
    if (useShadcn) {
        copyDir(path.join(templatesDir, "features/shadcn"), projectDir);
    }

    // --- 3. Dynamic Files (package.json, index.tsx, _layout.tsx) ---
    // We retain code generation for these as they require merging logic

    // Dependencies
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
      "miniflare": "latest",
      "tw-animate-css": "latest"
    };

    if (useTailwind) {
      devDeps["tailwindcss"] = "latest";
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

    write("package.json", base.pkgJson(projectName, deps, devDeps));

    // Pages (Dynamic Glue)
    write("src/pages/index.tsx", home.homePage(choices));
    write("src/pages/_layout.tsx", rootLayout(useBetterAuth));
  }

  log.box(`Project Created!

Folder: ${projectName}
Features: ${isStarter ? options.template : (choices.join(", ") || "Minimal")}`);

  console.log(`
Next steps:
  cd ${projectName}
  bun install
  bun dev
`);
}
