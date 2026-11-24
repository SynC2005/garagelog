import { LacakDetailWrapper } from "./LacakDetailWrapper";
import { getPublicTracking } from "@/server/services/lacak/lacakService";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface LacakDetailPageProps {
  params: Promise<{
    kode: string;
  }>;
}

export async function generateMetadata({ params }: LacakDetailPageProps) {
  const { kode } = await params;
  return {
    title: `Progres Modifikasi ${kode} — GarageLog`,
    description: `Linimasa pengerjaan dan status terkini motor untuk pesanan ${kode}.`,
  };
}

export default async function LacakDetailPage({ params }: LacakDetailPageProps) {
  const { kode } = await params;
  const trackingData = await getPublicTracking(kode);

  if (!trackingData) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-4 text-center">
        <Card className="max-w-md w-full py-0 gap-0">
          <CardContent className="p-8 space-y-4">
            <div className="size-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="size-6" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Pesanan Tidak Ditemukan
            </h1>
            <p className="text-xs text-muted-foreground">
              Tidak ditemukan data pesanan dengan kode{" "}
              <span className="font-mono font-bold text-foreground uppercase">
                {kode}
              </span>
              . Pastikan kode yang Anda masukkan sesuai dengan nota resmi bengkel.
            </p>
            <div className="pt-2">
              <Button asChild size="sm" className="w-full">
                <Link href="/lacak">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  <span>Cari Kode Lain</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <LacakDetailWrapper trackingData={trackingData} />;
}
