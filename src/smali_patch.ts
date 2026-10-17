import { readFile, writeFile, copyFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { findAppEntry } from "./entry.js";

export type PatchMode =
  | "insert_after_onCreate_super"
  | "insert_at_line"
  | "replace"
  | "insert_verify_log";

export interface SmaliPatchOpts {
  /** 直接指定 smali 文件 */
  smaliPath?: string;
  /** apktool 工程，配合自动定位入口 */
  projectDir?: string;
  /** 指定类名（与 projectDir/smaliDir 联用） */
  className?: string;
  smaliDir?: string;
  mode: PatchMode;
  /** 调用方提供的 smali 片段（insert_* / replace 的 newText） */
  content?: string;
  /** replace 模式：要查找的原文 */
  find?: string;
  /** insert_at_line：1-based 行号，在该行之后插入 */
  line?: number;
  /** 是否写盘；true 时只预览 */
  dryRun?: boolean;
  /** 是否备份 .bak，默认 true */
  backup?: boolean;
}

export interface SmaliPatchResult {
  smaliPath: string;
  mode: PatchMode;
  dryRun: boolean;
  backupPath?: string;
  changed: boolean;
  detail: string;
  preview?: string;
}

const VERIFY_LOG_SNIPPET = `    # --- DexAndroid verify marker (learning rebuild check) ---
    const-string v0, "DexAndroid"
    const-string v1, "entry_ok"
    invoke-static {v0, v1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I
    # --- end marker ---
`;

function splitLines(text: string): string[] {
  return text.split(/\r?\n/);
}

function joinLines(lines: string[]): string {
  return lines.join("\n");
}

function findOnCreateSuperIndex(lines: string[]): number {
  let inOnCreate = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\.method\s+.*\bonCreate\s*\(/.test(lines[i])) {
      inOnCreate = true;
      continue;
    }
    if (inOnCreate && /^\s*\.end method\b/.test(lines[i])) break;
    if (
      inOnCreate &&
      /invoke-super\s+\{[^}]*\},\s*L[^;]+;->onCreate\s*\(\s*Landroid\/os\/Bundle;\s*\)V/.test(
        lines[i]
      )
    ) {
      return i;
    }
  }
  // fallback: first .locals inside onCreate
  inOnCreate = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\.method\s+.*\bonCreate\s*\(/.test(lines[i])) {
      inOnCreate = true;
      continue;
    }
    if (inOnCreate && /^\s*\.locals\b/.test(lines[i])) return i;
    if (inOnCreate && /^\s*\.end method\b/.test(lines[i])) break;
  }
  return -1;
}

function ensureLocalsForVerify(lines: string[]): string[] {
  // insert_verify_log uses v0/v1; bump .locals if needed inside onCreate
  let inOnCreate = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\.method\s+.*\bonCreate\s*\(/.test(lines[i])) {
      inOnCreate = true;
      continue;
    }
    if (!inOnCreate) continue;
    if (/^\s*\.end method\b/.test(lines[i])) break;
    const m = lines[i].match(/^\s*\.locals\s+(\d+)/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n < 2) lines[i] = lines[i].replace(/\.locals\s+\d+/, ".locals 2");
      break;
    }
  }
  return lines;
}

async function findClassSmali(roots: string[], className: string): Promise<string | undefined> {
  const rel = className.replace(/\./g, "/") + ".smali";
  for (const root of roots) {
    const candidates = [join(root, rel), join(root, "smali", rel)];
    for (const p of candidates) if (existsSync(p)) return p;
    try {
      for (const n of await readdir(root)) {
        if (!n.startsWith("smali")) continue;
        const p = join(root, n, rel);
        if (existsSync(p)) return p;
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

async function resolveTargetSmali(opts: SmaliPatchOpts): Promise<string> {
  if (opts.smaliPath) {
    const p = resolve(opts.smaliPath);
    if (!existsSync(p)) throw new Error(`smali 文件不存在：${p}`);
    return p;
  }

  const roots: string[] = [];
  if (opts.projectDir) roots.push(resolve(opts.projectDir));
  if (opts.smaliDir) roots.push(resolve(opts.smaliDir));

  if (opts.className && roots.length) {
    const p = await findClassSmali(roots, opts.className);
    if (p) return p;
    throw new Error(`未找到类 ${opts.className} 的 smali，请检查 className / projectDir。`);
  }

  if (opts.projectDir) {
    const info = await findAppEntry({
      projectDir: opts.projectDir,
      smaliDir: opts.smaliDir,
    });
    const first = info.launchers.find((L) => L.smaliPath);
    if (first?.smaliPath) return first.smaliPath;
    throw new Error("未能定位入口 Activity 的 smali，请显式传 smaliPath 或 className。");
  }

  throw new Error("请提供 smaliPath，或 projectDir（自动定位入口 Activity）。");
}

/**
 * 通用 smali 补丁：内容由调用方提供（或使用内置 verify Log 标记）。
 * 用于学习/验证自有工程重打包是否生效；不生成广告、外链跳转等业务模板。
 */
export async function smaliPatch(opts: SmaliPatchOpts): Promise<SmaliPatchResult> {
  const smaliPath = await resolveTargetSmali(opts);
  const dryRun = !!opts.dryRun;
  const backup = opts.backup !== false;
  const original = await readFile(smaliPath, "utf8");
  let lines = splitLines(original);
  let detail = "";
  let changed = false;
  let nextText = original;

  switch (opts.mode) {
    case "insert_verify_log": {
      if (original.includes("DexAndroid") && original.includes("entry_ok")) {
        return {
          smaliPath,
          mode: opts.mode,
          dryRun,
          changed: false,
          detail: "已存在 verify 标记，跳过。",
        };
      }
      lines = ensureLocalsForVerify(lines);
      const idx = findOnCreateSuperIndex(lines);
      if (idx < 0) throw new Error("未找到 onCreate 内的 invoke-super/.locals，无法插入 verify Log。");
      const snippet = splitLines(VERIFY_LOG_SNIPPET.replace(/\n$/, ""));
      lines.splice(idx + 1, 0, ...snippet);
      nextText = joinLines(lines);
      changed = nextText !== original;
      detail = `在 onCreate 第 ${idx + 1} 行后插入 Log.d("DexAndroid","entry_ok") 验证标记。`;
      break;
    }
    case "insert_after_onCreate_super": {
      if (!opts.content?.trim()) {
        throw new Error("mode=insert_after_onCreate_super 需要提供 content（你自己的 smali 片段）。");
      }
      const idx = findOnCreateSuperIndex(lines);
      if (idx < 0) throw new Error("未找到 onCreate 内的 invoke-super/.locals。");
      const snippet = splitLines(opts.content.replace(/\s+$/, ""));
      lines.splice(idx + 1, 0, ...snippet);
      nextText = joinLines(lines);
      changed = nextText !== original;
      detail = `在 onCreate 锚点第 ${idx + 1} 行后插入 ${snippet.length} 行（调用方 content）。`;
      break;
    }
    case "insert_at_line": {
      if (!opts.content?.trim()) throw new Error("mode=insert_at_line 需要 content。");
      if (!opts.line || opts.line < 1) throw new Error("mode=insert_at_line 需要 line（1-based）。");
      const at = Math.min(opts.line, lines.length);
      const snippet = splitLines(opts.content.replace(/\s+$/, ""));
      lines.splice(at, 0, ...snippet);
      nextText = joinLines(lines);
      changed = nextText !== original;
      detail = `在第 ${at} 行后插入 ${snippet.length} 行。`;
      break;
    }
    case "replace": {
      if (!opts.find) throw new Error("mode=replace 需要 find。");
      if (opts.content === undefined) throw new Error("mode=replace 需要 content（替换后文本，可为空）。");
      if (!original.includes(opts.find)) {
        return {
          smaliPath,
          mode: opts.mode,
          dryRun,
          changed: false,
          detail: "未找到 find 文本，未修改。",
        };
      }
      nextText = original.replace(opts.find, opts.content);
      changed = nextText !== original;
      detail = `replace 完成（find 长度 ${opts.find.length} → content 长度 ${opts.content.length}）。`;
      break;
    }
    default:
      throw new Error(`未知 mode: ${opts.mode}`);
  }

  const previewLines = splitLines(nextText);
  const previewStart = Math.max(0, (opts.line ?? findOnCreateSuperIndex(splitLines(original))) - 3);
  const preview = previewLines.slice(previewStart, previewStart + 40).join("\n");

  let backupPath: string | undefined;
  if (changed && !dryRun) {
    if (backup) {
      backupPath = smaliPath + ".bak";
      await copyFile(smaliPath, backupPath);
    }
    await writeFile(smaliPath, nextText, "utf8");
  }

  return {
    smaliPath,
    mode: opts.mode,
    dryRun,
    backupPath,
    changed,
    detail,
    preview,
  };
}

export function formatSmaliPatch(r: SmaliPatchResult): string {
  return [
    `file: ${r.smaliPath}`,
    `mode: ${r.mode}`,
    `dryRun: ${r.dryRun}`,
    `changed: ${r.changed}`,
    r.backupPath ? `backup: ${r.backupPath}` : "",
    `detail: ${r.detail}`,
    r.preview ? `--- preview ---\n${r.preview}` : "",
    "说明: 内容由调用方提供；内置仅有 Log 验证标记。仅用于有权修改的自有/授权工程学习验证。",
  ]
    .filter(Boolean)
    .join("\n");
}
