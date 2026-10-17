import { readFile, writeFile } from "node:fs/promises";
import { findAppEntry, formatAppEntry } from "../dist/entry.js";
import { smaliPatch, formatSmaliPatch } from "../dist/smali_patch.js";

const projectDir = "examples/demo-hello";

const info = await findAppEntry({ projectDir });
console.log(formatAppEntry(info));
console.log("---PATCH---");

// AlertDialog "你好啊"；需要 .locals >= 3
const smaliPath = info.launchers[0]?.smaliPath;
if (!smaliPath) throw new Error("no launcher smali");
let src = await readFile(smaliPath, "utf8");
src = src.replace(/\.locals\s+\d+/, ".locals 3");
await writeFile(smaliPath, src, "utf8");

const content = `
    new-instance v0, Landroid/app/AlertDialog$Builder;
    invoke-direct {v0, p0}, Landroid/app/AlertDialog$Builder;-><init>(Landroid/content/Context;)V

    const-string v1, "你好啊"
    invoke-virtual {v0, v1}, Landroid/app/AlertDialog$Builder;->setMessage(Ljava/lang/CharSequence;)Landroid/app/AlertDialog$Builder;
    move-result-object v0

    const-string v1, "OK"
    const/4 v2, 0x0
    invoke-virtual {v0, v1, v2}, Landroid/app/AlertDialog$Builder;->setPositiveButton(Ljava/lang/CharSequence;Landroid/content/DialogInterface$OnClickListener;)Landroid/app/AlertDialog$Builder;
    move-result-object v0

    invoke-virtual {v0}, Landroid/app/AlertDialog$Builder;->show()Landroid/app/AlertDialog;
`;

const r = await smaliPatch({
  projectDir,
  mode: "insert_after_onCreate_super",
  content,
  dryRun: false,
});
console.log(formatSmaliPatch(r));
