"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { UploadCloud, Trash2, Link2, Plus, Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  helperText?: string;
  className?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function ImageUploader({
  images,
  onChange,
  maxImages = 10,
  label,
  helperText,
  className,
}: ImageUploaderProps) {
  const t = useTranslations("admin.productCreate");
  const [urlInput, setUrlInput] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsProcessing(true);

    const remainingSlots = Math.max(0, maxImages - images.length);
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    // Validate types and sizes
    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) {
        setUploadError(t("invalidFileType"));
        setIsProcessing(false);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setUploadError(t("fileTooLarge"));
        setIsProcessing(false);
        return;
      }
    }

    const promises = filesToProcess.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to read file"));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then((newUrls) => {
        onChange([...images, ...newUrls]);
      })
      .catch((err) => {
        console.error("Image read error:", err);
        setUploadError(t("unexpectedError"));
      })
      .finally(() => {
        setIsProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (images.length >= maxImages) return;

    onChange([...images, trimmed]);
    setUrlInput("");
    setUploadError(null);
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const target = images[indexToPrimary];
    const filtered = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([target, ...filtered]);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {label}
          </label>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
            {images.length} / {maxImages}
          </span>
        </div>
      )}

      {uploadError && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200",
          isDragging
            ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/20"
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-900/40"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={images.length >= maxImages || isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {t("uploadDropzone")}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-200">
              {helperText || t("uploadHelper")}
            </p>
          </div>
        </div>
      </div>

      {/* URL Input Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-300" />
          <Input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder={t("orAddByUrl")}
            className="pl-9 h-10 text-sm"
            disabled={images.length >= maxImages}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddUrl}
          disabled={!urlInput.trim() || images.length >= maxImages}
          className="h-10 px-4 text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          {t("addUrlButton")}
        </Button>
      </div>

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          {images.map((img, index) => (
            <div
              key={`${img.slice(0, 32)}-${index}`}
              className="group relative aspect-square rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow transition-all"
            >
              <Image
                src={img}
                alt={`Product image ${index + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-contain p-2"
                unoptimized
              />

              {/* Primary Image Badge */}
              {index === 0 ? (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white flex items-center gap-1 shadow">
                  <Star className="w-2.5 h-2.5 fill-white" />
                  {t("primaryBadge")}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(index)}
                  title={t("setPrimaryTooltip")}
                  className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition"
                >
                  {t("setPrimaryTooltip")}
                </button>
              )}

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                title={t("deletePhotoTooltip")}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-700 transition shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
