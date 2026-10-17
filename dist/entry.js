import { join, resolve } from "node:path";
import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { exec, hasCommand } from "./util.js";
function toSmaliRel(className) {
    return className.replace(/\./g, "/") + ".smali";
}
async function findSmaliFile(roots, className) {
    const rel = toSmaliRel(className);
    for (const root of roots) {
        const candidates = [
            join(root, rel),
            join(root, "smali", rel),
            join(root, "smali_classes2", rel),
            join(root, "smali_classes3", rel),
            join(root, "smali_classes4", rel),
            join(root, "smali_classes5", rel),
        ];
        for (const p of candidates) {
            if (existsSync(p))
                return p;
        }
        // scan smali* dirs under project
        try {
            const names = await readdir(root);
            for (const n of names) {
                if (!n.startsWith("smali"))
                    continue;
                const p = join(root, n, rel);
                if (existsSync(p))
                    return p;
            }
        }
        catch {
            /* ignore */
        }
    }
    return undefined;
}
async function locateOnCreate(smaliPath) {
    const text = await readFile(smaliPath, "utf8");
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^\s*\.method\s+.*\bonCreate\s*\(\s*Landroid\/os\/Bundle;\s*\)\s*V/);
        if (m) {
            return { line: i + 1, method: lines[i].trim() };
        }
    }
    // fallback: any onCreate
    for (let i = 0; i < lines.length; i++) {
        if (/^\s*\.method\s+.*\bonCreate\s*\(/.test(lines[i])) {
            return { line: i + 1, method: lines[i].trim() };
        }
    }
    return undefined;
}
/** 从 apktool 解码后的 AndroidManifest.xml 解析入口。 */
export function parseDecodedManifest(xml) {
    const pkg = xml.match(/<manifest\b[^>]*\bpackage\s*=\s*"([^"]+)"/i)?.[1];
    const appName = xml.match(/<application\b[^>]*\bandroid:name\s*=\s*"([^"]+)"/i)?.[1];
    const launchers = new Set();
    // Activity / activity-alias blocks that contain MAIN + LAUNCHER
    const activityRe = /<(activity|activity-alias)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let m;
    while ((m = activityRe.exec(xml))) {
        const attrs = m[2];
        const body = m[3];
        const hasMain = /android:name\s*=\s*"android\.intent\.action\.MAIN"/i.test(body);
        const hasLauncher = /android:name\s*=\s*"android\.intent\.category\.LAUNCHER"/i.test(body);
        if (!hasMain || !hasLauncher)
            continue;
        const name = attrs.match(/\bandroid:name\s*=\s*"([^"]+)"/i)?.[1];
        if (!name)
            continue;
        const target = attrs.match(/\bandroid:targetActivity\s*=\s*"([^"]+)"/i)?.[1];
        const raw = target || name;
        launchers.add(resolveClassName(pkg, raw));
    }
    return {
        packageName: pkg,
        applicationName: appName ? resolveClassName(pkg, appName) : undefined,
        launchers: [...launchers],
    };
}
function resolveClassName(pkg, name) {
    if (name.startsWith(".")) {
        if (!pkg)
            return name.slice(1);
        return pkg + name;
    }
    if (!name.includes(".") && pkg)
        return `${pkg}.${name}`;
    return name;
}
async function collectSmaliRoots(projectDir, smaliDir) {
    const roots = [];
    if (smaliDir)
        roots.push(resolve(smaliDir));
    if (projectDir)
        roots.push(resolve(projectDir));
    return roots;
}
async function fromAapt(apkPath) {
    const tools = ["aapt", "aapt2"];
    for (const tool of tools) {
        if (!(await hasCommand(tool)))
            continue;
        const r = await exec(tool, ["dump", "badging", apkPath], { timeoutMs: 60000 });
        if (r.code !== 0)
            continue;
        const pkg = r.stdout.match(/package:\s*name='([^']+)'/)?.[1];
        const launchers = [];
        for (const line of r.stdout.split(/\r?\n/)) {
            const m = line.match(/launchable-activity:\s*name='([^']+)'/);
            if (m)
                launchers.push(m[1]);
        }
        return { packageName: pkg, launchers, raw: r.stdout.slice(0, 2000) };
    }
    throw new Error("未找到 aapt/aapt2，且未提供已解码的 AndroidManifest.xml。请安装 Android build-tools，或先用 apk_decode。");
}
/**
 * 定位应用入口：包名、Application、MAIN/LAUNCHER Activity，以及对应 smali 的 onCreate 行号。
 * 只做分析定位，不修改任何文件。
 */
export async function findAppEntry(opts) {
    const notes = [];
    const sources = [];
    let packageName;
    let applicationName;
    let launcherNames = [];
    const manifestPath = opts.manifestPath ||
        (opts.projectDir ? join(opts.projectDir, "AndroidManifest.xml") : undefined);
    if (manifestPath && existsSync(manifestPath)) {
        const xml = await readFile(manifestPath, "utf8");
        if (xml.includes("android:name") || xml.includes("<manifest")) {
            const parsed = parseDecodedManifest(xml);
            packageName = parsed.packageName;
            applicationName = parsed.applicationName;
            launcherNames = parsed.launchers;
            sources.push(manifestPath);
        }
        else {
            notes.push(`Manifest 可能是二进制 AXML，无法直接解析：${manifestPath}`);
        }
    }
    if (launcherNames.length === 0 && opts.apkPath) {
        const st = await stat(opts.apkPath).catch(() => null);
        if (!st?.isFile())
            throw new Error(`APK 不存在：${opts.apkPath}`);
        const aapt = await fromAapt(opts.apkPath);
        packageName = packageName || aapt.packageName;
        launcherNames = aapt.launchers;
        sources.push(`aapt dump badging: ${opts.apkPath}`);
        notes.push("入口来自 aapt badging；更完整信息请先 apk_decode 再传 projectDir。");
    }
    if (launcherNames.length === 0 && !applicationName) {
        throw new Error("未能定位入口。请提供 apktool 解码目录 projectDir，或 apkPath（需本机 aapt/aapt2）。");
    }
    const roots = await collectSmaliRoots(opts.projectDir, opts.smaliDir);
    const launchers = [];
    for (const activity of launcherNames) {
        const entry = { activity };
        const smaliPath = await findSmaliFile(roots, activity);
        if (smaliPath) {
            entry.smaliPath = smaliPath;
            const oc = await locateOnCreate(smaliPath);
            if (oc) {
                entry.onCreateLine = oc.line;
                entry.onCreateMethod = oc.method;
            }
            else {
                notes.push(`${activity}: 找到 smali 但未定位 onCreate`);
            }
        }
        else if (roots.length) {
            notes.push(`${activity}: 在 smali 目录中未找到对应文件`);
        }
        launchers.push(entry);
    }
    if (applicationName && roots.length) {
        const appSmali = await findSmaliFile(roots, applicationName);
        if (appSmali)
            notes.push(`Application smali: ${appSmali}`);
    }
    return {
        packageName,
        applicationName,
        launchers,
        sources,
        notes,
    };
}
export function formatAppEntry(info) {
    const lines = [];
    lines.push(`package: ${info.packageName ?? "(unknown)"}`);
    lines.push(`application: ${info.applicationName ?? "(default)"}`);
    lines.push(`launcher 数量: ${info.launchers.length}`);
    for (const [i, L] of info.launchers.entries()) {
        lines.push(`--- launcher #${i + 1} ---`);
        lines.push(`activity: ${L.activity}`);
        if (L.smaliPath)
            lines.push(`smali: ${L.smaliPath}`);
        if (L.onCreateLine)
            lines.push(`onCreate: 第 ${L.onCreateLine} 行`);
        if (L.onCreateMethod)
            lines.push(`method: ${L.onCreateMethod}`);
    }
    if (info.sources.length) {
        lines.push("--- sources ---");
        lines.push(...info.sources.map((s) => `  ${s}`));
    }
    if (info.notes.length) {
        lines.push("--- notes ---");
        lines.push(...info.notes.map((n) => `  ${n}`));
    }
    lines.push("说明: 本工具仅定位入口，不写入/注入代码。重新打包请用 apk_decode →（自行合法修改）→ apk_repack。");
    return lines.join("\n");
}
