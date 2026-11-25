import { PelangganWrapper } from "./PelangganWrapper";
import { getCustomers } from "@/server/services/pelanggan/pelangganService";
import { requirePageAccess } from "@/server/services/auth/rbacService";
import { AccessDeniedView } from "@/components/layout/AccessDeniedView";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pelanggan & Kendaraan — GarageLog",
  description: "Pengelolaan data master pelanggan dan kendaraan bermotor.",
};

export default async function PelangganPage() {
  const access = await requirePageAccess("pelanggan");
  if (!access.hasAccess) {
    return (
      <AccessDeniedView
        staff={{ nama: access.user.nama, peran: access.user.peran }}
        allowedFeatures={access.allowedFeatures}
        featureName="Pelanggan & Kendaraan"
      />
    );
  }

  const customers = await getCustomers();
  return (
    <PelangganWrapper
      initialCustomers={serializeDecimals(customers)}
      activeStaff={{ nama: access.user.nama, peran: access.user.peran }}
      allowedFeatures={access.allowedFeatures}
      canManage={access.canManage}
    />
  );
}
