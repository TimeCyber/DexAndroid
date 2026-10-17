import { readFile, writeFile } from "node:fs/promises";
import { apkDecode, apkRepack } from "../dist/repack.js";
import { findAppEntry, formatAppEntry } from "../dist/entry.js";
import { smaliPatch, formatSmaliPatch } from "../dist/smali_patch.js";

const APKTOOL = process.env.APKTOOL_JAR;
if (!APKTOOL) {
  console.error("请设置 APKTOOL_JAR");
  process.exit(1);
}

// 1) 从干净工程打出「原包」
const originalApk = "unpack-output/repack/demo-hello-original.apk";
const orig = await apkRepack({
  projectDir: "examples/demo-hello",
  outApk: originalApk,
});
console.log("\n[1] ORIGINAL APK:", orig.signedApk);

// 2) 反编译原包
const projectDir = "unpack-output/repack/demo-hello-from-apk";
const decoded = await apkDecode(originalApk, projectDir);
console.log("\n[2] DECODED:", decoded.projectDir);

// 3) 定位入口
const info = await findAppEntry({ projectDir });
console.log("\n[3] ENTRY\n" + formatAppEntry(info));
const smaliPath = info.launchers[0]?.smaliPath;
if (!smaliPath) throw new Error("no launcher smali");

// 4) 保证 onCreate .locals >= 3，再插入弹窗
let src = await readFile(smaliPath, "utf8");
src = src.replace(
  /(\.method protected onCreate\(Landroid\/os\/Bundle;\)V\r?\n\s*\.locals\s+)\d+/,
  "$13"
);
await writeFile(smaliPath, src, "utf8");

const content = `
    new-instance v0, Landroid/app/AlertDialog$Builder;
    invoke-direct {v0, p0}, Landroid/app/AlertDialog$Builder;-><init>(Landroid/content/Context;)V

    const-string v1, "\\u4f60\\u597d\\u554a"
    invoke-virtual {v0, v1}, Landroid/app/AlertDialog$Builder;->setMessage(Ljava/lang/CharSequence;)Landroid/app/AlertDialog$Builder;
    move-result-object v0

    const-string v1, "OK"
    const/4 v2, 0x0
    invoke-virtual {v0, v1, v2}, Landroid/app/AlertDialog$Builder;->setPositiveButton(Ljava/lang/CharSequence;Landroid/content/DialogInterface$OnClickListener;)Landroid/app/AlertDialog$Builder;
    move-result-object v0

    invoke-virtual {v0}, Landroid/app/AlertDialog$Builder;->show()Landroid/app/AlertDialog;
`;

const patch = await smaliPatch({
  smaliPath,
  mode: "insert_after_onCreate_super",
  content,
  dryRun: false,
});
console.log("\n[4] PATCH\n" + formatSmaliPatch(patch));

// 5) 重新打包
const rebuilt = await apkRepack({
  projectDir,
  outApk: "unpack-output/repack/demo-hello-repacked.apk",
});
console.log("\n[5] REPACKED APK:", rebuilt.signedApk);
console.log(rebuilt.log);
