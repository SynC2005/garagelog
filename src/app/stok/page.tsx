import { StokWrapper } from "./StokWrapper";
import {
  getInventory,
  getStockMovements,
} from "@/server/services/stok/stokService";
import { requirePageAccess } from "@/server/services/auth/rbacService";
import { AccessDeniedView } from "@/components/layout/AccessDeniedView";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stok Suku Cadang & Aksesori — GarageLog",
  description:
    "Inventori suku cadang, mutasi barang masuk, koreksi stok, dan riwayat pergerakan.",
};

export default async function StokPage() {
  const access = await requirePageAccess("stok");
  if (!access.hasAccess) {
    return (
      <AccessDeniedView
        staff={{ nama: access.user.nama, peran: access.user.peran }}
        allowedFeatures={access.allowedFeatures}
        featureName="Stok Suku Cadang"
      />
    );
  }

  const [items, movements] = await Promise.all([
    getInventory(),
    getStockMovements(30),
  ]);

  const formattedItems = items.map((item) => ({
    id: item.id,
    nama: item.nama,
    SKU: item.SKU,
    harga_jual: Number(item.harga_jual),
    stok: item.stok,
    stok_minimum: item.stok_minimum,
  }));

  return (
    <StokWrapper
      initialItems={formattedItems}
      initialMovements={serializeDecimals(movements)}
      activeStaff={{ nama: access.user.nama, peran: access.user.peran }}
      allowedFeatures={access.allowedFeatures}
      canManage={access.canManage}
    />
  );
}
