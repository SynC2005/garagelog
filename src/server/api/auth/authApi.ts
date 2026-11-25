"use server";

import { headers } from "next/headers";
import type { PeranUser } from "@prisma/client";
import {
  LoginAuthError,
  loginStaff,
} from "@/server/services/auth/authService";
import {
  clearSessionCookie,
  setSessionCookie,
} from "@/server/services/auth/sessionService";
import {
  buildAllowedFeaturesMap,
  getPermissionsForRole,
} from "@/server/services/auth/rbacService";
import { getDefaultRouteForPermissions } from "@/lib/rbac";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  retryAfterSeconds?: number;
  remainingAttempts?: number;
};

export interface LoginStaffResponseData {
  id: number;
  nama: string;
  email: string;
  peran: PeranUser;
  defaultRoute: string;
}

async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return hdrs.get("x-real-ip")?.trim() || "local";
}

export async function loginStaffAction(formData: {
  email: string;
  kataSandi: string;
}): Promise<ApiResponse<LoginStaffResponseData>> {
  try {
    const clientIp = await getClientIp();
    const user = await loginStaff(formData.email, formData.kataSandi, {
      clientIp,
    });
    await setSessionCookie(user);

    const permissions = await getPermissionsForRole(user.peran);
    const allowedFeatures = buildAllowedFeaturesMap(permissions);
    const defaultRoute = getDefaultRouteForPermissions(
      user.peran,
      allowedFeatures
    );

    return {
      success: true,
      data: {
        ...user,
        defaultRoute,
      },
    };
  } catch (err: unknown) {
    if (err instanceof LoginAuthError) {
      return {
        success: false,
        error: err.message,
        retryAfterSeconds: err.retryAfterSeconds,
        remainingAttempts: err.remainingAttempts,
      };
    }
    const message =
      err instanceof Error ? err.message : "Gagal masuk ke sistem.";
    return { success: false, error: message };
  }
}

export async function logoutStaffAction(): Promise<ApiResponse<null>> {
  await clearSessionCookie();
  return { success: true, data: null };
}
