
const code1 = `import { serve } from "bun";\nconsole.log(serve);`;
const regex1 = /import\s+\{\s*([^}]+)\s*\}\s+from\s*["']bun["'];?/g;
const rep1 = code1.replace(regex1, "const { $1 } = __BunShim__;");
console.log("Test 1:");
console.log(rep1);
console.log("Matched 1:", !rep1.includes('import { serve } from "bun"'));

const code2 = `import Bun from "bun";\nconsole.log(Bun.serve);`;
const regex2 = /import\s+(?:\*\s+as\s+)?Bun\s+from\s*["']bun["'];?/g;
const rep2 = code2.replace(regex2, "const Bun = __BunShim__;");
console.log("Test 2:");
console.log(rep2);
console.log("Matched 2:", !rep2.includes('import Bun from "bun"'));
