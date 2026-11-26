import { PengaturanWrapper } from "./PengaturanWrapper";
import {
  getStaffAccounts,
  getStageTemplates,
  getAllRolePermissions,
} from "@/server/services/pengaturan/pengaturanService";
import {
  getAllCustomerReviews,
  getLandingSettings,
} from "@/server/services/pengaturan/landingService";
import { requirePageAccess } from "@/server/services/auth/rbacService";
import { AccessDeniedView } from "@/components/layout/AccessDeniedView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan Bengkel — GarageLog",
  description:
    "Manajemen akun staf bengkel, template tahapan pengerjaan, konfigurasi hak akses, dan pengaturan landing page.",
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

  const [
    staffAccounts,
    stageTemplates,
    rolePermissions,
    landingSettings,
    customerReviews,
  ] = await Promise.all([
    getStaffAccounts(),
    getStageTemplates(),
    getAllRolePermissions(),
    getLandingSettings(),
    getAllCustomerReviews(),
  ]);

  return (
    <PengaturanWrapper
      initialStaffList={staffAccounts}
      initialStagesList={stageTemplates}
      initialPermissionsList={rolePermissions}
      initialLandingSettings={landingSettings}
      initialReviewsList={customerReviews}
      activeStaff={{ nama: access.user.nama, peran: access.user.peran }}
      allowedFeatures={access.allowedFeatures}
      canManage={access.canManage}
    />
  );
}
