import { NotaWrapper } from "./NotaWrapper";
import { getOrderByCode } from "@/server/services/pesanan/pesananService";
import { requirePageAccess } from "@/server/services/auth/rbacService";
import { AccessDeniedView } from "@/components/layout/AccessDeniedView";
import { serializeDecimals } from "@/utils/serialize";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface NotaPageProps {
  params: Promise<{
    kode: string;
  }>;
}

export async function generateMetadata({ params }: NotaPageProps) {
  const { kode } = await params;
  return {
    title: `Nota Pembayaran ${kode} — GarageLog`,
  };
}

export default async function NotaPage({ params }: NotaPageProps) {
  const access = await requirePageAccess("pembayaran");
  if (!access.hasAccess) {
    return (
      <AccessDeniedView
        staff={{ nama: access.user.nama, peran: access.user.peran }}
        allowedFeatures={access.allowedFeatures}
        featureName="Pembayaran & Cetak Nota"
      />
    );
  }

  const { kode } = await params;
  const order = await getOrderByCode(kode);

  if (!order) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-4 text-center">
        <Card className="max-w-md w-full py-0 gap-0">
          <CardContent className="p-8 space-y-4">
            <div className="size-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="size-6" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Nota Tidak Ditemukan
            </h1>
            <p className="text-xs text-muted-foreground">
              Tidak ditemukan data pesanan dengan kode {kode}.
            </p>
            <div className="pt-2">
              <Button asChild size="sm" className="w-full">
                <Link href="/pesanan">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  <span>Kembali</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <NotaWrapper order={serializeDecimals(order)} />;
}
