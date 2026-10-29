"use server";

import { headers } from "next/headers";
import { z } from "zod";
import {
  verifyAdminCredentials,
  createAdminSession,
  destroyAdminSession,
} from "@/lib/auth/admin";

interface LoginRateLimitRecord {
  count: number;
  resetTime: number;
}

const loginRateLimitMap = new Map<string, LoginRateLimitRecord>();

function checkLoginRateLimit(ip: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = loginRateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    loginRateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

const loginSchema = z.object({
  username: z.string().min(1, "usernameRequired"),
  password: z.string().min(1, "passwordRequired"),
});

export type LoginActionResult =
  | { success: true }
  | { success: false; error: string };

export async function loginAdminAction(
  rawInput: FormData | { username: string; password: string }
): Promise<LoginActionResult> {
  try {
    // 1. IP extraction & Rate limiting (5 attempts/min)
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    if (!checkLoginRateLimit(ip, 5, 60_000)) {
      return {
        success: false,
        error: "loginErrorRateLimit",
      };
    }

    // 2. Extract values
    const data =
      rawInput instanceof FormData
        ? {
            username: String(rawInput.get("username") || "").trim(),
            password: String(rawInput.get("password") || ""),
          }
        : {
            username: (rawInput.username || "").trim(),
            password: rawInput.password || "",
          };

    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "loginErrorInvalid",
      };
    }

    // 3. Verify credentials (against .env or Prisma database)
    const sessionPayload = await verifyAdminCredentials(
      parsed.data.username,
      parsed.data.password
    );

    if (!sessionPayload) {
      return {
        success: false,
        error: "loginErrorInvalid",
      };
    }

    // 4. Set session cookie
    await createAdminSession(sessionPayload);

    return { success: true };
  } catch (error) {
    console.error("loginAdminAction error:", error);
    return {
      success: false,
      error: "loginErrorInvalid",
    };
  }
}

export async function logoutAdminAction(): Promise<{ success: true }> {
  try {
    await destroyAdminSession();
  } catch (error) {
    console.error("logoutAdminAction error:", error);
  }
  return { success: true };
}
