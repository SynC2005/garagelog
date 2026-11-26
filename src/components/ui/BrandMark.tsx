"use client";

import { useBrand } from "@/components/brand-provider";
import { WorkshopEmblem } from "@/components/ui/WorkshopEmblem";

export interface BrandMarkProps {
  size?: "sm" | "md";
  subtitleOverride?: string;
}

export function BrandMark({ size = "md", subtitleOverride }: BrandMarkProps) {
  const brand = useBrand();
  const boxSizeClass = size === "sm" ? "size-9" : "size-10";
  const iconSizeClass = size === "sm" ? "size-5" : "size-5";
  const titleSizeClass = size === "sm" ? "text-base" : "text-lg";
  const subtitle = subtitleOverride ?? brand.taglinePerusahaan;
  const isDefaultName = brand.namaPerusahaan.trim() === "GarageLog";

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {brand.logoUrl ? (
        <div
          className={`${boxSizeClass} rounded-lg border border-border bg-card overflow-hidden flex items-center justify-center shrink-0 p-0.5`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brand.logoUrl}
            alt={`Logo ${brand.namaPerusahaan}`}
            className="w-full h-full object-contain rounded-[6px]"
          />
        </div>
      ) : (
        <div
          className={`${boxSizeClass} rounded-lg bg-foreground text-background dark:bg-primary dark:text-primary-foreground flex items-center justify-center shrink-0`}
        >
          <WorkshopEmblem className={iconSizeClass} />
        </div>
      )}

      <div className="min-w-0">
        <span
          className={`font-bold ${titleSizeClass} tracking-tight text-foreground block truncate`}
        >
          {isDefaultName ? (
            <>
              Garage<span className="text-primary">Log</span>
            </>
          ) : (
            brand.namaPerusahaan
          )}
        </span>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground font-medium -mt-0.5 hidden sm:block truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
