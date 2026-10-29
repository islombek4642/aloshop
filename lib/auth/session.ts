import { SignJWT, jwtVerify } from "jose";

export type AdminRole = "SUPER_ADMIN" | "BRANCH_ADMIN";

export interface AdminSessionPayload {
  userId: string;
  username: string;
  fullName: string;
  role: AdminRole;
  branchId: string | null;
  branchName: string | null;
}

export const ADMIN_SESSION_COOKIE = "aloshop_admin_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET || "dev-secret-key-32-chars-long-for-aloshop";
  return new TextEncoder().encode(secret);
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  };
}

/**
 * Signs an AdminSessionPayload into a JWT using jose HS256 algorithm.
 */
export async function signSessionToken(
  payload: AdminSessionPayload,
  expiresIn: string | number = "7d"
): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
    fullName: payload.fullName,
    role: payload.role,
    branchId: payload.branchId,
    branchName: payload.branchName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getAuthSecret());
}

/**
 * Verifies a JWT session token and returns the typed AdminSessionPayload or null if invalid/expired.
 */
export async function verifySessionToken(
  token: string
): Promise<AdminSessionPayload | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());

    if (
      typeof payload.userId !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.fullName !== "string" ||
      (payload.role !== "SUPER_ADMIN" && payload.role !== "BRANCH_ADMIN")
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      username: payload.username,
      fullName: payload.fullName,
      role: payload.role as AdminRole,
      branchId: typeof payload.branchId === "string" ? payload.branchId : null,
      branchName:
        typeof payload.branchName === "string" ? payload.branchName : null,
    };
  } catch {
    return null;
  }
}

/**
 * Creates an admin session cookie by signing the payload and setting the httpOnly cookie.
 */
export async function createAdminSession(
  payload: AdminSessionPayload
): Promise<string> {
  const token = await signSessionToken(payload);
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, getAdminCookieOptions());
  return token;
}

/**
 * Retrieves and validates the current admin session from cookie store or optional token override.
 */
export async function getAdminSession(
  tokenOverride?: string
): Promise<AdminSessionPayload | null> {
  if (tokenOverride) {
    return verifySessionToken(tokenOverride);
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Destroys the admin session cookie.
 */
export async function destroyAdminSession(): Promise<void> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_SESSION_COOKIE);
  } catch {
    // No-op if outside request context
  }
}

/**
 * Asserts that a valid admin session exists and satisfies role/branch constraints.
 */
export async function requireAdminSession(options?: {
  allowedRoles?: AdminRole[];
  branchId?: string;
}): Promise<AdminSessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (options?.allowedRoles && !options.allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN_ROLE");
  }

  if (
    options?.branchId &&
    session.role === "BRANCH_ADMIN" &&
    session.branchId !== options.branchId
  ) {
    throw new Error("FORBIDDEN_BRANCH");
  }

  return session;
}
