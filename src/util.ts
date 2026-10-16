import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";

export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * 执行一个外部命令并收集输出。不经过 shell，避免 Windows 下的转义问题。
 */
export function exec(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeoutMs?: number; input?: string } = {}
): Promise<ExecResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      windowsHide: true,
      shell: false,
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    const timer = opts.timeoutMs
      ? setTimeout(() => {
          if (!finished) {
            child.kill();
            finished = true;
            resolve({ code: -1, stdout, stderr: stderr + "\n[超时被终止]" });
          }
        }, opts.timeoutMs)
      : null;

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: stderr + "\n" + err.message });
    });

    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      resolve({ code: code ?? -1, stdout, stderr });
    });

    if (opts.input) {
      child.stdin.write(opts.input);
      child.stdin.end();
    }
  });
}

/** 判断某个命令是否在 PATH 中可用。 */
export async function hasCommand(cmd: string): Promise<boolean> {
  const probe = process.platform === "win32" ? "where" : "which";
  const r = await exec(probe, [cmd], { timeoutMs: 5000 });
  return r.code === 0;
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

/** 组合文本工具结果，方便 MCP 返回。 */
export function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}
