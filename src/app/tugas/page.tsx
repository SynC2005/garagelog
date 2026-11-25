import { TugasWrapper } from "./TugasWrapper";
import { getActiveTasks } from "@/server/services/tugas/tugasService";
import { getActiveMechanics } from "@/server/services/pesanan/pesananService";
import { requirePageAccess } from "@/server/services/auth/rbacService";
import { AccessDeniedView } from "@/components/layout/AccessDeniedView";
import { serializeDecimals } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tugas Pengerjaan — GarageLog",
  description:
    "Daftar pekerjaan aktif montir dan pembaruan progres tahapan modifikasi motor.",
};

export default async function TugasPage() {
  const access = await requirePageAccess("tugas");
  if (!access.hasAccess) {
    return (
      <AccessDeniedView
        staff={{ nama: access.user.nama, peran: access.user.peran }}
        allowedFeatures={access.allowedFeatures}
        featureName="Tugas Pengerjaan"
      />
    );
  }

  const canAssignMechanic =
    access.permissions.pesanan.dapat_akses &&
    access.permissions.pesanan.dapat_kelola;

  const [tasks, mechanics] = await Promise.all([
    getActiveTasks({ userId: access.user.id, peran: access.user.peran }),
    canAssignMechanic ? getActiveMechanics() : Promise.resolve([]),
  ]);

  return (
    <TugasWrapper
      initialTasks={serializeDecimals(tasks)}
      mechanics={mechanics}
      canAssignMechanic={canAssignMechanic}
      activeStaff={{ nama: access.user.nama, peran: access.user.peran }}
      allowedFeatures={access.allowedFeatures}
      canManage={access.canManage}
    />
  );
}
