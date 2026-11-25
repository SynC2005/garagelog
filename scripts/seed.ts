import { PrismaClient, PeranUser, StatusPesanan, StatusTahap, JenisPembaruan, JenisPergerakanStok, MetodePembayaran } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_ROLE_PERMISSIONS, RBAC_FEATURES } from "../src/lib/rbac";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding GarageLog database with initial data...");

  // 1. Seed Akun Staf (Admin, Montir, Pemilik) (FR-01)
  const passwordHash = await bcrypt.hash("bengkel123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@garagelog.com" },
    update: {},
    create: {
      nama: "Farid Yusron (Admin)",
      email: "admin@garagelog.com",
      kata_sandi_hash: passwordHash,
      peran: PeranUser.Admin,
      aktif: true,
    },
  });

  const montir = await prisma.user.upsert({
    where: { email: "budi.montir@garagelog.com" },
    update: {},
    create: {
      nama: "Budi Montir",
      email: "budi.montir@garagelog.com",
      kata_sandi_hash: passwordHash,
      peran: PeranUser.Montir,
      aktif: true,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@garagelog.com" },
    update: {},
    create: {
      nama: "Pak Hendro (Pemilik)",
      email: "owner@garagelog.com",
      kata_sandi_hash: passwordHash,
      peran: PeranUser.Pemilik,
      aktif: true,
    },
  });

  console.log("Users seeded: Admin, Montir, Pemilik");

  // 1b. Seed Konfigurasi Hak Akses Peran (RBAC)
  for (const peran of Object.values(PeranUser)) {
    const defaults = DEFAULT_ROLE_PERMISSIONS[peran];
    for (const feature of RBAC_FEATURES) {
      const rule = defaults[feature.kode];
      await prisma.hakAksesPeran.upsert({
        where: {
          peran_fitur_kode: { peran, fitur_kode: feature.kode },
        },
        update: {},
        create: {
          peran,
          fitur_kode: feature.kode,
          nama_fitur: feature.nama,
          rute: feature.rute,
          dapat_akses: rule.dapat_akses,
          dapat_kelola: rule.dapat_kelola,
        },
      });
    }
  }
  console.log("Role permissions seeded");

  // 2. Seed Template Tahapan Bawaan (Tabel 12 PRD) (FR-16)
  const defaultTemplates = [
    { urutan: 1, nama: "Pemeriksaan awal", wajib_foto: true },
    { urutan: 2, nama: "Pembongkaran", wajib_foto: true },
    { urutan: 3, nama: "Pengerjaan bodi & rangka", wajib_foto: true },
    { urutan: 4, nama: "Pengecatan", wajib_foto: true },
    { urutan: 5, nama: "Pemasangan komponen", wajib_foto: true },
    { urutan: 6, nama: "Pengujian", wajib_foto: false },
    { urutan: 7, nama: "Siap diambil", wajib_foto: true },
  ];

  for (const t of defaultTemplates) {
    const existing = await prisma.templateTahap.findFirst({
      where: { nama: t.nama },
    });
    if (!existing) {
      await prisma.templateTahap.create({ data: t });
    }
  }

  console.log("Stage templates seeded");

  // 3. Seed Katalog Jasa Modifikasi (FR-05)
  const defaultServices = [
    { nama: "Kustom Tangki & Rangka Belakang", deskripsi: "Pembuatan tangki kustom plat galvanis dan potong subframe.", harga_dasar: 2500000 },
    { nama: "Pengecatan Total Bodi & Rangka", deskripsi: "Pengecatan oven epoxy, warna dasar, dan finishing pernis.", harga_dasar: 3200000 },
    { nama: "Porting Polish & Tune-up Mesin", deskripsi: "Pembersihan ruang bakar dan penghalusan intake-exhaust.", harga_dasar: 1500000 },
    { nama: "Instalasi Kelistrikan & Lampu LED", deskripsi: "Penyusunan ulang jalur kabel bodi tersembunyi.", harga_dasar: 750000 },
    { nama: "Pemasangan Knalpot & Penyetelan Karburator", deskripsi: "Fitting leher knalpot kustom dan setting karburator.", harga_dasar: 450000 },
  ];

  for (const s of defaultServices) {
    const existing = await prisma.jasa.findFirst({ where: { nama: s.nama } });
    if (!existing) {
      await prisma.jasa.create({ data: s });
    }
  }

  console.log("Services seeded");

  // 4. Seed Suku Cadang & Aksesori (FR-06)
  const defaultParts = [
    { SKU: "SKU-SHK-001", nama: "Shockbreaker Belakang Tabung DBS 310mm", harga_jual: 850000, stok: 5, stok_minimum: 3 },
    { SKU: "SKU-LMP-002", nama: "Headlamp Daymaker 7 Inch Spider Eye", harga_jual: 650000, stok: 2, stok_minimum: 2 },
    { SKU: "SKU-STG-003", nama: "Stang Fatbar Protaper Hitam", harga_jual: 350000, stok: 4, stok_minimum: 4 },
    { SKU: "SKU-KNL-004", nama: "Knalpot Kustom Fullsystem Stainless", harga_jual: 1200000, stok: 3, stok_minimum: 2 },
    { SKU: "SKU-BAN-005", nama: "Ban Shinko E270 Classic Depan-Belakang", harga_jual: 2400000, stok: 4, stok_minimum: 2 },
  ];

  for (const p of defaultParts) {
    await prisma.sukuCadang.upsert({
      where: { SKU: p.SKU },
      update: {},
      create: p,
    });
  }

  console.log("Spare parts seeded");

  // 5. Seed Pelanggan & Kendaraan (FR-03, FR-04)
  const pelanggan1 = await prisma.pelanggan.create({
    data: {
      nama: "Budi Santoso",
      telepon: "0812-3456-7890",
      kendaraan: {
        create: {
          merek: "Yamaha",
          model: "Scorpio 225",
          tahun: 2011,
          nomor_polisi: "B 3819 TXB",
        },
      },
    },
    include: { kendaraan: true },
  });

  const motor1 = pelanggan1.kendaraan[0];

  // 6. Seed Pesanan Aktif Simulasi
  const pesananSimulasi = await prisma.pesanan.upsert({
    where: { kode_pesanan: "PSN-9824-7123" },
    update: {},
    create: {
      kode_pesanan: "PSN-9824-7123",
      pelangganId: pelanggan1.id,
      kendaraanId: motor1.id,
      dibuat_oleh: admin.id,
      status: StatusPesanan.Dikerjakan,
      estimasi_total: 7200000,
      disetujui_pada: new Date(),
      perkiraan_selesai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      pembayaran: {
        create: [
          { jumlah: 3000000, metode: MetodePembayaran.transfer, dicatat_oleh: admin.id },
          { jumlah: 1500000, metode: MetodePembayaran.tunai, dicatat_oleh: admin.id },
        ],
      },
      tahapan: {
        create: [
          { nama: "Pemeriksaan awal", urutan: 1, wajib_foto: true, status: StatusTahap.selesai },
          { nama: "Pembongkaran", urutan: 2, wajib_foto: true, status: StatusTahap.selesai },
          { nama: "Pengecatan", urutan: 3, wajib_foto: true, status: StatusTahap.berjalan },
          { nama: "Pemasangan komponen", urutan: 4, wajib_foto: true, status: StatusTahap.belum },
          { nama: "Pengujian", urutan: 5, wajib_foto: false, status: StatusTahap.belum },
        ],
      },
    },
    include: { tahapan: true },
  });

  // Tambah pembaruan progres & foto simulasi
  const tahapPengecatan = pesananSimulasi.tahapan.find((t) => t.nama === "Pengecatan");
  if (tahapPengecatan) {
    await prisma.pembaruanProgres.create({
      data: {
        tahapPesananId: tahapPengecatan.id,
        jenis: JenisPembaruan.tahap,
        catatan: "Pengecatan epoxy primer telah selesai diaplikasikan ke rangka dan tangki kustom.",
        dibuat_oleh: montir.id,
        foto: {
          create: [
            { url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600" },
          ],
        },
      },
    });

    await prisma.pembaruanProgres.create({
      data: {
        tahapPesananId: tahapPengecatan.id,
        jenis: JenisPembaruan.informasional,
        catatan: "Menunggu suku cadang shockbreaker tabung tiba dari supplier.",
        dibuat_oleh: montir.id,
      },
    });
  }

  console.log("Complete initial seed finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

