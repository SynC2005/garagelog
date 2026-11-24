import { TugasWrapper } from "./TugasWrapper";
import { getActiveTasks } from "@/server/services/tugas/tugasService";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tugas Pengerjaan — GarageLog",
  description: "Daftar pekerjaan aktif montir dan pembaruan progres tahapan modifikasi motor.",
};

export default async function TugasPage() {
  const tasks = await getActiveTasks();
  return <TugasWrapper initialTasks={serializeDecimals(tasks)} />;
}
