import AdmZip from "adm-zip";
/** 常见加固壳特征库（文件/so 名）。 */
const SIGNATURES = [
    { name: "360 加固（奇虎）", patterns: ["libjiagu.so", "libjiagu_art.so", "libjiagu_x86.so", "libprotectClass.so"] },
    { name: "腾讯乐固 / 御安全", patterns: ["libshell.so", "libshella", "libshellx", "libtup.so", "libtosprotection", "libBugly"] },
    { name: "梆梆加固", patterns: ["libsecexe.so", "libsecmain.so", "libDexHelper.so", "libSecShell.so", "libsecpreload.so"] },
    { name: "爱加密", patterns: ["libexec.so", "libexecmain.so", "ijiami.dat", "ijiami.ajm", "libSecShell"] },
    { name: "阿里聚安全 / 娜迦", patterns: ["libmobisec.so", "libpreverify1.so", "aliprotect.dat", "libsgmain.so", "libsgsecuritybody.so"] },
    { name: "百度加固", patterns: ["libbaiduprotect.so", "baiduprotect1.jar", "libbaiduprotect_x86.so"] },
    { name: "娜迦 NAGAIN", patterns: ["libddog.so", "libfdog.so", "libchaosvmp.so"] },
    { name: "网秦 / 通付盾", patterns: ["libnqshield.so", "libtup.so", "libnesec.so"] },
    { name: "几维安全 KiwiSecurity", patterns: ["libkwscmm.so", "libkwscr.so", "libkwslinker.so"] },
    { name: "顶象 Dingxiang", patterns: ["libx3g.so"] },
    { name: "珊瑚灵御 / 瑞星", patterns: ["librsprotect.so"] },
    { name: "APKProtect", patterns: ["libAPKProtect.so"] },
];
/** 扫描本地 APK，识别其是否被加固以及加固厂商。 */
export function detectPacker(apkPath) {
    const zip = new AdmZip(apkPath);
    const entries = zip.getEntries().map((e) => e.entryName);
    const lower = entries.map((e) => e.toLowerCase());
    const hits = [];
    const packers = new Set();
    for (const sig of SIGNATURES) {
        for (const pat of sig.patterns) {
            const p = pat.toLowerCase();
            const idx = lower.findIndex((e) => e.includes(p));
            if (idx !== -1) {
                hits.push({ packer: sig.name, entry: entries[idx] });
                packers.add(sig.name);
            }
        }
    }
    const dexCount = entries.filter((e) => /^classes\d*\.dex$/i.test(e)).length;
    return {
        packed: packers.size > 0,
        packers: [...packers],
        hits,
        dexCount,
        entryCount: entries.length,
    };
}
