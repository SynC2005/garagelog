import { LaporanWrapper } from "./LaporanWrapper";
import { getSalesReport } from "@/server/services/laporan/laporanService";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Laporan & Analitik — GarageLog",
  description: "Laporan omzet penjualan dan performa durasi pengerjaan bengkel modifikasi.",
};

export default async function LaporanPage() {
  const reportData = await getSalesReport();
  return <LaporanWrapper initialData={serializeDecimals(reportData)} />;
}
