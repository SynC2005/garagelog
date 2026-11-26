"use client";

import * as React from "react";
import {
  DEFAULT_LANDING_SETTINGS,
  type BrandIdentityData,
} from "@/lib/landingDefaults";

const DEFAULT_BRAND: BrandIdentityData = {
  namaPerusahaan: DEFAULT_LANDING_SETTINGS.namaPerusahaan,
  taglinePerusahaan: DEFAULT_LANDING_SETTINGS.taglinePerusahaan,
  logoUrl: DEFAULT_LANDING_SETTINGS.logoUrl,
};

const BrandContext = React.createContext<BrandIdentityData>(DEFAULT_BRAND);

export function BrandProvider({
  initialBrand,
  children,
}: {
  initialBrand: BrandIdentityData;
  children: React.ReactNode;
}) {
  const value = React.useMemo<BrandIdentityData>(
    () => ({
      namaPerusahaan:
        initialBrand.namaPerusahaan || DEFAULT_BRAND.namaPerusahaan,
      taglinePerusahaan:
        initialBrand.taglinePerusahaan || DEFAULT_BRAND.taglinePerusahaan,
      logoUrl: initialBrand.logoUrl ?? null,
    }),
    [
      initialBrand.namaPerusahaan,
      initialBrand.taglinePerusahaan,
      initialBrand.logoUrl,
    ]
  );

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
}

export function useBrand() {
  return React.useContext(BrandContext);
}

