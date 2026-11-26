export interface LandingSettingsData {
  namaPerusahaan: string;
  taglinePerusahaan: string;
  logoUrl: string | null;
  heroBgUrl: string | null;
  pemilikNama: string;
  pemilikJabatan: string;
  pemilikFotoUrl: string;
  pemilikKutipan: string;
  tahunBerdiri: number;
}

export interface BrandIdentityData {
  namaPerusahaan: string;
  taglinePerusahaan: string;
  logoUrl: string | null;
}

export interface CustomerReviewItem {
  id: number;
  nama: string;
  motor: string;
  rating: number;
  komentar: string;
  ditampilkan: boolean;
  urutan: number;
}

export const MAX_LANDING_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const DEFAULT_LANDING_SETTINGS: LandingSettingsData = {
  namaPerusahaan: "GarageLog",
  taglinePerusahaan: "Bengkel Modifikasi Motor",
  logoUrl: null,
  heroBgUrl: null,
  pemilikNama: "Pak Hendro",
  pemilikJabatan: "Pemilik & Kepala Mekanik",
  pemilikFotoUrl: "/images/landing/pemilik-bengkel.jpg",
  pemilikKutipan:
    "Modifikasi motor bukan sekadar tampilan, tapi soal presisi rangka, keamanan kelistrikan, dan rasa percaya. Sejak bengkel ini berdiri tahun 2016, kami berkomitmen membuat setiap pemilik selalu melihat progres motornya secara jujur.",
  tahunBerdiri: 2016,
};

export const DEFAULT_CUSTOMER_REVIEWS: Omit<CustomerReviewItem, "id">[] = [
  {
    nama: "Budi Santoso",
    motor: "Yamaha Scorpio 225 (Cafe Racer)",
    rating: 5,
    komentar:
      "Las tangki kustomnya halus dan cat ovennya rapi banget. Dari awal bongkar sampai pengujian, foto progres selalu masuk jadi tidak perlu tanya-tanya terus.",
    ditampilkan: true,
    urutan: 1,
  },
  {
    nama: "Raka Pratama",
    motor: "Kawasaki W175 (Scrambler)",
    rating: 5,
    komentar:
      "Suka fitur lacak kodenya. Waktu nunggu shockbreaker datang pun dikasih pembaruan info oleh montir, pengerjaan selesai tepat estimasi.",
    ditampilkan: true,
    urutan: 2,
  },
  {
    nama: "Dimas Wijaya",
    motor: "Honda CB150R (Tracker)",
    rating: 5,
    komentar:
      "Jalur kabel lampu LED dirapikan tersembunyi di bawah jok dan diuji pakai multimeter sebelum serah terima. Sampai sekarang dipakai hujan tetap aman.",
    ditampilkan: true,
    urutan: 3,
  },
  {
    nama: "Fajar Nugroho",
    motor: "Yamaha XSR 155 (Brat Style)",
    rating: 5,
    komentar:
      "Rincian jasa sama suku cadangnya jelas dari awal sebelum dikerjakan. Tidak ada biaya mendadak dan nota cetaknya detail.",
    ditampilkan: true,
    urutan: 4,
  },
  {
    nama: "Bagus Setiawan",
    motor: "Suzuki Thunder 250 (Bobber)",
    rating: 4,
    komentar:
      "Setting karburator dan knalpot stainless langsung terasa responsif saat tes jalan. Sempat mundur sehari karena antre ruang cat oven, tapi hasilnya memuaskan.",
    ditampilkan: true,
    urutan: 5,
  },
  {
    nama: "Reza Mahendra",
    motor: "Honda Tiger 2000 (Japstyle)",
    rating: 5,
    komentar:
      "Subframe belakang dipotong ulang dan disambung rapi banget, posisi berkendara jauh lebih nyaman buat turing jarak jauh.",
    ditampilkan: true,
    urutan: 6,
  },
];

export function formatReviewSummary(review: {
  rating: number;
  nama: string;
  komentar: string;
}): string {
  const firstName = review.nama.trim().split(/\s+/)[0] || review.nama;
  const cleanComment = review.komentar.trim().replace(/\s+/g, " ");
  const snippet =
    cleanComment.length > 14
      ? `${cleanComment.slice(0, 14).trimEnd()}...`
      : cleanComment;
  return `★ ${review.rating.toFixed(1)} · ${firstName} — ${snippet}`;
}

export function validateImageSource(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/images/")) {
    return trimmed;
  }

  if (trimmed.startsWith("https://")) {
    return trimmed;
  }

  const dataUrlMatch = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(
    trimmed
  );
  if (!dataUrlMatch) {
    throw new Error(
      "Format gambar tidak valid. Gunakan file JPG, PNG, atau WebP."
    );
  }

  const base64Body = dataUrlMatch[2];
  const approxBytes = Math.floor((base64Body.length * 3) / 4);
  if (approxBytes > MAX_LANDING_IMAGE_BYTES) {
    throw new Error("Ukuran gambar melebihi batas maksimal 5 MB.");
  }

  return trimmed;
}

