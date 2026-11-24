---
name: supabase
description: "Panduan database PostgreSQL dan Prisma ORM untuk GarageLog. Mengatur koneksi PostgreSQL, Prisma Client, sinkronisasi skema, dan pengelolaan transaksi basis data."
metadata:
  author: GarageLog Team
  version: "2.0.0"
---

# Database & ORM Guide — GarageLog

Project ini menggunakan **Prisma ORM** dengan database relasional **PostgreSQL** (dapat di-host secara lokal atau cloud PostgreSQL).

## Panduan Utama:
1. **Prisma ORM**: Rujukan utama skema, query, dan transaksi atomik terdapat di [supabase-postgres-best-practices/SKILL.md](../supabase-postgres-best-practices/SKILL.md).
2. **Koneksi Database**: Menggunakan variabel lingkungan `DATABASE_URL` dan `DIRECT_URL` di file `.env`.
3. **Instance Prisma Client**: Terpusat di `src/server/db.ts`. Seluruh query dieksekusi di `src/server/services/`.
4. **Sinkronisasi Skema**:
   - `npx prisma generate` untuk memperbarui Prisma Client.
   - `npx prisma db push` untuk menerapkan perubahan skema ke PostgreSQL.
