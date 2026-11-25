import { DashboardWrapper } from "./DashboardWrapper";
import { getDashboardStats } from "@/server/services/laporan/laporanService";
import { requirePageAccess } from "@/server/services/auth/rbacService";
import { AccessDeniedView } from "@/components/layout/AccessDeniedView";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — GarageLog",
  description: "Ringkasan kondisi bengkel modifikasi motor hari ini.",
};

export default async function DashboardPage() {
  const access = await requirePageAccess("dashboard");
  if (!access.hasAccess) {
    return (
      <AccessDeniedView
        staff={{ nama: access.user.nama, peran: access.user.peran }}
        allowedFeatures={access.allowedFeatures}
        featureName="Dashboard"
      />
    );
  }

  const stats = await getDashboardStats();
  const canCreateOrder =
    access.permissions.pesanan.dapat_akses &&
    access.permissions.pesanan.dapat_kelola;

  return (
    <DashboardWrapper
      initialStats={serializeDecimals(stats)}
      activeStaff={{ nama: access.user.nama, peran: access.user.peran }}
      allowedFeatures={access.allowedFeatures}
      canCreateOrder={canCreateOrder}
    />
  );
}
