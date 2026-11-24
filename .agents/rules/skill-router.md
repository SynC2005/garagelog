---
trigger: always_on
description: Protokol wajib pemilihan dan aktivasi skills otomatis pada setiap prompt pengguna untuk proyek GarageLog (Website POS & Pelacakan Bengkel Modifikasi Motor).
---

# Skill Routing & Auto-Activation Protocol — GarageLog

Setiap kali menerima prompt atau instruksi dari pengguna, sebelum mengeksekusi penulisan kode (`write_file`, `edit_file`) atau memberikan jawaban teknis, agen **WAJIB** melakukan evaluasi kebutuhan skill dan memuat petunjuknya.

## 1. Langkah Wajib Sebelum Bertindak (Mandatory Step 0)

1. **Analisa Kategori Tugas**: Identifikasi domain tugas pengguna (UI/UX antarmuka bengkel/pelanggan, database Prisma & PostgreSQL, alur pengerjaan montir, POS & nota, refactoring, perbaikan bug, copywriting operasional bengkel, dsb.).
2. **Pilih Skill yang Relevan**: Cocokkan dengan daftar skill yang terpasang di project (`.agents/skills/`).
3. **Baca SKILL.md**: Jika ada skill yang relevan, agen **WAJIB memanggil tool `read_file`** untuk membaca file `SKILL.md` terkait sebelum mulai menulis kode atau memodifikasi file.
4. **Konfirmasi Penggunaan**: Beri tahu pengguna secara singkat skill apa yang diaktifkan (misal: *"Mengaktifkan panduan skill `anti-ai-slop`, `better-colors`, & `ponytail`"*).

---

## 2. Matriks Pemetaan Tugas ke Skill

| Kategori Tugas | Skill yang Wajib Diaktifkan | Aksi yang Dijalankan |
| :--- | :--- | :--- |
| **Desain / Pembuatan / Modifikasi UI** | `anti-ai-slop`<br>`component-reference-design`<br>`ui-ux-pro-max` | Cegah UI AI slop (larang gradient ungu generik, pill button berlebih, layout 3-card monoton). Bangun antarmuka dashboard bengkel yang modern, industrial, fungsional, dan linimasa pelacakan pelanggan yang bersih serta responsif. |
| **Warna, Kontras, Dark/Light Mode** | `better-colors` | Cek kontras WCAG 2.2, semantic tokens, pastikan mode terang (bersih, profesional) dan mode gelap (industrial dark theme berstandar bengkel modern) memiliki kontras tajam dan presisi. |
| **Tata Letak, Grid, & Responsif** | `better-layout` | Atur spacing, grid, split-pane pesanan & riwayat progres, responsif mobile untuk halaman pelacakan pelanggan (`/lacak`) & desktop untuk admin/montir. |
| **Tipografi, Font, & Hirarki Teks** | `better-typography` | Type scale yang jelas, keterbacaan kode acak pesanan (`PSN-XXXX-XXXX`), format nota/invoice cetak, status badge, dan hierarki timeline. |
| **Copywriting, Label, Pesan Error, CTA** | `better-writing` | Bahasa Indonesia lugas, transparan, dan profesional sesuai operasional bengkel modifikasi motor (misal: *Menunggu Persetujuan*, *Dikerjakan*, *Pemeriksaan Awal*, *Pembongkaran*, *Pengecatan*, *Siap Diambil*, *Selesai*). |
| **Aksesibilitas & Keyboard Navigation** | `better-accessibility` | ARIA roles, focus ring, contrast ratio, tab navigation pada form input transaksi cepat kasir dan dialog montir. |
| **Review / Polish Tampilan UI** | `better-interface`<br>`better-ui`<br>`interface-review` | Audit menyeluruh komponen, optical alignment, drag-and-drop foto pengerjaan, stepper tahapan, transisi halus, badge status pembayaran. |
| **Penulisan Kode, Bugfix, & Fitur Baru** | `ponytail` | Prinsip *lazy senior dev*: pilih solusi terkecil yang menyelesaikan masalah secara tuntas tanpa over-engineering atau kode berlebih. |
| **Review & Audit Kualitas Kode** | `ponytail-review`<br>`ponytail-audit` | Evaluasi keamanan, performa under-load, integritas audit trail riwayat pengerjaan, dan penghapusan bloatware. |
| **Arsitektur & Navigasi Hubungan File** | `graphify` | Gunakan `graphify query` atau knowledge graph di `graphify-out/` untuk memahami keterkaitan antar modul. **Wajib auto-update:** jalankan `graphify update .` setiap selesai mengubah file kode. |
| **State Kompleks / Alur Multi-Step** | `state-machine` | Buat transisi status pesanan (*Menunggu Persetujuan* $\to$ *Dikerjakan* $\to$ *Siap Diambil* $\to$ *Selesai*), siklus tahapan pengerjaan montir, dan status pembayaran bertahap (*Belum Bayar*, *Sebagian*, *Lunas*). |
| **Database, Relasi & Integritas Data** | `supabase-postgres-best-practices` | Best practices PostgreSQL & Prisma: index foreign keys, constraint unik kode pesanan, transaksi atomik untuk pengurangan stok dan pesanan (`prisma.$transaction`). |

---

## 3. Aturan Eksekusi

- Jika tugas mencakup lebih dari satu domain (misal: membuat fitur pelacakan publik baru), kombinasikan skill yang relevan (misal `anti-ai-slop` + `better-layout` + `ponytail` + `state-machine`).
- Dilarang mengabaikan instruksi di dalam `SKILL.md` yang telah dibaca.
- Jika pengguna meminta perbaikan cepat atau refactoring, utamakan filosofi `ponytail` (perubahan terkecil yang tuntas dan aman).

