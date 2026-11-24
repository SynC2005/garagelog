import { DashboardWrapper } from "./DashboardWrapper";
import { getDashboardStats } from "@/server/services/laporan/laporanService";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — GarageLog",
  description: "Ringkasan kondisi bengkel modifikasi motor hari ini.",
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  return <DashboardWrapper initialStats={serializeDecimals(stats)} />;
}
