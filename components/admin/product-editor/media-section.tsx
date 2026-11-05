"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Image as ImageIcon,
  UploadCloud,
  Camera,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProductEditorState } from "./types";

interface MediaSectionProps {
  state: ProductEditorState;
  onChange: (fields: Partial<ProductEditorState>) => void;
}

export function MediaSection({ state, onChange }: MediaSectionProps) {
  const t = useTranslations("admin.productCreate");
  const coverInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFileUpload = (
    files: FileList | null,
    isGallery: boolean = false
  ) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        if (!isGallery) {
          onChange({ thumbnail: dataUrl });
        } else {
          onChange({
            galleryImages: [...state.galleryImages, dataUrl].slice(0, 10),
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files, false);
  };

  const handleRemoveGalleryImage = (idx: number) => {
    const updated = state.galleryImages.filter((_, i) => i !== idx);
    onChange({ galleryImages: updated });
  };

  return (
    <Card className="border-border/70 bg-card shadow-2xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>{t("sectionMedia")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Hidden inputs */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files, false)}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files, true)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files, true)}
        />

        {/* Cover Thumbnail Area */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground block">
            {t("mediaUploadCover")}
          </span>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => coverInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[140px] ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            {state.thumbnail ? (
              <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-border bg-background">
                <Image
                  src={state.thumbnail}
                  alt="Cover"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-medium text-foreground">
                  {t("dragAndDropHint")}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  PNG, JPG, WEBP (maks. 5MB)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Images Area */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">
              {t("mediaUploadGallery")} ({state.galleryImages.length}/10)
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                className="h-10 sm:h-8 text-xs font-medium gap-1.5 sm:hidden"
              >
                <Camera className="w-3.5 h-3.5 text-primary" />
                <span>{t("cameraCapture")}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => galleryInputRef.current?.click()}
                className="h-10 sm:h-8 text-xs font-medium gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5 text-primary" />
                <span>Rasm yuklash</span>
              </Button>
            </div>
          </div>

          {state.galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
              {state.galleryImages.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square rounded-xl border border-border overflow-hidden bg-background shadow-2xs"
                >
                  <Image
                    src={img}
                    alt={`Gallery ${idx + 1}`}
                    fill
                    className="object-contain p-1.5"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveGalleryImage(idx);
                    }}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/20 border border-border/50 text-center text-xs text-muted-foreground">
              Qo'shimcha burchak rasmlari yuklanmagan
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

