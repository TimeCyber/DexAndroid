import { join } from "node:path";
import { stat } from "node:fs/promises";
import { ensureDir } from "../util.js";
import {
  resolveSerial,
  isInstalled,
  install,
  launchApp,
  shell,
  pull,
  adb,
} from "../adb.js";

/** 常见 BlackDex 包名（不同架构/版本不一致）。 */
export const BLACKDEX_PKGS = [
  "top.niunaijun.blackdexa64",
  "top.niunaijun.blackdexa32",
  "com.wrlus.blackdex",
];

/** 在设备上查找已安装的 BlackDex 包名。 */
export async function findBlackDexPkg(serial: string): Promise<string | null> {
  for (const pkg of BLACKDEX_PKGS) {
    if (await isInstalled(serial, pkg)) return pkg;
  }
  return null;
}

/** BlackDex dump 可能落在这些目录（v3.2 实际写在 dump/ 下）。 */
function candidateOutputDirs(pkg: string): string[] {
  return [
    `/sdcard/Android/data/${pkg}/dump`,
    `/storage/emulated/0/Android/data/${pkg}/dump`,
    `/sdcard/Android/data/${pkg}/files`,
    `/storage/emulated/0/Android/data/${pkg}/files`,
    `/sdcard/BlackDex`,
    `/storage/emulated/0/BlackDex`,
    `/sdcard/Download/BlackDex`,
  ];
}

export interface BlackDexPrepareResult {
  serial: string;
  pkg: string | null;
  installed: boolean;
  launched: boolean;
  message: string;
}

/**
 * 免 root 方案（BlackDex）：安装并启动 BlackDex，用户在界面中选择目标 app 脱壳。
 */
export async function blackdexPrepare(
  blackdexApkPath: string | undefined,
  serial?: string
): Promise<BlackDexPrepareResult> {
  const s = await resolveSerial(serial);
  let pkg = await findBlackDexPkg(s);

  if (!pkg) {
    if (!blackdexApkPath) {
      return {
        serial: s,
        pkg: null,
        installed: false,
        launched: false,
        message:
          `设备上未安装 BlackDex。请提供 BlackDex 的 APK 路径（参数 blackdexApkPath）以自动安装，\n` +
          `或手动安装后重试。开源下载：https://github.com/CodingGay/BlackDex/releases`,
      };
    }
    const st = await stat(blackdexApkPath).catch(() => null);
    if (!st) throw new Error(`BlackDex APK 不存在：${blackdexApkPath}`);
    const r = await install(s, blackdexApkPath);
    if (r.code !== 0) throw new Error(`安装 BlackDex 失败：\n${r.stderr}`);
    pkg = await findBlackDexPkg(s);
    if (!pkg) {
      throw new Error(
        "BlackDex APK 已安装，但未识别到包名。请确认安装的是官方 BlackDex 发行版。"
      );
    }
  }

  // monkey 启动；失败时尝试显式 Activity
  let launch = await launchApp(s, pkg);
  let launched = launch.code === 0 && !/No activities found/i.test(launch.stdout + launch.stderr);
  if (!launched) {
    const act = await adb(
      [
        "shell",
        "am",
        "start",
        "-n",
        `${pkg}/top.niunaijun.blackdex.view.base.WelcomeActivity`,
      ],
      { serial: s }
    );
    launched = act.code === 0 && !/Error/i.test(act.stdout + act.stderr);
    launch = act;
  }

  const dirs = candidateOutputDirs(pkg).join("\n  ");
  return {
    serial: s,
    pkg,
    installed: true,
    launched,
    message:
      `BlackDex 已就绪（包名: ${pkg}）。\n` +
      `请在设备 BlackDex 界面中选择目标应用并点击脱壳，\n` +
      `完成后调用 blackdex_pull。dump 目录可能位于：\n  ${dirs}`,
  };
}

export interface BlackDexPullResult {
  serial: string;
  remote: string;
  pulledTo: string;
  listing: string;
}

/** 在候选目录中找到含 dump 结果的远端路径。 */
async function resolveRemoteDump(
  serial: string,
  pkg: string,
  targetPkg?: string
): Promise<{ remote: string; listing: string }> {
  for (const base of candidateOutputDirs(pkg)) {
    const remote = targetPkg ? `${base}/${targetPkg}` : base;
    const ls = await shell(serial, `ls -R "${remote}" 2>/dev/null`);
    if (ls.stdout.trim() && /\.dex/i.test(ls.stdout)) {
      return { remote, listing: ls.stdout };
    }
    // 有内容但还没看到 dex 也先返回，便于排查
    if (ls.stdout.trim() && targetPkg) {
      return { remote, listing: ls.stdout };
    }
  }
  // 再全局搜一遍 BlackDex / 目标包名目录
  const find = await shell(
    serial,
    `ls -R /sdcard/BlackDex /sdcard/Android/data/${pkg}/files 2>/dev/null | head -n 200`
  );
  throw new Error(
    `未找到 BlackDex dump 结果。请确认已在 BlackDex 中完成脱壳。\n` +
      `当前可见内容：\n${find.stdout || "(空)"}`
  );
}

/** 把 BlackDex dump 出的 dex 从设备拉回本机。 */
export async function blackdexPull(
  localOutDir: string,
  serial?: string,
  targetPkg?: string
): Promise<BlackDexPullResult> {
  const s = await resolveSerial(serial);
  await ensureDir(localOutDir);

  const pkg = await findBlackDexPkg(s);
  if (!pkg) throw new Error("设备上未安装 BlackDex，无法拉取结果。");

  const { remote, listing } = await resolveRemoteDump(s, pkg, targetPkg);
  const r = await pull(s, remote, localOutDir);
  if (r.code !== 0) throw new Error(`拉取 BlackDex 结果失败：\n${r.stderr}`);

  return {
    serial: s,
    remote,
    pulledTo: join(localOutDir, targetPkg ?? "dump"),
    listing,
  };
}
