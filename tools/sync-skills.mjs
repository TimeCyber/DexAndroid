/**
 * Sync canonical skills/ → Cursor / Codex / Claude Code skill dirs.
 * Usage: node tools/sync-skills.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalRoot = path.join(root, "skills");
const targets = [
  path.join(root, ".cursor", "skills"),
  path.join(root, ".agents", "skills"),
  path.join(root, ".claude", "skills"),
];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (ent.name === "README.md") continue;
    const from = path.join(src, ent.name);
    const to = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

if (!fs.existsSync(canonicalRoot)) {
  console.error("Missing skills/ directory");
  process.exit(1);
}

const skillDirs = fs
  .readdirSync(canonicalRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

if (skillDirs.length === 0) {
  console.error("No skill directories under skills/");
  process.exit(1);
}

for (const name of skillDirs) {
  const src = path.join(canonicalRoot, name);
  const skillMd = path.join(src, "SKILL.md");
  if (!fs.existsSync(skillMd)) {
    console.warn(`skip ${name}: no SKILL.md`);
    continue;
  }
  for (const targetRoot of targets) {
    const dest = path.join(targetRoot, name);
    copyDir(src, dest);
    console.log(`synced ${name} → ${path.relative(root, dest)}`);
  }
}

console.log("done.");
