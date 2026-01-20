
// Native Bun logging utility (Replaces chalk)

const JULES_PURPLE = "#7c3aed";

// Helper to get ANSI code
const getColor = (color: string) => {
  // @ts-ignore
  if (typeof Bun !== "undefined" && Bun.color) {
    // @ts-ignore
    return Bun.color(color, "ansi") || "";
  }
  return ""; // Fallback no color
};

const RESET = "\x1b[0m";

const fmt = (text: string, colorName: string) => {
  const code = getColor(colorName);
  return code ? `${code}${text}${RESET}` : text;
};

// Aliases mapping chalk-like names to CSS colors supported by Bun.color
const mapColor = (name: string) => {
  switch (name) {
    case "dim": return "gray"; // dimmer gray
    case "bold": return "white"; // no direct bold in CSS colors, use white or implementation specific
    case "purple": return JULES_PURPLE;
    default: return name;
  }
};

const style = (text: string, color: string) => fmt(text, mapColor(color));

export const log = {
  info: (msg: string) => console.log(style("ℹ ", "blue") + msg),
  success: (msg: string) => console.log(style("✓ ", "green") + msg),
  warn: (msg: string) => console.log(style("⚠ ", "orange") + msg), // yellow is sometimes hard to read, orange?
  error: (msg: string) => console.error(style("✖ ", "red") + msg),
  step: (msg: string) => console.log(style("➜ ", "purple") + msg),
  title: (msg: string) => console.log("\n" + style(msg, "purple") + "\n"), // Changed to purple
  dim: (msg: string) => style(msg, "dim"),
  cyan: (msg: string) => style(msg, "cyan"),
  green: (msg: string) => style(msg, "green"),
  yellow: (msg: string) => style(msg, "gold"), // 'gold' or 'yellow'
  red: (msg: string) => style(msg, "red"),
  blue: (msg: string) => style(msg, "blue"),
  purple: (msg: string) => style(msg, "purple"),
  bold: (msg: string) => style(msg, "white"), // Fallback
  box: (msg: string) => {
    const lines = msg.split("\n");
    const width = Math.max(0, ...lines.map(l => l.length)) + 4;
    const border = style("─".repeat(width), "purple");
    console.log(style("┌", "purple") + border + style("┐", "purple"));
    lines.forEach(line => {
      console.log(style("│", "purple") + "  " + line + " ".repeat(width - line.length - 2) + style("│", "purple"));
    });
    console.log(style("└", "purple") + border + style("┘", "purple"));
  },
  table: (headers: string[], rows: string[][]) => {
    const colWidths = headers.map((h, i) => {
      let maxLen = h.length;
      rows.forEach(row => {
        const cell = row[i] || "";
        const cleanCell = cell.replace(/\x1b\[[0-9;]*m/g, "");
        if (cleanCell.length > maxLen) maxLen = cleanCell.length;
      });
      return maxLen + 2;
    });
    const pad = (str: string, length: number) => {
      const clean = str.replace(/\x1b\[[0-9;]*m/g, "");
      return str + " ".repeat(Math.max(0, length - clean.length));
    };
    const formatRow = (r: string[]) => r.map((c, i) => pad(c, colWidths[i])).join(style("│", "dim"));

    console.log(style(formatRow(headers), "white"));
    console.log(colWidths.map(w => style("─".repeat(w), "dim")).join(style("┼", "dim")));
    rows.forEach(row => console.log(formatRow(row)));
  }
};

export const colors = {
  cyan: (msg: string) => style(msg, "cyan"),
  green: (msg: string) => style(msg, "green"),
  yellow: (msg: string) => style(msg, "gold"),
  red: (msg: string) => style(msg, "red"),
  blue: (msg: string) => style(msg, "blue"),
  purple: (msg: string) => style(msg, "purple"),
  dim: (msg: string) => style(msg, "gray"),
  bold: (msg: string) => style(msg, "white"), // approximation
};
