import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import {
  DEFAULT_CUSTOMER_REVIEWS,
  DEFAULT_LANDING_SETTINGS,
  validateImageSource,
  type BrandIdentityData,
  type CustomerReviewItem,
  type LandingSettingsData,
} from "@/lib/landingDefaults";

function mapSettingsRow(row: {
  nama_perusahaan: string;
  tagline_perusahaan: string;
  logo_url: string | null;
  hero_bg_url: string | null;
  pemilik_nama: string;
  pemilik_jabatan: string;
  pemilik_foto_url: string;
  pemilik_kutipan: string;
  tahun_berdiri: number;
}): LandingSettingsData {
  return {
    namaPerusahaan: row.nama_perusahaan,
    taglinePerusahaan: row.tagline_perusahaan,
    logoUrl: row.logo_url,
    heroBgUrl: row.hero_bg_url,
    pemilikNama: row.pemilik_nama,
    pemilikJabatan: row.pemilik_jabatan,
    pemilikFotoUrl: row.pemilik_foto_url,
    pemilikKutipan: row.pemilik_kutipan,
    tahunBerdiri: row.tahun_berdiri,
  };
}

function mapReviewRow(row: {
  id: number;
  nama: string;
  motor: string;
  rating: number;
  komentar: string;
  ditampilkan: boolean;
  urutan: number;
}): CustomerReviewItem {
  return {
    id: row.id,
    nama: row.nama,
    motor: row.motor,
    rating: row.rating,
    komentar: row.komentar,
    ditampilkan: row.ditampilkan,
    urutan: row.urutan,
  };
}

/**
 * Pastikan pengaturan landing & ulasan bawaan tersedia di PostgreSQL pada pemakaian awal
 */
export async function ensureDefaultLandingData() {
  const existing = await prisma.pengaturanLanding.findUnique({
    where: { id: 1 },
  });
  if (existing) return existing;

  return await prisma.$transaction(async (tx) => {
    const row = await tx.pengaturanLanding.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        nama_perusahaan: DEFAULT_LANDING_SETTINGS.namaPerusahaan,
        tagline_perusahaan: DEFAULT_LANDING_SETTINGS.taglinePerusahaan,
        logo_url: DEFAULT_LANDING_SETTINGS.logoUrl,
        hero_bg_url: DEFAULT_LANDING_SETTINGS.heroBgUrl,
        pemilik_nama: DEFAULT_LANDING_SETTINGS.pemilikNama,
        pemilik_jabatan: DEFAULT_LANDING_SETTINGS.pemilikJabatan,
        pemilik_foto_url: DEFAULT_LANDING_SETTINGS.pemilikFotoUrl,
        pemilik_kutipan: DEFAULT_LANDING_SETTINGS.pemilikKutipan,
        tahun_berdiri: DEFAULT_LANDING_SETTINGS.tahunBerdiri,
      },
    });

    const reviewCount = await tx.ulasanPelanggan.count();
    if (reviewCount === 0) {
      await tx.ulasanPelanggan.createMany({
        data: DEFAULT_CUSTOMER_REVIEWS,
      });
    }

    return row;
  });
}

export async function getLandingSettings(): Promise<LandingSettingsData> {
  const row = await ensureDefaultLandingData();
  return mapSettingsRow(row);
}

export async function getBrandIdentitySafe(): Promise<BrandIdentityData> {
  try {
    const settings = await getLandingSettings();
    return {
      namaPerusahaan: settings.namaPerusahaan,
      taglinePerusahaan: settings.taglinePerusahaan,
      logoUrl: settings.logoUrl,
    };
  } catch {
    return {
      namaPerusahaan: DEFAULT_LANDING_SETTINGS.namaPerusahaan,
      taglinePerusahaan: DEFAULT_LANDING_SETTINGS.taglinePerusahaan,
      logoUrl: DEFAULT_LANDING_SETTINGS.logoUrl,
    };
  }
}

export async function getPublicLandingContent(): Promise<{
  settings: LandingSettingsData;
  visibleReviews: CustomerReviewItem[];
}> {
  const row = await ensureDefaultLandingData();
  const reviews = await prisma.ulasanPelanggan.findMany({
    where: { ditampilkan: true },
    orderBy: [{ urutan: "asc" }, { id: "asc" }],
  });

  return {
    settings: mapSettingsRow(row),
    visibleReviews: reviews.map(mapReviewRow),
  };
}

export async function getAllCustomerReviews(): Promise<CustomerReviewItem[]> {
  await ensureDefaultLandingData();
  const reviews = await prisma.ulasanPelanggan.findMany({
    orderBy: [{ urutan: "asc" }, { id: "asc" }],
  });
  return reviews.map(mapReviewRow);
}

export interface UpdateLandingSettingsInput {
  namaPerusahaan: string;
  taglinePerusahaan: string;
  logoUrl: string | null;
  heroBgUrl: string | null;
  pemilikNama: string;
  pemilikJabatan: string;
  pemilikFotoUrl: string | null;
  pemilikKutipan: string;
  tahunBerdiri: number;
}

export async function updateLandingSettings(
  input: UpdateLandingSettingsInput
): Promise<LandingSettingsData> {
  const currentYear = new Date().getFullYear();
  const namaPerusahaan = input.namaPerusahaan.trim();
  const taglinePerusahaan = input.taglinePerusahaan.trim();
  const pemilikNama = input.pemilikNama.trim();
  const pemilikJabatan = input.pemilikJabatan.trim();
  const pemilikKutipan = input.pemilikKutipan.trim();

  if (!namaPerusahaan) throw new Error("Nama perusahaan wajib diisi.");
  if (!taglinePerusahaan) throw new Error("Tagline bengkel wajib diisi.");
  if (!pemilikNama) throw new Error("Nama pemilik perusahaan wajib diisi.");
  if (!pemilikJabatan) throw new Error("Jabatan pemilik wajib diisi.");
  if (!pemilikKutipan) throw new Error("Kata-kata pemilik wajib diisi.");
  if (
    !Number.isInteger(input.tahunBerdiri) ||
    input.tahunBerdiri < 1950 ||
    input.tahunBerdiri > currentYear
  ) {
    throw new Error(`Tahun berdiri harus antara 1950 dan ${currentYear}.`);
  }

  const safeLogoUrl = validateImageSource(input.logoUrl);
  const safeHeroBgUrl = validateImageSource(input.heroBgUrl);
  const safeOwnerPhotoUrl =
    validateImageSource(input.pemilikFotoUrl) ??
    DEFAULT_LANDING_SETTINGS.pemilikFotoUrl;

  const updated = await prisma.pengaturanLanding.upsert({
    where: { id: 1 },
    update: {
      nama_perusahaan: namaPerusahaan,
      tagline_perusahaan: taglinePerusahaan,
      logo_url: safeLogoUrl,
      hero_bg_url: safeHeroBgUrl,
      pemilik_nama: pemilikNama,
      pemilik_jabatan: pemilikJabatan,
      pemilik_foto_url: safeOwnerPhotoUrl,
      pemilik_kutipan: pemilikKutipan,
      tahun_berdiri: input.tahunBerdiri,
    },
    create: {
      id: 1,
      nama_perusahaan: namaPerusahaan,
      tagline_perusahaan: taglinePerusahaan,
      logo_url: safeLogoUrl,
      hero_bg_url: safeHeroBgUrl,
      pemilik_nama: pemilikNama,
      pemilik_jabatan: pemilikJabatan,
      pemilik_foto_url: safeOwnerPhotoUrl,
      pemilik_kutipan: pemilikKutipan,
      tahun_berdiri: input.tahunBerdiri,
    },
  });

  return mapSettingsRow(updated);
}

export interface CustomerReviewInput {
  nama: string;
  motor: string;
  rating: number;
  komentar: string;
  ditampilkan: boolean;
}

export async function createCustomerReview(
  input: CustomerReviewInput
): Promise<CustomerReviewItem> {
  const nama = input.nama.trim();
  const motor = input.motor.trim();
  const komentar = input.komentar.trim();
  const rating = Math.round(input.rating);

  if (!nama) throw new Error("Nama pelanggan wajib diisi.");
  if (!motor) throw new Error("Tipe motor pelanggan wajib diisi.");
  if (!komentar) throw new Error("Isi komentar ulasan wajib diisi.");
  if (rating < 1 || rating > 5) throw new Error("Rating harus bernilai 1–5.");

  const maxOrder = await prisma.ulasanPelanggan.aggregate({
    _max: { urutan: true },
  });

  const created = await prisma.ulasanPelanggan.create({
    data: {
      nama,
      motor,
      rating,
      komentar,
      ditampilkan: input.ditampilkan,
      urutan: (maxOrder._max.urutan ?? 0) + 1,
    },
  });

  return mapReviewRow(created);
}

export async function updateCustomerReview(
  id: number,
  input: CustomerReviewInput
): Promise<CustomerReviewItem> {
  const nama = input.nama.trim();
  const motor = input.motor.trim();
  const komentar = input.komentar.trim();
  const rating = Math.round(input.rating);

  if (!nama) throw new Error("Nama pelanggan wajib diisi.");
  if (!motor) throw new Error("Tipe motor pelanggan wajib diisi.");
  if (!komentar) throw new Error("Isi komentar ulasan wajib diisi.");
  if (rating < 1 || rating > 5) throw new Error("Rating harus bernilai 1–5.");

  try {
    const updated = await prisma.ulasanPelanggan.update({
      where: { id },
      data: {
        nama,
        motor,
        rating,
        komentar,
        ditampilkan: input.ditampilkan,
      },
    });
    return mapReviewRow(updated);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new Error("Ulasan pelanggan tidak ditemukan.");
    }
    throw err;
  }
}

export async function toggleCustomerReviewVisibility(
  id: number,
  ditampilkan: boolean
): Promise<CustomerReviewItem> {
  try {
    const updated = await prisma.ulasanPelanggan.update({
      where: { id },
      data: { ditampilkan },
    });
    return mapReviewRow(updated);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new Error("Ulasan pelanggan tidak ditemukan.");
    }
    throw err;
  }
}

export async function reorderCustomerReview(
  id: number,
  direction: "up" | "down"
): Promise<CustomerReviewItem[]> {
  return await prisma.$transaction(async (tx) => {
    const all = await tx.ulasanPelanggan.findMany({
      orderBy: [{ urutan: "asc" }, { id: "asc" }],
    });
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) throw new Error("Ulasan pelanggan tidak ditemukan.");

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= all.length) {
      return all.map(mapReviewRow);
    }

    const current = all[idx];
    const target = all[swapIdx];

    await tx.ulasanPelanggan.update({
      where: { id: current.id },
      data: { urutan: target.urutan },
    });
    await tx.ulasanPelanggan.update({
      where: { id: target.id },
      data: { urutan: current.urutan },
    });

    const refreshed = await tx.ulasanPelanggan.findMany({
      orderBy: [{ urutan: "asc" }, { id: "asc" }],
    });
    return refreshed.map(mapReviewRow);
  });
}

export async function deleteCustomerReview(id: number): Promise<void> {
  try {
    await prisma.ulasanPelanggan.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new Error("Ulasan pelanggan tidak ditemukan.");
    }
    throw err;
  }
}

