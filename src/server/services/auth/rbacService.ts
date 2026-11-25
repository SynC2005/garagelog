import { redirect } from "next/navigation";
import { PeranUser } from "@prisma/client";
import { prisma } from "@/server/db";
import {
  DEFAULT_ROLE_PERMISSIONS,
  RBAC_FEATURES,
  type FeatureCode,
  type RolePermissionsMap,
} from "@/lib/rbac";
import { getSessionFromCookie } from "./sessionService";

export interface AuthenticatedStaff {
  id: number;
  nama: string;
  email: string;
  peran: PeranUser;
}

export interface StaffAccessContext {
  user: AuthenticatedStaff;
  permissions: RolePermissionsMap;
  allowedFeatures: Record<FeatureCode, boolean>;
  hasAccess: boolean;
  canManage: boolean;
}

/**
 * Pastikan seluruh baris default hak akses (3 peran x 9 fitur) tersedia di PostgreSQL
 */
export async function ensureDefaultRolePermissions() {
  const expectedCount = Object.keys(DEFAULT_ROLE_PERMISSIONS).length * RBAC_FEATURES.length;
  const existingCount = await prisma.hakAksesPeran.count();
  if (existingCount >= expectedCount) return;

  const rows: {
    peran: PeranUser;
    fitur_kode: string;
    nama_fitur: string;
    rute: string;
    dapat_akses: boolean;
    dapat_kelola: boolean;
  }[] = [];

  for (const peran of Object.values(PeranUser)) {
    const defaults = DEFAULT_ROLE_PERMISSIONS[peran];
    for (const feature of RBAC_FEATURES) {
      const rule = defaults[feature.kode];
      rows.push({
        peran,
        fitur_kode: feature.kode,
        nama_fitur: feature.nama,
        rute: feature.rute,
        dapat_akses: rule.dapat_akses,
        dapat_kelola: rule.dapat_kelola,
      });
    }
  }

  await prisma.hakAksesPeran.createMany({
    data: rows,
    skipDuplicates: true,
  });
}

/**
 * Ambil matriks hak akses aktif dari database untuk peran tertentu
 */
export async function getPermissionsForRole(
  peran: PeranUser
): Promise<RolePermissionsMap> {
  await ensureDefaultRolePermissions();

  const dbRows = await prisma.hakAksesPeran.findMany({
    where: { peran },
  });

  const base = structuredClone(DEFAULT_ROLE_PERMISSIONS[peran]);
  for (const row of dbRows) {
    const code = row.fitur_kode as FeatureCode;
    if (code in base) {
      base[code] = {
        dapat_akses: row.dapat_akses,
        dapat_kelola: row.dapat_kelola,
      };
    }
  }

  // Safeguard: Admin selalu memiliki akses penuh ke menu Pengaturan agar tidak terkunci
  if (peran === PeranUser.Admin) {
    base.pengaturan = { dapat_akses: true, dapat_kelola: true };
  }

  return base;
}

export function buildAllowedFeaturesMap(
  permissions: RolePermissionsMap
): Record<FeatureCode, boolean> {
  return {
    dashboard: permissions.dashboard.dapat_akses,
    pesanan: permissions.pesanan.dapat_akses,
    pembayaran: permissions.pembayaran.dapat_akses,
    tugas: permissions.tugas.dapat_akses,
    pelanggan: permissions.pelanggan.dapat_akses,
    jasa: permissions.jasa.dapat_akses,
    stok: permissions.stok.dapat_akses,
    laporan: permissions.laporan.dapat_akses,
    pengaturan: permissions.pengaturan.dapat_akses,
  };
}

/**
 * Ambil staf yang sedang login beserta status aktif dan hak akses terkininya dari DB
 */
export async function getAuthenticatedStaffContext(): Promise<{
  user: AuthenticatedStaff;
  permissions: RolePermissionsMap;
  allowedFeatures: Record<FeatureCode, boolean>;
} | null> {
  const session = await getSessionFromCookie();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      nama: true,
      email: true,
      peran: true,
      aktif: true,
    },
  });

  if (!user || !user.aktif) return null;

  const permissions = await getPermissionsForRole(user.peran);
  const allowedFeatures = buildAllowedFeaturesMap(permissions);

  return {
    user: {
      id: user.id,
      nama: user.nama,
      email: user.email,
      peran: user.peran,
    },
    permissions,
    allowedFeatures,
  };
}

/**
 * Guard untuk Server Component (`page.tsx`).
 * Jika belum login -> redirect ke `/masuk`.
 * Jika login tetapi tidak punya akses -> kembalikan `hasAccess: false` agar UI menampilkan status terlarang.
 */
export async function requirePageAccess(
  feature: FeatureCode
): Promise<StaffAccessContext> {
  const ctx = await getAuthenticatedStaffContext();
  if (!ctx) {
    redirect("/masuk");
  }

  const rule = ctx.permissions[feature];
  return {
    user: ctx.user,
    permissions: ctx.permissions,
    allowedFeatures: ctx.allowedFeatures,
    hasAccess: rule?.dapat_akses ?? false,
    canManage: rule?.dapat_kelola ?? false,
  };
}

/**
 * Guard keras di sisi server untuk Server Actions & layanan backend (`src/server/api/*`)
 */
export async function requireActionPermission(
  feature: FeatureCode,
  level: "akses" | "kelola" = "kelola"
): Promise<AuthenticatedStaff> {
  const ctx = await getAuthenticatedStaffContext();
  if (!ctx) {
    throw new Error(
      "Sesi login Anda telah berakhir atau belum masuk. Silakan login kembali di halaman Masuk Staf."
    );
  }

  const rule = ctx.permissions[feature];
  const allowed =
    level === "kelola"
      ? Boolean(rule?.dapat_akses && rule?.dapat_kelola)
      : Boolean(rule?.dapat_akses);

  if (!allowed) {
    const featureLabel =
      RBAC_FEATURES.find((f) => f.kode === feature)?.nama || feature;
    throw new Error(
      `Akses ditolak: Peran ${ctx.user.peran} tidak memiliki izin untuk ${
        level === "kelola" ? "mengelola" : "mengakses"
      } fitur "${featureLabel}".`
    );
  }

  return ctx.user;
}

