import { PengaturanWrapper } from "./PengaturanWrapper";
import { getStaffAccounts, getStageTemplates } from "@/server/services/pengaturan/pengaturanService";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan Bengkel — GarageLog",
  description: "Manajemen akun staf bengkel dan konfigurasi template tahapan pengerjaan.",
};

export default async function PengaturanPage() {
  const [staffAccounts, stageTemplates] = await Promise.all([
    getStaffAccounts(),
    getStageTemplates(),
  ]);

  return (
    <PengaturanWrapper
      initialStaffList={staffAccounts}
      initialStagesList={stageTemplates}
    />
  );
}
