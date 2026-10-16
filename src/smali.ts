import { join, basename, resolve, dirname } from "node:path";
import { stat, readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { exec, hasCommand, ensureDir } from "./util.js";

/** 项目根目录（dist/ 的上一级），不依赖启动时的 cwd。 */
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * baksmali 调用方式解析：
 *  - 若设置 BAKSMALI_JAR 环境变量，则作为可执行 fat jar 调用（java -jar）。
 *  - 否则使用项目内 tools/ 目录下的 baksmali 及其依赖，走 classpath 调用。
 */
function baksmaliInvocation(): { args: string[]; desc: string } {
  if (process.env.BAKSMALI_JAR) {
    return { args: ["-jar", process.env.BAKSMALI_JAR], desc: process.env.BAKSMALI_JAR };
  }
  const toolsDir = join(PROJECT_ROOT, "tools");
  const cp = join(toolsDir, "*");
  return { args: ["-cp", cp, "org.jf.baksmali.Main"], desc: `${toolsDir}/*` };
}

async function ensureJava(): Promise<void> {
  if (!(await hasCommand("java"))) {
    throw new Error("未找到 java。baksmali 依赖 JRE，请先安装 Java。");
  }
}

export interface DexToSmaliResult {
  dexFiles: string[];
  outDir: string;
  classDirs: string[];
  log: string;
}

/**
 * 把一个或多个 dex 反编译为 smali。
 * dexInput 可以是单个 .dex 文件、也可以是包含多个 dex 的目录。
 */
export async function dexToSmali(dexInput: string, outDir: string): Promise<DexToSmaliResult> {
  await ensureJava();
  const bak = baksmaliInvocation();

  const st = await stat(dexInput).catch(() => null);
  if (!st) throw new Error(`输入路径不存在：${dexInput}`);

  // 收集待处理 dex
  let dexFiles: string[] = [];
  if (st.isDirectory()) {
    const names = await readdir(dexInput);
    dexFiles = names.filter((n) => n.toLowerCase().endsWith(".dex")).map((n) => join(dexInput, n));
  } else {
    dexFiles = [dexInput];
  }
  if (dexFiles.length === 0) throw new Error(`在 ${dexInput} 中未找到 .dex 文件。`);

  await ensureDir(outDir);
  const classDirs: string[] = [];
  let log = "";

  for (const dex of dexFiles) {
    // 每个 dex 输出到独立子目录，避免互相覆盖
    const sub = join(outDir, basename(dex).replace(/\.dex$/i, ""));
    await ensureDir(sub);
    const r = await exec("java", [...bak.args, "d", dex, "-o", sub], { timeoutMs: 300000 });
    log += `# ${basename(dex)} (exit ${r.code})\n${r.stdout}${r.stderr}\n`;
    if (r.code !== 0) throw new Error(`baksmali 反编译失败：${dex}\n${r.stderr}`);
    classDirs.push(sub);
  }

  return { dexFiles, outDir, classDirs, log };
}

/** 递归收集目录下所有 .smali 文件。 */
async function walkSmali(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await walkSmali(full, acc);
    else if (e.name.toLowerCase().endsWith(".smali")) acc.push(full);
  }
  return acc;
}

/** smali 类名（com.foo.Bar）转相对文件路径。 */
function classToPath(className: string): string {
  const norm = className.replace(/^L/, "").replace(/;$/, "").replace(/\./g, "/");
  return norm.endsWith(".smali") ? norm : `${norm}.smali`;
}

/** 列出 smali 目录下所有类（以类名形式）。 */
export async function smaliListClasses(smaliDir: string, keyword?: string): Promise<string[]> {
  const files = await walkSmali(smaliDir);
  const base = resolve(smaliDir);
  let classes = files.map((f) =>
    resolve(f).slice(base.length + 1).replace(/\\/g, "/").replace(/\.smali$/i, "").replace(/\//g, ".")
  );
  if (keyword) classes = classes.filter((c) => c.includes(keyword));
  return classes.sort();
}

/** 读取指定类的 smali 源码。支持 com.foo.Bar 或 com/foo/Bar 形式。 */
export async function smaliReadClass(smaliDir: string, className: string): Promise<string> {
  const rel = classToPath(className);
  const candidate = join(smaliDir, rel);
  if (existsSync(candidate)) return readFile(candidate, "utf8");

  // 回退：在整个目录中搜索同名文件
  const files = await walkSmali(smaliDir);
  const target = rel.split("/").pop()!;
  const hit = files.find((f) => basename(f) === target);
  if (!hit) throw new Error(`未找到类：${className}`);
  return readFile(hit, "utf8");
}

export interface SmaliMatch {
  file: string;
  line: number;
  text: string;
}

/**
 * 在 smali 目录中按正则搜索（内容分析）。返回命中行及上下文位置。
 * 适合查找 API 调用、字符串、权限、加解密逻辑等。
 */
export async function smaliSearch(
  smaliDir: string,
  pattern: string,
  opts: { flags?: string; maxResults?: number } = {}
): Promise<SmaliMatch[]> {
  const files = await walkSmali(smaliDir);
  const re = new RegExp(pattern, opts.flags ?? "i");
  const max = opts.maxResults ?? 500;
  const base = resolve(smaliDir);
  const matches: SmaliMatch[] = [];

  for (const f of files) {
    const content = await readFile(f, "utf8");
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        matches.push({
          file: resolve(f).slice(base.length + 1).replace(/\\/g, "/"),
          line: i + 1,
          text: lines[i].trim(),
        });
        if (matches.length >= max) return matches;
      }
    }
  }
  return matches;
}
