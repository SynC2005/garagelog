import { DetailPesananWrapper } from "./DetailPesananWrapper";
import { getOrderByCode } from "@/server/services/pesanan/pesananService";
import { serializeDecimals } from "@/utils/serialize";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface DetailPesananPageProps {
  params: Promise<{
    kode: string;
  }>;
}

export async function generateMetadata({ params }: DetailPesananPageProps) {
  const { kode } = await params;
  return {
    title: `Detail Pesanan ${kode} — GarageLog`,
    description: `Rincian pengerjaan, estimasi biaya, dan pembayaran pesanan ${kode}.`,
  };
}

export default async function DetailPesananPage({ params }: DetailPesananPageProps) {
  const { kode } = await params;
  const order = await getOrderByCode(kode);

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Pesanan Tidak Ditemukan
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Tidak ditemukan data pesanan dengan kode{" "}
            <span className="font-mono font-bold text-slate-900 dark:text-white uppercase">
              {kode}
            </span>
            .
          </p>
          <div className="pt-2">
            <Link href="/pesanan">
              <Button size="sm" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Kembali ke Daftar Pesanan</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <DetailPesananWrapper order={serializeDecimals(order)} />;
}
