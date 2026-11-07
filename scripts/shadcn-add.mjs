/**
 * Wrapper around `shadcn add`. The shadcn registry ships components that import
 * `cn` from the young `cn` package; this project uses clsx + tailwind-merge via
 * `@/lib/utils` instead. After adding, it rewrites those imports and removes `cn`.
 *
 * Usage: npm run ui:add -- button dialog
 */
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const UI_DIR = "src/components/ui";
const components = process.argv.slice(2);

if (components.length === 0) {
  process.stderr.write("Usage: npm run ui:add -- <component> [...components]\n");
  process.exit(1);
}

execSync(`npx shadcn@latest add ${components.join(" ")} -y`, { stdio: "inherit" });

let rewritten = 0;
for (const file of readdirSync(UI_DIR)) {
  const path = join(UI_DIR, file);
  const source = readFileSync(path, "utf8");
  const fixed = source.replace(/from ["']cn["']/g, 'from "@/lib/utils"');
  if (fixed !== source) {
    writeFileSync(path, fixed);
    rewritten += 1;
  }
}

const manifest = JSON.parse(readFileSync("package.json", "utf8"));
if (manifest.dependencies?.cn || manifest.devDependencies?.cn) {
  execSync("npm uninstall cn", { stdio: "inherit" });
}

process.stdout.write(`Rewrote cn imports in ${rewritten} file(s). Run npm run format next.\n`);
