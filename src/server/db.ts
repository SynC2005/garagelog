import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

const existingPrisma = globalForPrisma.prisma;
const isStaleDevClient =
  process.env.NODE_ENV !== "production" &&
  existingPrisma !== undefined &&
  (!("hakAksesPeran" in existingPrisma) || !("rateLimitLogin" in existingPrisma));

export const prisma =
  !existingPrisma || isStaleDevClient ? createPrismaClient() : existingPrisma;

// Selalu cache instance prisma agar tidak leak koneksi saat HMR dev maupun di serverless container
globalForPrisma.prisma = prisma;
