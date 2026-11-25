import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

export const MAX_LOGIN_ATTEMPTS = 3;
export const LOGIN_LOCKOUT_SECONDS = 60;

const ATTEMPT_WINDOW_SECONDS = 15 * 60;

interface ActiveLockRow {
  remaining_seconds: number;
}

interface RateLimitStateRow {
  kunci: string;
  percobaan: number;
  is_expired_lockout: boolean;
  is_stale_window: boolean;
}

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

async function getActiveLockoutSeconds(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;

  // Hitung selisih waktu langsung di PostgreSQL agar konsisten di semua zona waktu & tahan cache Prisma HMR
  const activeLocks = await prisma.$queryRaw<ActiveLockRow[]>`
    SELECT CEIL(EXTRACT(EPOCH FROM (terkunci_hingga - NOW())))::int AS remaining_seconds
    FROM public.rate_limit_login
    WHERE kunci IN (${Prisma.join(keys)})
      AND terkunci_hingga > NOW()
  `;

  let maxSeconds = 0;
  for (const row of activeLocks) {
    const secs = Number(row.remaining_seconds);
    if (secs > maxSeconds) maxSeconds = secs;
  }

  return maxSeconds;
}

async function recordFailedLoginAttempt(keys: string[]) {
  if (keys.length === 0) {
    return {
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: MAX_LOGIN_ATTEMPTS - 1,
    };
  }

  return await prisma.$transaction(async (tx) => {
    const existingRows = await tx.$queryRaw<RateLimitStateRow[]>`
      SELECT
        kunci,
        percobaan,
        (terkunci_hingga IS NOT NULL AND terkunci_hingga <= NOW()) AS is_expired_lockout,
        (updated_at < NOW() - (${ATTEMPT_WINDOW_SECONDS}::int * INTERVAL '1 second')) AS is_stale_window
      FROM public.rate_limit_login
      WHERE kunci IN (${Prisma.join(keys)})
      FOR UPDATE
    `;
    const rowMap = new Map(existingRows.map((row) => [row.kunci, row]));

    let maxAttempts = 0;
    let locked = false;

    for (const key of keys) {
      const existing = rowMap.get(key);
      const prevAttempts =
        !existing || existing.is_expired_lockout || existing.is_stale_window
          ? 0
          : Number(existing.percobaan);
      const nextAttempts = prevAttempts + 1;
      const shouldLock = nextAttempts >= MAX_LOGIN_ATTEMPTS;

      await tx.$executeRaw`
        INSERT INTO public.rate_limit_login (kunci, percobaan, terkunci_hingga, updated_at)
        VALUES (
          ${key},
          ${nextAttempts}::int,
          CASE
            WHEN ${shouldLock}::boolean
              THEN (NOW() + (${LOGIN_LOCKOUT_SECONDS}::int * INTERVAL '1 second'))::timestamp(3)
            ELSE NULL::timestamp(3)
          END,
          NOW()::timestamp(3)
        )
        ON CONFLICT (kunci)
        DO UPDATE SET
          percobaan = EXCLUDED.percobaan,
          terkunci_hingga = EXCLUDED.terkunci_hingga,
          updated_at = EXCLUDED.updated_at
      `;

      if (nextAttempts > maxAttempts) maxAttempts = nextAttempts;
      if (shouldLock) locked = true;
    }

    if (locked) {
      return {
        locked: true,
        retryAfterSeconds: LOGIN_LOCKOUT_SECONDS,
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
  await prisma.$executeRaw`
    DELETE FROM public.rate_limit_login
    WHERE kunci IN (${Prisma.join(keys)})
  `;
}

export async function loginStaff(
  email: string,
  kataSandi: string,
  options?: { clientIp?: string }
) {
  const normalizedEmail = email.toLowerCase().trim();
  const keys = buildRateLimitKeys(normalizedEmail, options?.clientIp);

  const lockedSeconds = await getActiveLockoutSeconds(keys);
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
    const attempt = await recordFailedLoginAttempt(keys);
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
    const attempt = await recordFailedLoginAttempt(keys);
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
    const attempt = await recordFailedLoginAttempt(keys);
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
