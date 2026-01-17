import { $ } from "bun";

// Encontra e deleta pastas node_modules usando comandos nativos do sistema via Bun
console.log("🧹 Deleting node_modules...");
await $`find . -name "node_modules" -type d -prune -exec rm -rf '{}' +`;
console.log("✨ Done!");