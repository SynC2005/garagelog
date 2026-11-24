---
name: supabase-postgres-best-practices
description: "Panduan dan best practices Prisma ORM dan PostgreSQL untuk sistem GarageLog. Gunakan skill ini SEBELUM membuat atau mengubah skema Prisma (schema.prisma), menjalankan migrasi database, menulis query relasi, mengeksekusi transaksi atomik ($transaction) untuk pemotongan stok otomatis, memastikan integritas data pesanan bengkel, indexing, dan validasi tahapan wajib foto."
license: MIT
metadata:
  author: GarageLog Core Architecture
  version: "2.0.0"
  stack: "Prisma ORM (v6+) & PostgreSQL"
---

# Prisma ORM & PostgreSQL Best Practices — GarageLog

Dokumen ini adalah standar arsitektur dan panduan teknis pengelolaan database PostgreSQL menggunakan **Prisma ORM** pada sistem **GarageLog** (Sistem Point of Sale & Pelacakan Progres Bengkel Modifikasi Motor).

Seluruh agen wajib mematuhi aturan ini sebelum menulis query Prisma, merancang schema, atau melakukan migrasi data.

---

## 1. Prinsip Utama Arsitektur Database (Prisma + PostgreSQL)

1. **Prisma Client Singleton di Next.js (`src/server/db.ts`)**:
   - Selalu impor instance global `prisma` dari `@/server/db`.
   - Dilarang membuat instance `new PrismaClient()` berulang di dalam Service atau Route Handlers guna mencegah *connection exhaustion* (kehabisan pool koneksi PostgreSQL).

2. **Pemisahan Layer (Clean Architecture)**:
   - Semua query Prisma (`prisma.pesanan.findUnique`, `prisma.$transaction`, dll) **HANYA BOLEH** berada di dalam:
     ```
     src/server/services/[nama-fitur]/[nama-fitur]Service.ts
     ```
   - Dilarang melakukan query database langsung di Server Actions (`src/server/api/`) atau di React Client Component (`"use client"`).

3. **Integritas Transaksi Atomik (`prisma.$transaction`)**:
   - Operasi yang melibatkan lebih dari satu tabel yang saling bergantung (seperti persetujuan pesanan $\to$ pemotongan stok suku cadang $\to$ pencatatan `PergerakanStok`) **WAJIB** dieksekusi dalam transaksi atomik interaktif:
     ```ts
     await prisma.$transaction(async (tx) => {
       // Operasi 1: Update status pesanan ke Dikerjakan
       // Operasi 2: Kurangi stok pada SukuCadang
       // Operasi 3: Catat entri riwayat pada PergerakanStok
     });
     ```
   - Jika salah satu operasi gagal (misal stok fisik tidak mencukupi), seluruh transaksi dibatalkan (*rollback*) secara otomatis.

---

## 2. Standar Skema Prisma (`prisma/schema.prisma`)

### A. Konfigurasi Datasource & Provider
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### B. Konvensi Penamaan & Pemetaan Tabel
- **Nama Model**: PascalCase tunggal (`User`, `Pelanggan`, `Kendaraan`, `Pesanan`, `SukuCadang`).
- **Pemetaan Tabel Database**: Selalu gunakan `@@map("nama_tabel_jamak_snake_case")` agar tabel fisik di PostgreSQL konsisten menggunakan snake_case (misal `@@map("pesanan")`, `@@map("suku_cadang")`).
- **Nama Kolom / Field**: snake_case atau camelCase yang dimapping jelas ke snake_case di database.

### C. Tipe Data & Presisi PostgreSQL
- **Mata Uang & Nominal Finansial**: Wajib memakai `Decimal @db.Decimal(12, 2)` (untuk `harga`, `harga_dasar`, `harga_jual`, `estimasi_total`, dan `jumlah` pembayaran). **Dilarang memakai Float** karena rentan kesalahan pembulatan desimal.
- **Tanggal Saja**: Gunakan `@db.Date` untuk field yang hanya membutuhkan tanggal tanpa jam (misal `perkiraan_selesai`).
- **Timestamp Audit**: Wajib menyertakan `created_at DateTime @default(now())` dan `updated_at DateTime @updatedAt` pada tabel transaksi.

### D. Enums untuk State Machine
Gunakan PostgreSQL native Enum di Prisma untuk memastikan integritas transisi status:
```prisma
enum PeranUser {
  Admin
  Montir
  Pemilik
}

enum StatusPesanan {
  Menunggu_Persetujuan
  Dikerjakan
  Siap_Diambil
  Selesai
  Dibatalkan
}

enum StatusTahap {
  belum
  berjalan
  selesai
}

enum JenisPembaruan {
  tahap
  informasional
}

enum JenisPergerakanStok {
  masuk
  keluar
  koreksi
}

enum MetodePembayaran {
  tunai
  transfer
  QRIS
}
```

---

## 3. Aturan Transaksi Kritis Bengkel (Wajib Diterapkan)

### A. Pengurangan Stok Otomatis (FR-13)
Ketika status pesanan beralih ke `Dikerjakan`, sistem harus memotong stok suku cadang yang terdaftar dalam `ItemSukuCadang`:
```ts
export async function approveAndStartOrder(pesananId: number, userId: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Ambil pesanan beserta rincian item suku cadang
    const order = await tx.pesanan.findUnique({
      where: { id: pesananId },
      include: { itemSukuCadang: { include: { sukuCadang: true } } },
    });

    if (!order) throw new Error("Pesanan tidak ditemukan");
    if (order.status === "Dikerjakan") throw new Error("Pesanan sudah dikerjakan");

    // 2. Validasi stok sebelum dipotong
    for (const item of order.itemSukuCadang) {
      if (item.sukuCadang.stok < item.jumlah) {
        throw new Error(`Stok ${item.sukuCadang.nama} tidak mencukupi (sisa ${item.sukuCadang.stok}, dibutuhkan ${item.jumlah})`);
      }
    }

    // 3. Potong stok dan catat PergerakanStok
    for (const item of order.itemSukuCadang) {
      await tx.sukuCadang.update({
        where: { id: item.sukuCadangId },
        data: { stok: { decrement: item.jumlah } },
      });

      await tx.pergerakanStok.create({
        data: {
          sukuCadangId: item.sukuCadangId,
          jenis: "keluar",
          jumlah: item.jumlah,
          alasan: `Pengurangan otomatis untuk pesanan ${order.kode_pesanan}`,
        },
      });
    }

    // 4. Update status pesanan
    return await tx.pesanan.update({
      where: { id: pesananId },
      data: {
        status: "Dikerjakan",
        disetujui_pada: new Date(),
      },
    });
  });
}
```

### B. Validasi Keras Wajib Foto (FR-18)
Sistem menolak penyelesaian tahapan pengerjaan jika `wajib_foto === true` dan belum ada record `FotoProgres`:
```ts
export async function completeOrderStage(tahapPesananId: number) {
  const stage = await prisma.tahapPesanan.findUnique({
    where: { id: tahapPesananId },
    include: {
      pembaruan: {
        include: { foto: true },
      },
    },
  });

  if (!stage) throw new Error("Tahap pesanan tidak ditemukan");

  if (stage.wajib_foto) {
    const totalPhotos = stage.pembaruan.reduce(
      (count, p) => count + p.foto.length,
      0
    );
    if (totalPhotos === 0) {
      throw new Error("Tahap ini wajib melampirkan minimal 1 dokumentasi foto sebelum ditandai selesai.");
    }
  }

  return await prisma.tahapPesanan.update({
    where: { id: tahapPesananId },
    data: { status: "selesai" },
  });
}
```

### C. Audit Trail Abadi (Append-Only) (FR-20 & FR-14)
- Tabel `PembaruanProgres` dan `PergerakanStok` adalah catatan historis abadi (*audit log*).
- **DILARANG** menyediakan method atau fungsi `delete` atau `update` untuk record pada tabel ini. Setiap revisi atau koreksi harus dicatat sebagai entri baru bertipe `koreksi` dengan alasan tertulis.

---

## 4. Query Performance & Indexing PostgreSQL

1. **Foreign Key Indexes**:
   Pastikan setiap foreign key memiliki index di PostgreSQL untuk mempercepat operasi `JOIN`, misalnya:
   - `pesanan(pelangganId)`
   - `pesanan(kendaraanId)`
   - `tahap_pesanan(pesananId)`
   - `item_suku_cadang(sukuCadangId)`
2. **Constraint Unik**:
   Kolom `kode_pesanan` pada `Pesanan`, `SKU` pada `SukuCadang`, dan `email` pada `User` wajib berstatus `@unique`.
3. **Mencegah Masalah N+1**:
   Gunakan fitur `include` atau `select` dari Prisma ORM untuk mengambil relasi terkait dalam single query yang dioptimalkan, hindari perulangan query di dalam `Array.map`.

---

## 5. Penanganan Error Prisma

Selalu bungkus query Prisma dengan try-catch di layer Service dan tangkap `PrismaClientKnownRequestError`:
```ts
import { Prisma } from "@prisma/client";

try {
  // Query Prisma
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new Error(`Data duplikat pada field: ${error.meta?.target}`);
    }
    if (error.code === "P2025") {
      throw new Error("Data yang dicari tidak ditemukan.");
    }
  }
  throw error;
}
```

---

## 6. Checklist Eksekusi Perubahan Database

- [ ] Skema terdefinisi di `prisma/schema.prisma` mencakup ke-14 entitas.
- [ ] Tipe mata uang menggunakan `Decimal @db.Decimal(12, 2)`.
- [ ] Mutasi stok otomatis selalu menggunakan `prisma.$transaction`.
- [ ] Tahap wajib foto divalidasi ketat sebelum status berubah ke `selesai`.
- [ ] Riwayat progres dan mutasi stok berprinsip *append-only*.
- [ ] Menjalankan `npx prisma generate` setiap kali skema berubah.
- [ ] Menjalankan `npx prisma db push` atau migrasi untuk sinkronisasi ke PostgreSQL.
- [ ] Menjalankan `graphify update .` setelah penulisan kode selesai.
