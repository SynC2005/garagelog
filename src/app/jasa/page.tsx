import { getServices } from "@/server/services/jasa/jasaService";
import { JasaWrapper } from "./JasaWrapper";
import { serializeDecimals } from "@/utils/serialize";

export const metadata = {
  title: "Katalog Jasa Modifikasi — GarageLog",
  description: "Daftar paket dan jenis jasa modifikasi motor yang ditawarkan bengkel.",
};

export const dynamic = "force-dynamic";

export default async function JasaPage() {
  const services = await getServices();
  return <JasaWrapper initialServices={serializeDecimals(services)} />;
}
