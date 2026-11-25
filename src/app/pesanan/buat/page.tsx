import { BuatPesananWrapper } from "./BuatPesananWrapper";
import { getCustomers } from "@/server/services/pelanggan/pelangganService";
import { getServices } from "@/server/services/jasa/jasaService";
import { getInventory } from "@/server/services/stok/stokService";
import { getStageTemplates } from "@/server/services/pengaturan/pengaturanService";
import { getActiveMechanics } from "@/server/services/pesanan/pesananService";
import { requirePageAccess } from "@/server/services/auth/rbacService";
import { AccessDeniedView } from "@/components/layout/AccessDeniedView";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buat Pesanan Baru — GarageLog",
  description:
    "Formulir pembuatan pesanan modifikasi dan estimasi biaya bengkel.",
};

export default async function BuatPesananPage() {
  const access = await requirePageAccess("pesanan");
  if (!access.hasAccess || !access.canManage) {
    return (
      <AccessDeniedView
        staff={{ nama: access.user.nama, peran: access.user.peran }}
        allowedFeatures={access.allowedFeatures}
        featureName="Buat Pesanan Modifikasi"
      />
    );
  }

  const [customers, services, spareParts, stageTemplates, mechanics] =
    await Promise.all([
      getCustomers(),
      getServices(),
      getInventory(),
      getStageTemplates(),
      getActiveMechanics(),
    ]);

  const formattedServices = services.map((s) => ({
    id: s.id,
    nama: s.nama,
    harga_dasar: Number(s.harga_dasar),
  }));

  const formattedParts = spareParts.map((p) => ({
    id: p.id,
    nama: p.nama,
    SKU: p.SKU,
    harga_jual: Number(p.harga_jual),
    stok: p.stok,
  }));

  return (
    <BuatPesananWrapper
      customers={serializeDecimals(customers)}
      servicesCatalog={formattedServices}
      sparePartsCatalog={formattedParts}
      stageTemplates={serializeDecimals(stageTemplates)}
      mechanics={mechanics}
      activeStaff={{ nama: access.user.nama, peran: access.user.peran }}
      allowedFeatures={access.allowedFeatures}
    />
  );
}
