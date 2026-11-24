import { Prisma } from "@prisma/client";

/**
 * Konversi rekursif seluruh instance Prisma.Decimal menjadi number murni
 * agar dapat diserialisasi dengan aman oleh Next.js React Server Components (RSC).
 * Tetap mempertahankan objek Date, Array, boolean, string, dan number.
 */
export function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Cek apakah merupakan Prisma Decimal (atau objek decimal yang memiliki struktur s, e, d)
  if (
    obj instanceof Prisma.Decimal ||
    (typeof obj === "object" && "s" in obj && "e" in obj && "d" in obj)
  ) {
    return Number(obj) as unknown as T;
  }

  // Pertahankan Date agar tidak berubah menjadi string
  if (obj instanceof Date) {
    return obj;
  }

  // Jika array, petakan setiap elemen secara rekursif
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeDecimals(item)) as unknown as T;
  }

  // Jika plain object, petakan setiap kuncinya
  if (typeof obj === "object" && (obj.constructor === Object || !obj.constructor)) {
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      result[key] = serializeDecimals((obj as Record<string, any>)[key]);
    }
    return result as T;
  }

  return obj;
}

