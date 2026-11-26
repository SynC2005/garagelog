"use client";

import * as React from "react";
import { UploadCloud, RotateCcw, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_LANDING_IMAGE_BYTES,
} from "@/lib/landingDefaults";

export interface ImageUploadFieldProps {
  id: string;
  label: string;
  description?: string;
  value: string | null;
  fallbackLabel?: string;
  aspect?: "square" | "video" | "portrait";
  maxDimension?: number;
  preserveTransparency?: boolean;
  disabled?: boolean;
  resetLabel?: string;
  onReset?: () => void;
  onChange: (nextUrl: string | null) => void;
}

async function optimizeImageFile(
  file: File,
  maxDimension: number,
  preserveTransparency: boolean
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Berkas gambar gagal dibaca."));
      el.src = objectUrl;
    });

    const scale = Math.min(
      1,
      maxDimension / Math.max(img.naturalWidth || 1, img.naturalHeight || 1)
    );
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Browser tidak mendukung pemrosesan gambar.");
    }
    ctx.drawImage(img, 0, 0, width, height);

    const outputMime =
      preserveTransparency && file.type === "image/png"
        ? "image/png"
        : "image/webp";
    const quality = outputMime === "image/webp" ? 0.86 : undefined;
    return canvas.toDataURL(outputMime, quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ImageUploadField({
  id,
  label,
  description,
  value,
  fallbackLabel = "Menggunakan tampilan bawaan",
  aspect = "square",
  maxDimension = 1280,
  preserveTransparency = false,
  disabled = false,
  resetLabel = "Reset Bawaan",
  onReset,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isReading, setIsReading] = React.useState(false);

  const previewFrameClass =
    aspect === "video"
      ? "w-full aspect-video max-h-40"
      : aspect === "portrait"
      ? "w-28 aspect-[3/4]"
      : "size-24";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);

    if (
      !ALLOWED_IMAGE_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
      )
    ) {
      setError("Format tidak didukung. Pilih gambar JPG, PNG, atau WebP.");
      return;
    }

    if (file.size > MAX_LANDING_IMAGE_BYTES) {
      setError("Ukuran berkas melebihi 5 MB.");
      return;
    }

    setIsReading(true);
    try {
      const encoded = await optimizeImageFile(
        file,
        maxDimension,
        preserveTransparency
      );
      onChange(encoded);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal memproses gambar."
      );
    } finally {
      setIsReading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <div>
        <Label htmlFor={id} className="text-xs font-semibold text-foreground">
          {label}
        </Label>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 p-3 rounded-lg border border-border bg-muted/30">
        <div
          className={`${previewFrameClass} rounded-md border border-border bg-card overflow-hidden flex items-center justify-center shrink-0`}
        >
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={value}
              alt={label}
              className={`w-full h-full ${
                aspect === "square" ? "object-contain p-1" : "object-cover"
              }`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center px-2 py-2 text-muted-foreground">
              <ImageIcon className="size-5 mb-1 opacity-70" aria-hidden="true" />
              <span className="text-[10px] leading-tight">{fallbackLabel}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 min-w-0 flex-1">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled || isReading}
            onChange={handleFileChange}
            className="sr-only"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={disabled || isReading}
              onClick={() => inputRef.current?.click()}
            >
              <UploadCloud className="size-3.5" aria-hidden="true" />
              <span>
                {isReading
                  ? "Memproses..."
                  : value
                  ? "Ganti Foto"
                  : "Upload Foto"}
              </span>
            </Button>

            {onReset && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={disabled || isReading}
                onClick={() => {
                  setError(null);
                  onReset();
                }}
                className="text-muted-foreground"
              >
                <RotateCcw className="size-3" aria-hidden="true" />
                <span>{resetLabel}</span>
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Format JPG, PNG, atau WebP. Maksimal 5 MB.
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="text-[11px] font-medium text-destructive inline-flex items-center gap-1"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

