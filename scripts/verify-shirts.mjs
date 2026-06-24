import { readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public/shirts");
const count = execSync("ls -la public/shirts/*.png 2>/dev/null | wc -l", {
  cwd: root,
  encoding: "utf8",
}).trim();
console.log(count);
const missing = [];
for (let i = 1; i <= 50; i++) {
  if (!existsSync(resolve(outDir, `${i}.png`))) missing.push(i);
}
for (const id of missing) console.log(`missing:${id}`);
