import { getServices } from "@/server/services/jasa/jasaService";
import { JasaWrapper } from "./JasaWrapper";
import { requirePageAccess } from "@/server/services/auth/rbacService";
import { AccessDeniedView } from "@/components/layout/AccessDeniedView";
import { serializeDecimals } from "@/utils/serialize";

export const metadata = {
  title: "Katalog Jasa Modifikasi — GarageLog",
  description:
    "Daftar paket dan jenis jasa modifikasi motor yang ditawarkan bengkel.",
};

export const dynamic = "force-dynamic";

export default async function JasaPage() {
  const access = await requirePageAccess("jasa");
  if (!access.hasAccess) {
    return (
      <AccessDeniedView
        staff={{ nama: access.user.nama, peran: access.user.peran }}
        allowedFeatures={access.allowedFeatures}
        featureName="Katalog Jasa"
      />
    );
  }

  const services = await getServices();
  return (
    <JasaWrapper
      initialServices={serializeDecimals(services)}
      activeStaff={{ nama: access.user.nama, peran: access.user.peran }}
      allowedFeatures={access.allowedFeatures}
      canManage={access.canManage}
    />
  );
}
