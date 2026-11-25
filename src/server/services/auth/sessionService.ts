import crypto from "crypto";
import { cookies } from "next/headers";
import { PeranUser } from "@prisma/client";

export const SESSION_COOKIE_NAME = "garagelog_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari

export interface SessionPayload {
  id: number;
  nama: string;
  email: string;
  peran: PeranUser;
  exp: number;
}

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || "garagelog-dev-session-secret-key-2026";
}

function signPayload(encodedPayload: string): string {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createSessionToken(user: {
  id: number;
  nama: string;
  email: string;
  peran: PeranUser;
}): string {
  const payload: SessionPayload = {
    id: user.id,
    nama: user.nama,
    email: user.email,
    peran: user.peran,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const sig = signPayload(encoded);
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expectedSig = signPayload(encoded);
    const sigBuf = Buffer.from(sig, "utf8");
    const expectedBuf = Buffer.from(expectedSig, "utf8");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const decoded = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;

    if (!decoded || typeof decoded.id !== "number" || !decoded.exp) {
      return null;
    }
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: {
  id: number;
  nama: string;
  email: string;
  peran: PeranUser;
}) {
  const token = createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

