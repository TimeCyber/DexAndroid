import { join } from "node:path";
import { existsSync } from "node:fs";
import { exec, hasCommand, ensureDir } from "../util.js";
import { resolveSerial, shell, push } from "../adb.js";

export interface FridaUnpackResult {
  pkg: string;
  outDir: string;
  code: number;
  log: string;
  dexHint: string;
}

/** 推送并启动 frida-server（需 root）。默认使用项目 tools/frida-server。 */
export async function fridaPrepare(
  serial?: string,
  serverLocalPath?: string
): Promise<{ serial: string; running: boolean; message: string }> {
  const s = await resolveSerial(serial);
  const local = serverLocalPath || join(process.cwd(), "tools", "frida-server");
  if (!existsSync(local)) {
    throw new Error(
      `未找到 frida-server：${local}\n请下载与本机 frida 版本匹配的 android-arm64 文件到该路径。`
    );
  }

  await push(s, local, "/data/local/tmp/frida-server");
  await shell(s, "su -c 'chmod 755 /data/local/tmp/frida-server'");
  await shell(s, "su -c 'killall frida-server 2>/dev/null; true'");
  await shell(s, "su -c 'setenforce 0'");
  await shell(
    s,
    "su -c 'nohup /data/local/tmp/frida-server >/data/local/tmp/frida.log 2>&1 &'"
  );

  const ps = await shell(s, "su -c 'ps -A | grep frida-server'");
  const running = /frida-server/.test(ps.stdout);
  return {
    serial: s,
    running,
    message: running
      ? "frida-server 已在设备上运行（Magisk/root）。可调用 frida_unpack。"
      : `frida-server 启动失败，请查看 /data/local/tmp/frida.log\n${ps.stdout}${ps.stderr}`,
  };
}

/**
 * root 方案：基于 frida-dexdump，从内存中搜索并 dump 已解密的 dex。
 */
export async function fridaUnpack(
  pkg: string,
  outDir: string,
  opts: {
    serial?: string;
    spawn?: boolean;
    deepSearch?: boolean;
    sleepSec?: number;
    timeoutMs?: number;
  } = {}
): Promise<FridaUnpackResult> {
  const s = await resolveSerial(opts.serial);
  await ensureDir(outDir);

  if (!(await hasCommand("frida-dexdump"))) {
    throw new Error(
      "未找到 frida-dexdump。请先安装：pip install frida-tools frida-dexdump\n" +
        "并确保设备已 root 且 frida-server 正在运行。"
    );
  }

  const ps = await shell(s, "su -c 'ps -A | grep frida-server' || true");
  const fridaRunning = /frida-server/.test(ps.stdout);

  const args: string[] = ["-D", s];
  if (opts.spawn !== false) {
    args.push("-f", pkg);
  } else {
    args.push("-n", pkg);
  }
  args.push("-o", outDir);
  if (opts.deepSearch !== false) args.push("-d");
  if (opts.sleepSec != null) args.push("--sleep", String(opts.sleepSec));
  else if (opts.spawn !== false) args.push("--sleep", "10");

  const r = await exec("frida-dexdump", args, {
    timeoutMs: opts.timeoutMs ?? 300000,
  });

  return {
    pkg,
    outDir,
    code: r.code,
    log:
      (fridaRunning ? "" : "[警告] 设备上未检测到 frida-server 进程。\n") +
      r.stdout +
      "\n" +
      r.stderr,
    dexHint: `dump 出的 dex 位于 ${outDir}，可用 dex_to_smali 反编译。`,
  };
}
