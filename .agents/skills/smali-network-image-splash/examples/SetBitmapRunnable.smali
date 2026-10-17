.class public Lcom/dexandroid/demohello/SetBitmapRunnable;
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
