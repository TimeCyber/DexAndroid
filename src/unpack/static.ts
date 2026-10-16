import AdmZip from "adm-zip";
import { join, basename, isAbsolute } from "node:path";
import { stat } from "node:fs/promises";
import { ensureDir } from "../util.js";
import { resolveSerial, getApkPaths, pull } from "../adb.js";

export interface StaticUnpackResult {
  apk: string;
  outDir: string;
  dexFiles: string[];
  note: string;
}

/**
 * 静态解包：解压 APK，提取所有 classes*.dex。
 * 对加固 APK，这里拿到的只是壳 dex，需要配合 Frida/BlackDex 做运行时脱壳。
 */
export async function staticUnpack(apkPath: string, outDir: string): Promise<StaticUnpackResult> {
  const st = await stat(apkPath).catch(() => null);
  if (!st || !st.isFile()) throw new Error(`APK 文件不存在：${apkPath}`);

  await ensureDir(outDir);
  const zip = new AdmZip(apkPath);
  const entries = zip.getEntries();
  const dexFiles: string[] = [];

  for (const e of entries) {
    if (/^classes\d*\.dex$/i.test(e.entryName)) {
      zip.extractEntryTo(e, outDir, false, true);
      dexFiles.push(join(outDir, basename(e.entryName)));
    }
  }

  return {
    apk: apkPath,
    outDir,
    dexFiles,
    note:
      dexFiles.length > 0
        ? `已提取 ${dexFiles.length} 个 dex。若该 APK 被加固，这些可能只是壳 dex。`
        : "未发现 classes*.dex，可能是加固后 dex 被加密隐藏，需运行时脱壳。",
  };
}

/** 从设备上拉取已安装应用的 APK，返回本地主 APK 路径。 */
export async function pullApkFromDevice(
  pkg: string,
  outDir: string,
  serial?: string
): Promise<{ localApks: string[]; baseApk: string }> {
  const s = await resolveSerial(serial);
  const remotePaths = await getApkPaths(s, pkg);
  await ensureDir(outDir);

  const localApks: string[] = [];
  for (const remote of remotePaths) {
    const name = basename(remote);
    const local = join(outDir, name === "base.apk" ? `${pkg}.apk` : `${pkg}-${name}`);
    const r = await pull(s, remote, local);
    if (r.code !== 0) throw new Error(`拉取 APK 失败：${remote}\n${r.stderr}`);
    localApks.push(isAbsolute(local) ? local : join(process.cwd(), local));
  }
  // base.apk 作为主 APK
  const baseApk = localApks.find((p) => p.endsWith(`${pkg}.apk`)) || localApks[0];
  return { localApks, baseApk };
}
