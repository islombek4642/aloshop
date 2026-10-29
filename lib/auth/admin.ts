import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import {
  type AdminRole,
  type AdminSessionPayload,
  createAdminSession,
  getAdminSession,
  destroyAdminSession,
  requireAdminSession,
  signSessionToken,
  verifySessionToken,
  ADMIN_SESSION_COOKIE,
} from "./session";

export type { AdminRole, AdminSessionPayload };
export {
  createAdminSession,
  getAdminSession,
  destroyAdminSession,
  requireAdminSession,
  signSessionToken,
  verifySessionToken,
  ADMIN_SESSION_COOKIE,
};

/**
 * Checks whether an authenticated admin has permission to access a specific branch.
 * SuperAdmin can access all branches. BranchAdmin can only access their assigned branch.
 */
export function canAccessBranch(
  session: AdminSessionPayload,
  targetBranchId: string | null | undefined
): boolean {
  if (session.role === "SUPER_ADMIN") {
    return true;
  }
  if (!targetBranchId) {
    return false;
  }
  return session.branchId === targetBranchId;
}

/**
 * Checks whether the session role is in the allowed roles list.
 */
export function hasRole(
  session: AdminSessionPayload,
  roles: AdminRole[]
): boolean {
  return roles.includes(session.role);
}

/**
 * Returns true if the user is a Super Administrator.
 */
export function isSuperAdmin(session: AdminSessionPayload): boolean {
  return session.role === "SUPER_ADMIN";
}

/**
 * Returns true if the user is a Branch Administrator.
 */
export function isBranchAdmin(session: AdminSessionPayload): boolean {
  return session.role === "BRANCH_ADMIN";
}

/**
 * Returns true if the user can manage system users. Only SuperAdmin allowed.
 */
export function canManageUsers(session: AdminSessionPayload): boolean {
  return session.role === "SUPER_ADMIN";
}

/**
 * Returns true if the user can manage branches. Only SuperAdmin allowed.
 */
export function canManageBranches(session: AdminSessionPayload): boolean {
  return session.role === "SUPER_ADMIN";
}

/**
 * Verifies admin credentials against .env SuperAdmin and Prisma User database.
 * Returns the typed session payload if valid, or null if invalid.
 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<AdminSessionPayload | null> {
  if (!username || !password) {
    return null;
  }

  const trimmedUsername = username.trim();

  // 1. Verify against SuperAdmin .env credentials
  const envSuperUsername = process.env.SUPER_ADMIN_USERNAME || "admin";
  const envSuperPassword =
    process.env.SUPER_ADMIN_PASSWORD || "superadmin_secret_password_change_me";

  if (
    trimmedUsername === envSuperUsername &&
    password === envSuperPassword
  ) {
    return {
      userId: "superadmin-root",
      username: envSuperUsername,
      fullName: "Super Administrator",
      role: "SUPER_ADMIN",
      branchId: null,
      branchName: null,
    };
  }

  // 2. Verify against Prisma database users
  try {
    const user = await prisma.user.findUnique({
      where: { username: trimmedUsername },
      include: { branch: true },
    });

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      branchId: user.branchId,
      branchName: user.branch?.name ?? null,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("Database user verification error:", error);
    }
    return null;
  }
}
