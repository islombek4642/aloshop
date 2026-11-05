"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";

// -------------------------------------------------------------
// Schemas
// -------------------------------------------------------------

const createBranchAdminSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  fullName: z.string().min(2, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  branchId: z.string().min(1, "Branch is required"),
});

const updateBranchAdminSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .optional(),
  fullName: z.string().min(2, "Full name is required"),
  branchId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const deleteUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type CreateBranchAdminInput = z.infer<typeof createBranchAdminSchema>;
export type UpdateBranchAdminInput = z.infer<typeof updateBranchAdminSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

export type CreateBranchAdminResult =
  | { success: true; userId: string }
  | { success: false; error: string };

export type AdminUserActionResult =
  | { success: true }
  | { success: false; error: string };

// -------------------------------------------------------------
// Create Branch Admin
// -------------------------------------------------------------

export async function createBranchAdminAction(
  input: CreateBranchAdminInput
): Promise<CreateBranchAdminResult> {
  const session = await getAdminSession();
  if (!session || !isSuperAdmin(session)) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = createBranchAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validationError" };
  }

  const { username, fullName, password, branchId } = parsed.data;
  const trimmedUsername = username.trim().toLowerCase();

  try {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch || !branch.isActive) {
      return { success: false, error: "branchNotFound" };
    }

    const existing = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (existing) {
      return { success: false, error: "usernameTaken" };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: trimmedUsername,
        fullName: fullName.trim(),
        passwordHash,
        role: UserRole.BRANCH_ADMIN,
        isActive: true,
        branchId,
      },
    });

    revalidatePath("/admin/users");

    return { success: true, userId: newUser.id };
  } catch (err) {
    console.error("createBranchAdminAction error:", err);
    return { success: false, error: "failedToCreate" };
  }
}

// -------------------------------------------------------------
// Update Branch Admin
// -------------------------------------------------------------

export async function updateBranchAdminAction(
  input: UpdateBranchAdminInput
): Promise<AdminUserActionResult> {
  const session = await getAdminSession();
  if (!session || !isSuperAdmin(session)) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = updateBranchAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validationError" };
  }

  const { userId, username, fullName, branchId, isActive } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "userNotFound" };
    }

    // Super admin cannot deactivate themselves
    if (session.userId === userId && isActive === false) {
      return { success: false, error: "cannotDeactivateSelf" };
    }

    let finalUsername = user.username;
    if (username) {
      const trimmedUsername = username.trim().toLowerCase();
      if (trimmedUsername !== user.username) {
        const existing = await prisma.user.findUnique({
          where: { username: trimmedUsername },
        });
        if (existing) {
          return { success: false, error: "usernameTaken" };
        }
        finalUsername = trimmedUsername;
      }
    }

    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
      });
      if (!branch || !branch.isActive) {
        return { success: false, error: "branchNotFound" };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        username: finalUsername,
        fullName: fullName.trim(),
        branchId: branchId === undefined ? user.branchId : branchId,
        isActive: isActive === undefined ? user.isActive : isActive,
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    console.error("updateBranchAdminAction error:", err);
    return { success: false, error: "failedToUpdate" };
  }
}

// -------------------------------------------------------------
// Reset Admin Password
// -------------------------------------------------------------

export async function resetBranchAdminPasswordAction(
  input: ResetPasswordInput
): Promise<AdminUserActionResult> {
  const session = await getAdminSession();
  if (!session || !isSuperAdmin(session)) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validationError" };
  }

  const { userId, newPassword } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "userNotFound" };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    console.error("resetBranchAdminPasswordAction error:", err);
    return { success: false, error: "failedToReset" };
  }
}

// -------------------------------------------------------------
// Delete / Deactivate Branch Admin
// -------------------------------------------------------------

export async function deleteBranchAdminAction(
  input: DeleteUserInput
): Promise<AdminUserActionResult> {
  const session = await getAdminSession();
  if (!session || !isSuperAdmin(session)) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = deleteUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validationError" };
  }

  const { userId } = parsed.data;

  if (session.userId === userId) {
    return { success: false, error: "cannotDeleteSelf" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "userNotFound" };
    }

    // Try hard delete; if foreign key restricts or for audit safety, soft delete by deactivating
    try {
      await prisma.user.delete({
        where: { id: userId },
      });
    } catch {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          branchId: null,
        },
      });
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    console.error("deleteBranchAdminAction error:", err);
    return { success: false, error: "failedToDelete" };
  }
}
