import { PelangganWrapper } from "./PelangganWrapper";
import { getCustomers } from "@/server/services/pelanggan/pelangganService";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pelanggan & Kendaraan — GarageLog",
  description: "Pengelolaan data master pelanggan dan kendaraan bermotor.",
};

export default async function PelangganPage() {
  const customers = await getCustomers();
  return <PelangganWrapper initialCustomers={serializeDecimals(customers)} />;
}
