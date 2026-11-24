import { PesananWrapper } from "./PesananWrapper";
import { getOrders } from "@/server/services/pesanan/pesananService";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daftar Pesanan — GarageLog",
  description: "Daftar seluruh pesanan modifikasi motor.",
};

export default async function PesananPage() {
  const { orders } = await getOrders({ take: 50 });
  return <PesananWrapper initialOrders={serializeDecimals(orders)} />;
}
