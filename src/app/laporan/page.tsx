import { LaporanWrapper } from "./LaporanWrapper";
import { getSalesReport } from "@/server/services/laporan/laporanService";
import { requirePageAccess } from "@/server/services/auth/rbacService";
import { AccessDeniedView } from "@/components/layout/AccessDeniedView";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Laporan & Analitik — GarageLog",
  description:
    "Laporan omzet penjualan dan performa durasi pengerjaan bengkel modifikasi.",
};

export default async function LaporanPage() {
  const access = await requirePageAccess("laporan");
  if (!access.hasAccess) {
    return (
      <AccessDeniedView
        staff={{ nama: access.user.nama, peran: access.user.peran }}
        allowedFeatures={access.allowedFeatures}
        featureName="Laporan & Analitik"
      />
    );
  }

  const reportData = await getSalesReport();
  return (
    <LaporanWrapper
      initialData={serializeDecimals(reportData)}
      activeStaff={{ nama: access.user.nama, peran: access.user.peran }}
      allowedFeatures={access.allowedFeatures}
    />
  );
}
