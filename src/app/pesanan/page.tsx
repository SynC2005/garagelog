import { PesananWrapper } from "./PesananWrapper";
import { getOrders } from "@/server/services/pesanan/pesananService";
import { requirePageAccess } from "@/server/services/auth/rbacService";
import { AccessDeniedView } from "@/components/layout/AccessDeniedView";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daftar Pesanan — GarageLog",
  description: "Daftar seluruh pesanan modifikasi motor.",
};

export default async function PesananPage() {
  const access = await requirePageAccess("pesanan");
  if (!access.hasAccess) {
    return (
      <AccessDeniedView
        staff={{ nama: access.user.nama, peran: access.user.peran }}
        allowedFeatures={access.allowedFeatures}
        featureName="Pesanan & Estimasi"
      />
    );
  }

  const { orders } = await getOrders({ take: 50 });
  return (
    <PesananWrapper
      initialOrders={serializeDecimals(orders)}
      activeStaff={{ nama: access.user.nama, peran: access.user.peran }}
      allowedFeatures={access.allowedFeatures}
      canManage={access.canManage}
    />
  );
}
