
// @ts-ignore
import { colors } from "../utils/log";

// Package version (should sync with package.json)
const VERSION = "0.1.0";

export const showBanner = () => {
  console.log(colors.cyan(`
   __                            ___ 
  |  |--.--.--.-----..----.----.|  _|
  |  _  |  |  |     ||  __|  __||  _|
  |_____|_____|__|__||____|____||_|  v${VERSION}
  ${colors.dim("Build & Deploy Bun to Cloudflare Workers")}
`));
};

export const showHelp = () => {
  showBanner();
  console.log(`
${colors.bold("USAGE")}
  ${colors.cyan("buncf")} <command> [options]

${colors.bold("COMMANDS")}
  ${colors.cyan("init")}        Scaffold a new project
  ${colors.cyan("build")}       Build for production
  ${colors.cyan("deploy")}      Build and deploy to Cloudflare Workers
  ${colors.cyan("dev")}         Start development server with bindings

${colors.bold("OPTIONS")}
  ${colors.yellow("-h, --help")}      Show this help message
  ${colors.yellow("-v, --version")}   Show version number
  ${colors.yellow("--verbose")}       Enable verbose output
  ${colors.yellow("--remote")}        Use remote Cloudflare bindings in dev

${colors.bold("EXAMPLES")}
  ${colors.dim("$")} buncf init               Create new project
  ${colors.dim("$")} buncf build              Build production bundle
  ${colors.dim("$")} buncf deploy             Deploy to Cloudflare
  ${colors.dim("$")} buncf dev --remote       Dev with live data

${colors.bold("LEARN MORE")}
  Documentation: ${colors.blue("https://github.com/fhorray/buncf")}
`);
};

export const showVersion = () => {
  console.log(`buncf v${VERSION}`);
};
