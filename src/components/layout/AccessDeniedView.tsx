"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getDefaultRouteForPermissions,
  type FeatureCode,
} from "@/lib/rbac";
import type { PeranUser } from "@prisma/client";

interface AccessDeniedViewProps {
  staff: {
    nama: string;
    peran: PeranUser;
  };
  allowedFeatures: Partial<Record<FeatureCode, boolean>>;
  featureName: string;
}

export function AccessDeniedView({
  staff,
  allowedFeatures,
  featureName,
}: AccessDeniedViewProps) {
  const homeRoute = getDefaultRouteForPermissions(staff.peran, allowedFeatures);

  return (
    <StaffLayout activeStaff={staff} allowedFeatures={allowedFeatures}>
      <div className="py-12 flex items-center justify-center">
        <Card className="max-w-lg w-full py-0 gap-0">
          <CardContent className="p-8 text-center space-y-4">
            <div className="size-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <ShieldAlert className="size-6" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="danger">Akses Ditolak</Badge>
                <Badge variant="outline">Peran: {staff.peran}</Badge>
              </div>
              <h1 className="text-xl font-bold text-foreground pt-1">
                Anda Tidak Memiliki Akses ke Halaman Ini
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                Fitur <strong className="text-foreground">{featureName}</strong>{" "}
                tidak diaktifkan untuk peran{" "}
                <strong className="text-foreground">{staff.peran}</strong>.
                Hubungi Admin bengkel jika Anda memerlukan tambahan hak akses
                melalui menu Pengaturan.
              </p>
            </div>

            <div className="pt-2">
              <Button asChild size="sm">
                <Link href={homeRoute}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  <span>Kembali ke Halaman Utama Anda</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}

