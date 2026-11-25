import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";

export const MAX_LOGIN_ATTEMPTS = 3;
export const LOGIN_LOCKOUT_SECONDS = 60;

const LOGIN_LOCKOUT_MS = LOGIN_LOCKOUT_SECONDS * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export class LoginAuthError extends Error {
  retryAfterSeconds?: number;
  remainingAttempts?: number;

  constructor(
    message: string,
    options?: { retryAfterSeconds?: number; remainingAttempts?: number }
  ) {
    super(message);
    this.name = "LoginAuthError";
    this.retryAfterSeconds = options?.retryAfterSeconds;
    this.remainingAttempts = options?.remainingAttempts;
  }
}

function buildRateLimitKeys(normalizedEmail: string, clientIp?: string): string[] {
  const keys: string[] = [];
  if (normalizedEmail) {
    keys.push(`email:${normalizedEmail}`);
  }
  if (clientIp && clientIp.trim().length > 0) {
    keys.push(`ip:${clientIp.trim()}`);
  }
  return keys;
}

async function getActiveLockoutSeconds(
  keys: string[],
  now: Date
): Promise<number> {
  if (keys.length === 0) return 0;

  const activeLocks = await prisma.rateLimitLogin.findMany({
    where: {
      kunci: { in: keys },
      terkunci_hingga: { gt: now },
    },
    select: { terkunci_hingga: true },
  });

  let maxLockedUntil: Date | null = null;
  for (const row of activeLocks) {
    if (
      row.terkunci_hingga &&
      (!maxLockedUntil || row.terkunci_hingga > maxLockedUntil)
    ) {
      maxLockedUntil = row.terkunci_hingga;
    }
  }

  if (!maxLockedUntil) return 0;
  return Math.max(
    1,
    Math.ceil((maxLockedUntil.getTime() - now.getTime()) / 1000)
  );
}

async function recordFailedLoginAttempt(keys: string[], now: Date) {
  if (keys.length === 0) {
    return {
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: MAX_LOGIN_ATTEMPTS - 1,
    };
  }

  return await prisma.$transaction(async (tx) => {
    const existingRows = await tx.rateLimitLogin.findMany({
      where: { kunci: { in: keys } },
    });
    const rowMap = new Map(existingRows.map((row) => [row.kunci, row]));

    let maxAttempts = 0;
    let maxLockedUntil: Date | null = null;

    for (const key of keys) {
      const existing = rowMap.get(key);
      const isExpiredLockout =
        existing?.terkunci_hingga !== null &&
        existing?.terkunci_hingga !== undefined &&
        existing.terkunci_hingga <= now;
      const isStaleWindow =
        existing !== undefined &&
        now.getTime() - existing.updated_at.getTime() > ATTEMPT_WINDOW_MS;

      const prevAttempts =
        !existing || isExpiredLockout || isStaleWindow ? 0 : existing.percobaan;
      const nextAttempts = prevAttempts + 1;
      const lockedUntil =
        nextAttempts >= MAX_LOGIN_ATTEMPTS
          ? new Date(now.getTime() + LOGIN_LOCKOUT_MS)
          : null;

      await tx.rateLimitLogin.upsert({
        where: { kunci: key },
        create: {
          kunci: key,
          percobaan: nextAttempts,
          terkunci_hingga: lockedUntil,
        },
        update: {
          percobaan: nextAttempts,
          terkunci_hingga: lockedUntil,
        },
      });

      if (nextAttempts > maxAttempts) maxAttempts = nextAttempts;
      if (lockedUntil && (!maxLockedUntil || lockedUntil > maxLockedUntil)) {
        maxLockedUntil = lockedUntil;
      }
    }

    if (maxLockedUntil) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((maxLockedUntil.getTime() - now.getTime()) / 1000)
      );
      return {
        locked: true,
        retryAfterSeconds,
        remainingAttempts: 0,
      };
    }

    return {
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - maxAttempts),
    };
  });
}

async function clearLoginRateLimit(keys: string[]) {
  if (keys.length === 0) return;
  await prisma.rateLimitLogin.deleteMany({
    where: { kunci: { in: keys } },
  });
}

export async function loginStaff(
  email: string,
  kataSandi: string,
  options?: { clientIp?: string }
) {
  const normalizedEmail = email.toLowerCase().trim();
  const keys = buildRateLimitKeys(normalizedEmail, options?.clientIp);
  const now = new Date();

  const lockedSeconds = await getActiveLockoutSeconds(keys, now);
  if (lockedSeconds > 0) {
    throw new LoginAuthError(
      `Terlalu banyak percobaan masuk yang gagal. Silakan tunggu ${lockedSeconds} detik sebelum mencoba lagi.`,
      { retryAfterSeconds: lockedSeconds, remainingAttempts: 0 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    const attempt = await recordFailedLoginAttempt(keys, now);
    if (attempt.locked) {
      throw new LoginAuthError(
        `Terlalu banyak percobaan masuk yang gagal (${MAX_LOGIN_ATTEMPTS}x). Silakan tunggu ${attempt.retryAfterSeconds} detik sebelum mencoba lagi.`,
        {
          retryAfterSeconds: attempt.retryAfterSeconds,
          remainingAttempts: 0,
        }
      );
    }
    throw new LoginAuthError(
      `Email atau kata sandi tidak sesuai. Sisa percobaan: ${attempt.remainingAttempts} kali lagi.`,
      { remainingAttempts: attempt.remainingAttempts }
    );
  }

  if (!user.aktif) {
    const attempt = await recordFailedLoginAttempt(keys, now);
    if (attempt.locked) {
      throw new LoginAuthError(
        `Terlalu banyak percobaan masuk yang gagal (${MAX_LOGIN_ATTEMPTS}x). Silakan tunggu ${attempt.retryAfterSeconds} detik sebelum mencoba lagi.`,
        {
          retryAfterSeconds: attempt.retryAfterSeconds,
          remainingAttempts: 0,
        }
      );
    }
    throw new LoginAuthError(
      "Akun ini telah dinonaktifkan. Hubungi administrator.",
      { remainingAttempts: attempt.remainingAttempts }
    );
  }

  const isMatch = await bcrypt.compare(kataSandi, user.kata_sandi_hash);
  if (!isMatch) {
    const attempt = await recordFailedLoginAttempt(keys, now);
    if (attempt.locked) {
      throw new LoginAuthError(
        `Terlalu banyak percobaan masuk yang gagal (${MAX_LOGIN_ATTEMPTS}x). Silakan tunggu ${attempt.retryAfterSeconds} detik sebelum mencoba lagi.`,
        {
          retryAfterSeconds: attempt.retryAfterSeconds,
          remainingAttempts: 0,
        }
      );
    }
    throw new LoginAuthError(
      `Email atau kata sandi tidak sesuai. Sisa percobaan: ${attempt.remainingAttempts} kali lagi.`,
      { remainingAttempts: attempt.remainingAttempts }
    );
  }

  await clearLoginRateLimit(keys);

  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    peran: user.peran,
  };
}
