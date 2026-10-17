/**
 * 自有 Demo 完整链路：
 * 原包 → apk_decode → 改 smali（首页展示网络图片，点击打开浏览器）→ apk_repack
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { apkDecode, apkRepack } from "../dist/repack.js";
import { findAppEntry, formatAppEntry } from "../dist/entry.js";

const IMG =
  "https://mcpx.oss-cn-shanghai.aliyuncs.com/2025/09/03/26ec553f82054116a20ddcf4d03aa29a.jpg";
const LINK = "https://www.mcp-x.com/dist/zsTmwu/";

if (!process.env.APKTOOL_JAR) {
  console.error("请设置 APKTOOL_JAR=tools/apktool_2.9.3.jar");
  process.exit(1);
}

const originalApk = "unpack-output/repack/demo-hello-original.apk";
const projectDir = "unpack-output/repack/demo-hello-from-apk";
const outApk = "unpack-output/repack/demo-hello-repacked.apk";

console.log("[1] build original (no image UI)...");
await apkRepack({ projectDir: "examples/demo-hello", outApk: originalApk });
console.log("    ", originalApk);

console.log("[2] apk_decode...");
await apkDecode(originalApk, projectDir);
console.log("    ", projectDir);

console.log("[3] find_app_entry...");
const info = await findAppEntry({ projectDir });
console.log(formatAppEntry(info));

console.log("[4] patch manifest + write smali helpers + MainActivity...");
await patchManifest(join(projectDir, "AndroidManifest.xml"));
const smaliRoot = join(projectDir, "smali", "com", "dexandroid", "demohello");
await mkdir(smaliRoot, { recursive: true });
const helpers = buildHelperSmali();
await writeFile(join(smaliRoot, "OpenBrowserClickListener.smali"), helpers.openBrowser, "utf8");
await writeFile(join(smaliRoot, "SetBitmapRunnable.smali"), helpers.setBitmap, "utf8");
await writeFile(join(smaliRoot, "LoadImageRunnable.smali"), helpers.loadImage, "utf8");
await writeFile(join(smaliRoot, "HideImageRunnable.smali"), helpers.hideImage, "utf8");
await writeFile(join(smaliRoot, "MainActivity.smali"), mainActivitySmali(IMG, LINK), "utf8");

console.log("[5] apk_repack...");
const rebuilt = await apkRepack({ projectDir, outApk });
console.log("    REPACKED:", rebuilt.signedApk);
console.log(rebuilt.log);

async function patchManifest(path) {
  let xml = await readFile(path, "utf8");
  if (!xml.includes("android.permission.INTERNET")) {
    if (/<uses-sdk[\s\S]*?\/>/.test(xml)) {
      xml = xml.replace(
        /(<uses-sdk[\s\S]*?\/>)/,
        `$1\n    <uses-permission android:name="android.permission.INTERNET" />`
      );
    } else {
      xml = xml.replace(
        /<manifest\b[^>]*>/,
        (m) => `${m}\n    <uses-permission android:name="android.permission.INTERNET" />`
      );
    }
  }
  if (!/android:usesCleartextTraffic=/.test(xml)) {
    xml = xml.replace(
      /<application\b/,
      `<application android:usesCleartextTraffic="true" `
    );
  }
  await writeFile(path, xml, "utf8");
}

function mainActivitySmali(img, link) {
  return `.class public Lcom/dexandroid/demohello/MainActivity;
.super Landroid/app/Activity;
.source "MainActivity.java"


# direct methods
.method public constructor <init>()V
    .locals 0

    invoke-direct {p0}, Landroid/app/Activity;-><init>()V

    return-void
.end method


# virtual methods
.method protected onCreate(Landroid/os/Bundle;)V
    .locals 7

    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    new-instance v0, Landroid/widget/ImageView;
    invoke-direct {v0, p0}, Landroid/widget/ImageView;-><init>(Landroid/content/Context;)V

    sget-object v1, Landroid/widget/ImageView$ScaleType;->FIT_CENTER:Landroid/widget/ImageView$ScaleType;
    invoke-virtual {v0, v1}, Landroid/widget/ImageView;->setScaleType(Landroid/widget/ImageView$ScaleType;)V

    const/high16 v1, -0x1000000
    invoke-virtual {v0, v1}, Landroid/widget/ImageView;->setBackgroundColor(I)V

    invoke-virtual {p0, v0}, Lcom/dexandroid/demohello/MainActivity;->setContentView(Landroid/view/View;)V

    new-instance v1, Lcom/dexandroid/demohello/OpenBrowserClickListener;
    const-string v2, "${link}"
    invoke-direct {v1, p0, v2}, Lcom/dexandroid/demohello/OpenBrowserClickListener;-><init>(Landroid/app/Activity;Ljava/lang/String;)V
    invoke-virtual {v0, v1}, Landroid/widget/ImageView;->setOnClickListener(Landroid/view/View$OnClickListener;)V

    new-instance v1, Lcom/dexandroid/demohello/LoadImageRunnable;
    const-string v2, "${img}"
    invoke-direct {v1, p0, v0, v2}, Lcom/dexandroid/demohello/LoadImageRunnable;-><init>(Landroid/app/Activity;Landroid/widget/ImageView;Ljava/lang/String;)V

    new-instance v2, Ljava/lang/Thread;
    invoke-direct {v2, v1}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;)V
    invoke-virtual {v2}, Ljava/lang/Thread;->start()V

    new-instance v1, Landroid/os/Handler;
    invoke-static {}, Landroid/os/Looper;->getMainLooper()Landroid/os/Looper;
    move-result-object v2
    invoke-direct {v1, v2}, Landroid/os/Handler;-><init>(Landroid/os/Looper;)V

    new-instance v2, Lcom/dexandroid/demohello/HideImageRunnable;
    invoke-direct {v2, v0}, Lcom/dexandroid/demohello/HideImageRunnable;-><init>(Landroid/widget/ImageView;)V

    const-wide/16 v3, 0x1388
    invoke-virtual {v1, v2, v3, v4}, Landroid/os/Handler;->postDelayed(Ljava/lang/Runnable;J)Z

    return-void
.end method
`;
}

function buildHelperSmali() {
  return {
    openBrowser: openBrowserSmali(),
    setBitmap: setBitmapSmali(),
    loadImage: loadImageSmali(),
    hideImage: hideImageSmali(),
  };
}

function hideImageSmali() {
  return `.class public Lcom/dexandroid/demohello/HideImageRunnable;
.super Ljava/lang/Object;
.source "HideImageRunnable.java"

# interfaces
.implements Ljava/lang/Runnable;


# instance fields
.field private final imageView:Landroid/widget/ImageView;


# direct methods
.method public constructor <init>(Landroid/widget/ImageView;)V
    .locals 0

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Lcom/dexandroid/demohello/HideImageRunnable;->imageView:Landroid/widget/ImageView;

    return-void
.end method


# virtual methods
.method public run()V
    .locals 2

    iget-object v0, p0, Lcom/dexandroid/demohello/HideImageRunnable;->imageView:Landroid/widget/ImageView;

    const/16 v1, 0x8

    invoke-virtual {v0, v1}, Landroid/widget/ImageView;->setVisibility(I)V

    return-void
.end method
`;
}

function openBrowserSmali() {
  return `.class public Lcom/dexandroid/demohello/OpenBrowserClickListener;
.super Ljava/lang/Object;
.source "OpenBrowserClickListener.java"

# interfaces
.implements Landroid/view/View$OnClickListener;


# instance fields
.field private final activity:Landroid/app/Activity;

.field private final url:Ljava/lang/String;


# direct methods
.method public constructor <init>(Landroid/app/Activity;Ljava/lang/String;)V
    .locals 0

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Lcom/dexandroid/demohello/OpenBrowserClickListener;->activity:Landroid/app/Activity;

    iput-object p2, p0, Lcom/dexandroid/demohello/OpenBrowserClickListener;->url:Ljava/lang/String;

    return-void
.end method


# virtual methods
.method public onClick(Landroid/view/View;)V
    .locals 3

    new-instance v0, Landroid/content/Intent;
    const-string v1, "android.intent.action.VIEW"
    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    iget-object v1, p0, Lcom/dexandroid/demohello/OpenBrowserClickListener;->url:Ljava/lang/String;
    invoke-static {v1}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;
    move-result-object v1
    invoke-virtual {v0, v1}, Landroid/content/Intent;->setData(Landroid/net/Uri;)Landroid/content/Intent;

    iget-object v1, p0, Lcom/dexandroid/demohello/OpenBrowserClickListener;->activity:Landroid/app/Activity;
    invoke-virtual {v1, v0}, Landroid/app/Activity;->startActivity(Landroid/content/Intent;)V

    return-void
.end method
`;
}

function setBitmapSmali() {
  return `.class public Lcom/dexandroid/demohello/SetBitmapRunnable;
.super Ljava/lang/Object;
.source "SetBitmapRunnable.java"

# interfaces
.implements Ljava/lang/Runnable;


# instance fields
.field private final bitmap:Landroid/graphics/Bitmap;

.field private final imageView:Landroid/widget/ImageView;


# direct methods
.method public constructor <init>(Landroid/widget/ImageView;Landroid/graphics/Bitmap;)V
    .locals 0

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Lcom/dexandroid/demohello/SetBitmapRunnable;->imageView:Landroid/widget/ImageView;

    iput-object p2, p0, Lcom/dexandroid/demohello/SetBitmapRunnable;->bitmap:Landroid/graphics/Bitmap;

    return-void
.end method


# virtual methods
.method public run()V
    .locals 2

    iget-object v0, p0, Lcom/dexandroid/demohello/SetBitmapRunnable;->imageView:Landroid/widget/ImageView;

    iget-object v1, p0, Lcom/dexandroid/demohello/SetBitmapRunnable;->bitmap:Landroid/graphics/Bitmap;

    invoke-virtual {v0, v1}, Landroid/widget/ImageView;->setImageBitmap(Landroid/graphics/Bitmap;)V

    return-void
.end method
`;
}

function loadImageSmali() {
  return `.class public Lcom/dexandroid/demohello/LoadImageRunnable;
.super Ljava/lang/Object;
.source "LoadImageRunnable.java"

# interfaces
.implements Ljava/lang/Runnable;


# instance fields
.field private final activity:Landroid/app/Activity;

.field private final imageUrl:Ljava/lang/String;

.field private final imageView:Landroid/widget/ImageView;


# direct methods
.method public constructor <init>(Landroid/app/Activity;Landroid/widget/ImageView;Ljava/lang/String;)V
    .locals 0

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Lcom/dexandroid/demohello/LoadImageRunnable;->activity:Landroid/app/Activity;

    iput-object p2, p0, Lcom/dexandroid/demohello/LoadImageRunnable;->imageView:Landroid/widget/ImageView;

    iput-object p3, p0, Lcom/dexandroid/demohello/LoadImageRunnable;->imageUrl:Ljava/lang/String;

    return-void
.end method


# virtual methods
.method public run()V
    .locals 5

    :try_start_0
    new-instance v0, Ljava/net/URL;
    iget-object v1, p0, Lcom/dexandroid/demohello/LoadImageRunnable;->imageUrl:Ljava/lang/String;
    invoke-direct {v0, v1}, Ljava/net/URL;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0}, Ljava/net/URL;->openConnection()Ljava/net/URLConnection;
    move-result-object v0

    check-cast v0, Ljava/net/HttpURLConnection;

    const/4 v1, 0x1
    invoke-virtual {v0, v1}, Ljava/net/HttpURLConnection;->setDoInput(Z)V

    const/16 v1, 0x3a98
    invoke-virtual {v0, v1}, Ljava/net/HttpURLConnection;->setConnectTimeout(I)V

    invoke-virtual {v0, v1}, Ljava/net/HttpURLConnection;->setReadTimeout(I)V

    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->connect()V

    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->getInputStream()Ljava/io/InputStream;
    move-result-object v1

    invoke-static {v1}, Landroid/graphics/BitmapFactory;->decodeStream(Ljava/io/InputStream;)Landroid/graphics/Bitmap;
    move-result-object v2

    invoke-virtual {v1}, Ljava/io/InputStream;->close()V

    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->disconnect()V

    if-eqz v2, :cond_0

    iget-object v0, p0, Lcom/dexandroid/demohello/LoadImageRunnable;->activity:Landroid/app/Activity;

    new-instance v1, Lcom/dexandroid/demohello/SetBitmapRunnable;
    iget-object v3, p0, Lcom/dexandroid/demohello/LoadImageRunnable;->imageView:Landroid/widget/ImageView;
    invoke-direct {v1, v3, v2}, Lcom/dexandroid/demohello/SetBitmapRunnable;-><init>(Landroid/widget/ImageView;Landroid/graphics/Bitmap;)V

    invoke-virtual {v0, v1}, Landroid/app/Activity;->runOnUiThread(Ljava/lang/Runnable;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :cond_0
    :goto_0
    return-void

    :catch_0
    move-exception v0

    goto :goto_0
.end method
`;
}
