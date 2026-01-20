#!/usr/bin/env bun

// Buncf CLI (Refactored)
// Dispatcher for commands in src/commands/

// @ts-ignore
import { log, colors } from "./utils/log";
import { showHelp, showVersion, showBanner } from "./commands/help";

// CLI Arguments
const args = Bun.argv.slice(2);
const command = args.find(arg => !arg.startsWith("-"));
const flags = {
  help: args.includes("--help") || args.includes("-h"),
  version: args.includes("--version") || args.includes("-v"),
  verbose: args.includes("--verbose"),
  remote: args.includes("--remote")
};

// Handle Flags
if (flags.version) {
  showVersion();
  process.exit(0);
}

if (flags.help && !command) {
  showHelp();
  process.exit(0);
}

// Entrypoint Finder Helper
const getEntrypoint = () => {
  const entrypoints = ["./src/index.ts", "./index.ts", "./src/index.js", "./index.js"];
  const entrypoint = entrypoints.find(path => Bun.file(path).size > 0);
  if (!entrypoint) {
    log.error("No entrypoint found.");
    console.log(`
  ${colors.dim("Please create one of the following files:")}
    • src/index.ts
    • index.ts
    • src/index.js
    • index.js
  `);
    process.exit(1);
  }
  return entrypoint;
};

// Dispatch
async function main() {
  switch (command) {
    case "init": {
      const projectName = args[args.indexOf("init") + 1];
      if (!projectName || projectName.startsWith("-")) {
        log.error("Please specify a project name: buncf init <project-name>");
        process.exit(1);
      }

      const templateIndex = args.indexOf("--template");
      const template = templateIndex !== -1 ? args[templateIndex + 1] : undefined;

      // Lazy load modular command
      const { init } = await import("./commands/init/index");
      await init(projectName, { template });
      break;
    }
    case "build": {
      const { build } = await import("./commands/build");
      const entrypoint = getEntrypoint();
      log.title(`🚀 Building for Production...`);
      const success = await build(entrypoint);
      if (!success) process.exit(1);
      break;
    }
    case "deploy": {
      const { deploy } = await import("./commands/deploy");
      const entrypoint = getEntrypoint();
      await deploy(entrypoint);
      break;
    }
    case "dev": {
      const { dev } = await import("./commands/dev");
      const entrypoint = getEntrypoint();
      // Start dev loop
      await dev(entrypoint, { verbose: flags.verbose, remote: flags.remote });
      // dev command keeps process alive
      break;
    }
    default: {
      if (!command) {
        showHelp();
      } else {
        log.error(`Unknown command: ${command}`);
        console.log(`\nRun ${colors.cyan("buncf --help")} for usage information.\n`);
        process.exit(1);
      }
    }
  }
}

main().catch(err => {
  log.error(`Unexpected error: ${err}`);
  process.exit(1);
});
