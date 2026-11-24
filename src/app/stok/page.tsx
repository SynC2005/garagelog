import { StokWrapper } from "./StokWrapper";
import { getInventory, getStockMovements } from "@/server/services/stok/stokService";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stok Suku Cadang & Aksesori — GarageLog",
  description: "Inventori suku cadang, mutasi barang masuk, koreksi stok, dan riwayat pergerakan.",
};

export default async function StokPage() {
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
    />
  );
}
