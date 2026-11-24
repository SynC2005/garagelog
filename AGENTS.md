# AGENTS.md — GarageLog (Sistem POS & Pelacakan Progres Bengkel Modifikasi Motor)

Dokumen ini adalah panduan teknis, arsitektur, dan aturan wajib bagi seluruh agen kecerdasan buatan dalam merancang dan mengembangkan sistem **GarageLog** berdasarkan 5 dokumen landasan:
- [PRD_Website_POS_Bengkel_Modifikasi_Motor.docx](file:///c:/project%20pemrograman%20lanjutan/PRD_Website_POS_Bengkel_Modifikasi_Motor.docx)
- [DFD_Level_0&1_GarageLog.pdf](file:///c:/project%20pemrograman%20lanjutan/DFD_Level_0&1_GarageLog.pdf)
- [ERD_GarageLog.pdf](file:///c:/project%20pemrograman%20lanjutan/ERD_GarageLog.pdf)
- [FaridYusronSyabani-101032300192.pdf](file:///c:/project%20pemrograman%20lanjutan/FaridYusronSyabani-101032300192.pdf)
- [Wireframe_GarageLog.pdf](file:///c:/project%20pemrograman%20lanjutan/Wireframe_GarageLog.pdf)

---

## 1. Pemilihan & Penggunaan Skills Otomatis (Skill Routing)

Sebelum mulai menulis kode, memodifikasi file, atau menjawab instruksi teknis, agen **WAJIB** mengecek daftar skill yang terpasang di `.agents/skills/` dan aturan di `.agents/rules/skill-router.md`:
- **UI / Frontend / Styling**: Wajib mengaktifkan `anti-ai-slop`, `ui-ux-pro-max`, `component-reference-design`, dan rangkaian `better-*` (`better-colors`, `better-typography`, `better-layout`, `better-ui`, `better-writing`, `better-accessibility`).
- **Desain & Tema**: Antarmuka bengkel modifikasi motor bertema modern, industrial, fungsional, dan maskulin elegan dengan dukungan penuh **Dark Mode & Light Mode**. Dilarang tampilan generic AI slop (gradient ungu standar, button pill berlebihan, monoton 3-card).
- **Penulisan Kode & Bug Fix**: Wajib menerapkan prinsip `ponytail` (perubahan terkecil yang menyelesaikan masalah secara tuntas tanpa bloatware/over-engineering).
- **Integritas Database**: Terapkan panduan `supabase-postgres-best-practices` untuk transaksi PostgreSQL, indexing, dan konsistensi data.
- **Arsitektur & Navigasi**: Wajib memeriksa knowledge graph `graphify` di `graphify-out/`. **WAJIB AUTO-UPDATE**: Setiap kali selesai melakukan penulisan, modifikasi, atau penghapusan file kode, agen **WAJIB LANGSUNG** menjalankan perintah `graphify update .` di terminal agar visualisasi dan knowledge graph selalu up-to-date.
- Agen **WAJIB** membaca file `SKILL.md` skill terkait dengan `read_file` sebelum mengeksekusi instruksi.

---

## 2. Struktur Project (Clean Architecture — Next.js App Router)

Project ini menggunakan Next.js App Router dengan **pola pemisahan Frontend dan Backend (Clean Architecture)**.
WAJIB diikuti untuk setiap halaman/fitur baru:

### A. Frontend (UI Layer)
Lokasi: `src/app/(routes)/[nama-fitur]/` atau `src/app/[nama-fitur]/`
- `page.tsx` — Server Component. Tugasnya HANYA mengambil data awal (*initial data*) via Server Action / Controller dari `src/server/api/` lalu melemparnya sebagai props ke Wrapper. Dilarang menaruh state (`useState`), event handler, atau JSX interaktif di sini.
- `[NamaFitur]Wrapper.tsx` — Client Component (`"use client"`). Berisi semua state interaktif, form input, handler, modal, dan antarmuka dinamis halaman tersebut.
- `src/components/ui/` — HANYA untuk komponen generik yang dipakai lintas halaman (Card, Button, Input, Modal, Table, Badge, Stepper/Timeline, ImageDropzone, dsb). Komponen spesifik fitur tetap berada di dalam Wrapper atau subfolder fitur terkait.

**Lokasi Wajib untuk Komponen Generik:**
Semua komponen generik/reusable WAJIB dibuat/disimpan di:
```
src/components/ui/
```
- **Sebelum membuat komponen baru, cek folder ini** — jika sudah ada komponen dengan fungsi serupa, GUNAKAN/import komponen tersebut, jangan buat duplikat.
- Pastikan setiap komponen di `src/components/ui/` mendukung **Light Mode dan Dark Mode** secara terpadu (*single source of truth*).

### B. Backend (Logic & Database Layer)
Lokasi: `src/server/`
- `src/server/api/[nama-fitur]/[nama-fitur]Api.ts` — Server Actions (`"use server"`).
  Bertugas sebagai controller / API endpoint jembatan antara Frontend dan Backend. **JANGAN taruh logika bisnis panjang atau query database mentah di sini.** File ini hanya memvalidasi input sederhana (via Zod), memanggil fungsi dari `src/server/services/`, mengembalikan respon konsisten (`ApiResponse<T>`), dan men-trigger `revalidatePath` bila diperlukan.
- `src/server/services/[nama-fitur]/[nama-fitur]Service.ts` — Core Business Logic (Service Murni).
  Di sinilah letak **Backend Murni**. Semua query Prisma ORM, manipulasi data, transaksi stok atomik, perhitungan estimasi biaya, dan validasi aturan bisnis ditaruh di sini. File ini TIDAK menggunakan `"use server"` agar tetap murni fungsi TypeScript yang testable.

---

## 3. Database & ORM (Prisma & PostgreSQL)

- **Platform**: PostgreSQL dengan Prisma ORM (`prisma/schema.prisma`).
- **14 Entitas Database Sesuai ERD & PRD**:
  1. `User` (id, nama, email, kata_sandi_hash, peran [`Admin`, `Montir`, `Pemilik`], aktif)
  2. `Pelanggan` (id, nama, telepon)
  3. `Kendaraan` (id, pelangganId, merek, model, tahun, nomor_polisi)
  4. `Jasa` (id, nama, deskripsi, harga_dasar)
  5. `ItemJasa` (id, pesananId, jasaId, harga, catatan)
  6. `SukuCadang` (id, nama, SKU, harga_jual, stok, stok_minimum)
  7. `PergerakanStok` (id, sukuCadangId, jenis [`masuk`, `keluar`, `koreksi`], jumlah, alasan, waktu)
  8. `ItemSukuCadang` (id, pesananId, sukuCadangId, jumlah, harga)
  9. `Pesanan` (id, kode_pesanan [unik], pelangganId, kendaraanId, status [`Menunggu Persetujuan`, `Dikerjakan`, `Siap Diambil`, `Selesai`, `Dibatalkan`], estimasi_total, disetujui_pada, perkiraan_selesai, dibuat_oleh)
  10. `TemplateTahap` (id, nama, urutan, wajib_foto)
  11. `TahapPesanan` (id, pesananId, nama, urutan, wajib_foto, status [`belum`, `berjalan`, `selesai`])
  12. `PembaruanProgres` (id, tahapPesananId, jenis [`tahap`, `informasional`], catatan, dibuat_oleh, waktu) — *Append-only*
  13. `FotoProgres` (id, pembaruanId, url)
  14. `Pembayaran` (id, pesananId, jumlah, metode [`tunai`, `transfer`, `QRIS`], tanggal, dicatat_oleh)

### Aturan Transaksi & Integritas Data (Wajib):
1. **Pengurangan Stok Otomatis (FR-13)**:
   Saat status pesanan disetujui atau berpindah ke `Dikerjakan`, sistem **WAJIB** mengeksekusi `prisma.$transaction` untuk memotong stok `SukuCadang` dan mencatat entri `PergerakanStok` bertipe `keluar` dengan referensi nomor pesanan.
2. **Koreksi Stok (FR-14)**:
   Setiap barang masuk atau koreksi stok manual wajib mencantumkan alasan tertulis dan dicatat di `PergerakanStok`.
3. **Pemberitahuan Stok Minimum (FR-15)**:
   Sistem harus memicu peringatan jika `stok <= stok_minimum`.

---

## 4. Logika Bisnis & Validasi Kritis Proyek

### A. Alur Progres & Validasi Wajib Foto (FR-16 s/d FR-21)
- Setiap pesanan memiliki tahapan yang di-generate dari `TemplateTahap` (default: Pemeriksaan awal, Pembongkaran, Pengerjaan bodi, Pengecatan, Pemasangan komponen, Pengujian, Siap diambil).
- **Validasi Keras Wajib Foto (FR-18)**: Jika `TahapPesanan.wajib_foto === true`, sistem **DILARANG** menandai tahap tersebut `selesai` jika belum ada minimal 1 record `FotoProgres` yang terunggah.
- **Pembaruan Informasional (FR-19)**: Montir/Admin dapat menambahkan pembaruan status tanpa foto (jenis: `informasional`, misal *"Menunggu kedatangan shockbreaker DBS"*) agar pelanggan melihat progres tetap aktif.
- **Audit Trail Abadi (FR-20)**: Seluruh riwayat di `PembaruanProgres` bersifat *append-only*; tidak dapat diubah atau dihapus oleh siapapun.
- **Batasan Foto (FR-21)**: Validasi tipe file (`image/jpeg`, `image/png`, `image/webp`) dan ukuran maksimum 5 MB per foto.

### B. Keamanan & Privasi Halaman Pelacakan Publik (FR-22 s/d FR-26)
- Pelanggan mengakses halaman tracking (`/lacak` atau `/lacak/[kode]`) murni dengan memasukkan `kode_pesanan` unik dan acak (contoh: `PSN-9824-7123`). Pelanggan **TIDAK PERLU LOGIN**.
- **Privasi Data**: Halaman publik **DILARANG KERAS** menampilkan nomor telepon pelanggan, alamat lengkap pelanggan, atau rincian nominal pembayaran (hanya menampilkan status ringkas: *Belum Bayar*, *Sebagian*, atau *Lunas*).
- **Proteksi Brute-Force (FR-25)**: Terapkan *rate limiting* pada endpoint pencarian kode pesanan untuk mencegah *guessing attack*.

### C. Pembayaran Bertahap & Cetak Nota (FR-27 s/d FR-29)
- Pembayaran dicatat manual (tunai, transfer bank, QRIS) tanpa payment gateway otomatis.
- Mendukung pembayaran bertahap (Down Payment / Uang Muka lalu Pelunasan).
- Status pembayaran otomatis dihitung:
  - Total Bayar $= 0 \implies$ `Belum Bayar`
  - $0 < \text{Total Bayar} < \text{Total Estimasi} \implies$ `Sebagian`
  - Total Bayar $\ge \text{Total Estimasi} \implies$ `Lunas`
- Halaman/fitur nota siap cetak (HTML-to-Print / PDF) memuat detail lengkap pesanan, rincian jasa, suku cadang, riwayat pembayaran, sisa tagihan, dan petunjuk pelacakan.

---

## 5. Tema — Dark & Light Mode (WAJIB, TIDAK BOLEH DITUNDA)

**Setiap halaman dan komponen baru WAJIB langsung ditulis untuk KEDUA mode sekaligus — light mode DAN dark mode — sejak awal dibuat.**
- **Dark Mode**: Nuansa bengkel modern (industrial dark: `bg-zinc-950` / `bg-slate-900`, kartu `bg-zinc-900` / `bg-slate-800`, border `border-zinc-800` / `border-slate-700`, aksen oranye/amber/cyan bengkel tajam).
- **Light Mode**: Bersih, profesional, kontras tinggi (`bg-slate-50`, kartu `bg-white`, teks `text-slate-900`).
- **DILARANG memakai teks abu-abu ambigu tanpa kontras pasti (`text-gray-400` pada background putih)**. Pastikan lolos rasio kontras WCAG 2.2 AA.
- Cek kedua mode secara langsung pada: stepper tahapan pengerjaan, kartu linimasa foto progres, badge status pembayaran, nota invoice, dan tabel stok.

---

## 6. Testing & Script Percobaan

Urutan prioritas uji coba fitur:
1. **Prioritas Utama — Dev Server (`http://localhost:3000`)**: Test API / Server Action via browser atau terminal `curl`.
2. **Alternatif — Terminal Langsung**: Uji coba fungsi murni di `src/server/services/` via `npx tsx -e "..."`.
3. **Script Khusus**: Jika perlu seed data simulasi (pelanggan, pesanan modifikasi multi-tahap, simulasi pergerakan stok), buat script di folder:
```
scripts/
```
- Script di `scripts/` bersifat *standalone* (tidak boleh di-import oleh kode aplikasi utama di `src/`).
- Sebelum fitur dianggap selesai, WAJIB jalankan `npm run build` atau `npx tsc --noEmit` untuk memastikan tidak ada kesalahan TypeScript.
- **Auto-Update Knowledge Graph**: Setiap selesai melakukan perubahan kode, WAJIB LANGSUNG jalankan `graphify update .` di terminal.

---

## 7. Konvensi Kode

- TypeScript strict mode, **DILARANG memakai tipe `any`**. Gunakan interface atau type eksplisit (misal dari Prisma Client atau file type khusus).
- Naming Conventions:
  - camelCase untuk variabel & fungsi (`createOrder`, `calculateRemainingBalance`).
  - PascalCase untuk React Components & Interfaces/Types (`OrderCard`, `StageTimeline`, `UpdateProgressModal`).
  - snake_case untuk kolom database PostgreSQL / schema Prisma (`kode_pesanan`, `wajib_foto`, `estimasi_total`).
- Format Angka & Mata Uang Rupiah:
  - Gunakan format standar Indonesia (contoh: `Rp 1.250.000`).
  - Gunakan helper terpusat: `src/utils/formatCurrency.ts`.
- Format Tanggal & Waktu:
  - Gunakan timezone Asia/Jakarta (WIB) dan format bahasa Indonesia (contoh: `16 November 2026, 14:30 WIB`).
  - Gunakan helper terpusat: `src/utils/formatDate.ts`.
- Response Format Server Action Konsisten:
  ```ts
  export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
  };
  ```

---

## 8. Hak Akses & Peran (Role-Based Access Control)

| Fitur / Halaman | Admin / Kasir | Montir | Pemilik Usaha | Pelanggan Publik |
| :--- | :---: | :---: | :---: | :---: |
| Data Master (Pelanggan, Kendaraan, Jasa) | Full CRUD | - | View Only | - |
| Kelola Stok & Koreksi | Full CRUD | - | View Only | - |
| Buat & Ubah Pesanan / Estimasi | Full Access | View Only | View Only | - |
| Update Tahap Pengerjaan & Upload Foto | Full Access | Full Access | - | - |
| Catat Pembayaran & Cetak Nota | Full Access | - | View Only | - |
| Dashboard & Laporan Analitik | Full Access | - | Full Access | - |
| Pengaturan Akun Staf & Template Tahap | Full Access | - | - | - |
| Lacak Status Progres Publik (`/lacak`) | - | - | - | Full Access (via kode) |

Validasi otorisasi peran **WAJIB dicek di sisi server** (`src/server/services/`), bukan sekadar menyembunyikan tombol di antarmuka klien.

