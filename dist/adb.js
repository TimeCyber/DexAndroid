import { exec } from "./util.js";
/** ADB 可执行文件路径，可通过环境变量 ADB_PATH 覆盖。 */
const ADB = process.env.ADB_PATH || "adb";
function adb(args, opts = {}) {
    const full = opts.serial ? ["-s", opts.serial, ...args] : args;
    return exec(ADB, full, { timeoutMs: opts.timeoutMs ?? 60000 });
}
/** 列出已连接设备。 */
export async function listDevices() {
    const r = await adb(["devices", "-l"]);
    const lines = r.stdout.split(/\r?\n/).slice(1);
    const devices = [];
    for (const line of lines) {
        const t = line.trim();
        if (!t)
            continue;
        const parts = t.split(/\s+/);
        const serial = parts[0];
        const state = parts[1] || "unknown";
        const modelPart = parts.find((p) => p.startsWith("model:"));
        devices.push({ serial, state, model: modelPart?.slice("model:".length) });
    }
    return devices;
}
/** 选取一个默认设备 serial；若指定了 serial 则校验存在。 */
export async function resolveSerial(serial) {
    const devices = (await listDevices()).filter((d) => d.state === "device");
    if (devices.length === 0) {
        throw new Error("没有可用的 ADB 设备（确认设备已连接并开启 USB 调试）。");
    }
    if (serial) {
        if (!devices.find((d) => d.serial === serial)) {
            throw new Error(`指定的设备 ${serial} 不存在或不可用。`);
        }
        return serial;
    }
    if (devices.length > 1) {
        throw new Error(`检测到多台设备，请通过 serial 参数指定：${devices.map((d) => d.serial).join(", ")}`);
    }
    return devices[0].serial;
}
/** 列出设备上已安装的包名，可带关键字过滤。 */
export async function listPackages(serial, keyword) {
    const r = await adb(["shell", "pm", "list", "packages"], { serial });
    let pkgs = r.stdout
        .split(/\r?\n/)
        .map((l) => l.trim().replace(/^package:/, ""))
        .filter(Boolean);
    if (keyword)
        pkgs = pkgs.filter((p) => p.includes(keyword));
    return pkgs.sort();
}
/** 获取某个包在设备上的所有 APK 路径（含 split）。 */
export async function getApkPaths(serial, pkg) {
    const r = await adb(["shell", "pm", "path", pkg], { serial });
    const paths = r.stdout
        .split(/\r?\n/)
        .map((l) => l.trim().replace(/^package:/, ""))
        .filter(Boolean);
    if (paths.length === 0)
        throw new Error(`设备上未找到包 ${pkg} 的 APK 路径。`);
    return paths;
}
/** 从设备拉取文件到本地。 */
export async function pull(serial, remote, local) {
    return adb(["pull", remote, local], { serial, timeoutMs: 300000 });
}
/** 推送文件到设备。 */
export async function push(serial, local, remote) {
    return adb(["push", local, remote], { serial, timeoutMs: 300000 });
}
/** 安装 APK。 */
export async function install(serial, apkPath) {
    return adb(["install", "-r", "-g", apkPath], { serial, timeoutMs: 300000 });
}
/** 执行任意 shell 命令。 */
export async function shell(serial, command) {
    return adb(["shell", command], { serial });
}
/** 判断包是否已安装。 */
export async function isInstalled(serial, pkg) {
    const pkgs = await listPackages(serial, pkg);
    return pkgs.includes(pkg);
}
/** 启动一个 app（monkey 方式，无需指定 Activity）。 */
export async function launchApp(serial, pkg) {
    return adb(["shell", "monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1"], { serial });
}
export { adb };
