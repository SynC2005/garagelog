import { PengaturanWrapper } from "./PengaturanWrapper";
import {
  getStaffAccounts,
  getStageTemplates,
  getAllRolePermissions,
} from "@/server/services/pengaturan/pengaturanService";
import { requirePageAccess } from "@/server/services/auth/rbacService";
import { AccessDeniedView } from "@/components/layout/AccessDeniedView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan Bengkel — GarageLog",
  description:
    "Manajemen akun staf bengkel, template tahapan pengerjaan, dan konfigurasi hak akses.",
};

export default async function PengaturanPage() {
  const access = await requirePageAccess("pengaturan");
  if (!access.hasAccess) {
    return (
      <AccessDeniedView
        staff={{ nama: access.user.nama, peran: access.user.peran }}
        allowedFeatures={access.allowedFeatures}
        featureName="Pengaturan & Hak Akses"
      />
    );
  }

  const [staffAccounts, stageTemplates, rolePermissions] = await Promise.all([
    getStaffAccounts(),
    getStageTemplates(),
    getAllRolePermissions(),
  ]);

  return (
    <PengaturanWrapper
      initialStaffList={staffAccounts}
      initialStagesList={stageTemplates}
      initialPermissionsList={rolePermissions}
      activeStaff={{ nama: access.user.nama, peran: access.user.peran }}
      allowedFeatures={access.allowedFeatures}
      canManage={access.canManage}
    />
  );
}
