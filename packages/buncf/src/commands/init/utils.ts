
import * as fs from "node:fs";
import * as path from "node:path";
import { colors } from "../../utils/log";

/**
 * Custom Multi-Select CLI helper with improved UI
 */
export async function multiSelect(title: string, options: { name: string, value: string, description?: string }[]): Promise<string[]> {
  const selected = new Set<string>();
  let cursor = 0;

  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const render = () => {
      // Clear current view (move cursor to top-left)
      process.stdout.write("\x1b[2J\x1b[0;0H");

      console.log(`\n ${colors.cyan("?")} ${colors.bold(title)}`);
      console.log(`   ${colors.dim("Use arrows to navigate, Space to select, Enter to confirm")}\n`);

      options.forEach((opt, i) => {
        const isCursor = i === cursor;
        const isSelected = selected.has(opt.value);

        const prefix = isCursor ? colors.cyan("❯") : " ";
        const checkbox = isSelected ? colors.green("◉") : colors.dim("◯");
        const name = isCursor ? colors.cyan(colors.bold(opt.name)) : opt.name;
        const desc = opt.description ? colors.dim(` - ${opt.description}`) : "";

        console.log(` ${prefix} ${checkbox} ${name}${desc}`);
      });
      console.log("\n");
    };

    render();

    const onKey = (key: string) => {
      if (key === "\u0003") process.exit(); // Ctrl+C

      if (key === "\r") {
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onKey);
        resolve(Array.from(selected));
      } else if (key === " ") {
        const option = options[cursor];
        if (option) {
          const val = option.value;
          if (selected.has(val)) selected.delete(val);
          else selected.add(val);
          render();
        }
      } else if (key === "\u001b[A" || key === "w") { // Up
        cursor = (cursor - 1 + options.length) % options.length;
        render();
      } else if (key === "\u001b[B" || key === "s") { // Down
        cursor = (cursor + 1) % options.length;
        render();
      }
    };

    process.stdin.on("data", onKey);
  });
}

/**
 * Simple file writer helper
 */
export const createFileWriter = (projectDir: string) => (filePath: string, content: string) => {
  const fullPath = path.join(projectDir, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + "\n");
};
