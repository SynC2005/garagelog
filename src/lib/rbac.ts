import { PeranUser } from "@prisma/client";

export type FeatureCode =
  | "dashboard"
  | "pesanan"
  | "pembayaran"
  | "tugas"
  | "pelanggan"
  | "jasa"
  | "stok"
  | "laporan"
  | "pengaturan";

export interface FeatureMeta {
  kode: FeatureCode;
  nama: string;
  deskripsi: string;
  rute: string;
  supportsManage: boolean;
}

export const RBAC_FEATURES: FeatureMeta[] = [
  {
    kode: "dashboard",
    nama: "Dashboard",
    deskripsi: "Ringkasan KPI bengkel, peringatan stok minimum, dan aktivitas terbaru.",
    rute: "/dashboard",
    supportsManage: false,
  },
  {
    kode: "pesanan",
    nama: "Pesanan & Estimasi",
    deskripsi: "Lihat daftar pesanan, buat pesanan baru, dan catat persetujuan estimasi.",
    rute: "/pesanan",
    supportsManage: true,
  },
  {
    kode: "pembayaran",
    nama: "Pembayaran & Nota",
    deskripsi: "Catat transaksi pembayaran DP/pelunasan dan cetak nota resmi bengkel.",
    rute: "/pesanan",
    supportsManage: true,
  },
  {
    kode: "tugas",
    nama: "Tugas Pengerjaan",
    deskripsi: "Perbarui tahap pengerjaan motor, catatan progres, dan unggah foto bukti.",
    rute: "/tugas",
    supportsManage: true,
  },
  {
    kode: "pelanggan",
    nama: "Pelanggan & Kendaraan",
    deskripsi: "Data master pelanggan beserta daftar kendaraan motor yang terdaftar.",
    rute: "/pelanggan",
    supportsManage: true,
  },
  {
    kode: "jasa",
    nama: "Katalog Jasa",
    deskripsi: "Daftar paket layanan modifikasi motor beserta tarif harga dasar.",
    rute: "/jasa",
    supportsManage: true,
  },
  {
    kode: "stok",
    nama: "Stok Suku Cadang",
    deskripsi: "Inventori barang, pencatatan barang masuk, dan koreksi stok opname.",
    rute: "/stok",
    supportsManage: true,
  },
  {
    kode: "laporan",
    nama: "Laporan & Analitik",
    deskripsi: "Laporan omzet penjualan periode dan rata-rata durasi pengerjaan.",
    rute: "/laporan",
    supportsManage: false,
  },
  {
    kode: "pengaturan",
    nama: "Pengaturan & Hak Akses",
    deskripsi: "Kelola akun staf, template tahapan pengerjaan, dan konfigurasi hak akses.",
    rute: "/pengaturan",
    supportsManage: true,
  },
];

export type RolePermissionRule = {
  dapat_akses: boolean;
  dapat_kelola: boolean;
};

export type RolePermissionsMap = Record<FeatureCode, RolePermissionRule>;

export const DEFAULT_ROLE_PERMISSIONS: Record<PeranUser, RolePermissionsMap> = {
  Admin: {
    dashboard: { dapat_akses: true, dapat_kelola: true },
    pesanan: { dapat_akses: true, dapat_kelola: true },
    pembayaran: { dapat_akses: true, dapat_kelola: true },
    tugas: { dapat_akses: true, dapat_kelola: true },
    pelanggan: { dapat_akses: true, dapat_kelola: true },
    jasa: { dapat_akses: true, dapat_kelola: true },
    stok: { dapat_akses: true, dapat_kelola: true },
    laporan: { dapat_akses: true, dapat_kelola: true },
    pengaturan: { dapat_akses: true, dapat_kelola: true },
  },
  Montir: {
    dashboard: { dapat_akses: false, dapat_kelola: false },
    pesanan: { dapat_akses: true, dapat_kelola: false },
    pembayaran: { dapat_akses: false, dapat_kelola: false },
    tugas: { dapat_akses: true, dapat_kelola: true },
    pelanggan: { dapat_akses: false, dapat_kelola: false },
    jasa: { dapat_akses: false, dapat_kelola: false },
    stok: { dapat_akses: false, dapat_kelola: false },
    laporan: { dapat_akses: false, dapat_kelola: false },
    pengaturan: { dapat_akses: false, dapat_kelola: false },
  },
  Pemilik: {
    dashboard: { dapat_akses: true, dapat_kelola: true },
    pesanan: { dapat_akses: true, dapat_kelola: false },
    pembayaran: { dapat_akses: true, dapat_kelola: false },
    tugas: { dapat_akses: false, dapat_kelola: false },
    pelanggan: { dapat_akses: true, dapat_kelola: false },
    jasa: { dapat_akses: true, dapat_kelola: false },
    stok: { dapat_akses: true, dapat_kelola: false },
    laporan: { dapat_akses: true, dapat_kelola: true },
    pengaturan: { dapat_akses: false, dapat_kelola: false },
  },
};

export function getDefaultRouteForPermissions(
  peran: PeranUser,
  permissions: Partial<Record<FeatureCode, boolean>>
): string {
  if (peran === PeranUser.Montir && permissions.tugas) {
    return "/tugas";
  }
  if (permissions.dashboard) {
    return "/dashboard";
  }
  const priorityOrder: { kode: FeatureCode; route: string }[] = [
    { kode: "tugas", route: "/tugas" },
    { kode: "pesanan", route: "/pesanan" },
    { kode: "laporan", route: "/laporan" },
    { kode: "stok", route: "/stok" },
    { kode: "pelanggan", route: "/pelanggan" },
    { kode: "jasa", route: "/jasa" },
    { kode: "pengaturan", route: "/pengaturan" },
  ];
  for (const item of priorityOrder) {
    if (permissions[item.kode]) {
      return item.route;
    }
  }
  return "/masuk";
}

