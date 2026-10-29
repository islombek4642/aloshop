"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";

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

export type CreateBranchAdminInput = z.infer<typeof createBranchAdminSchema>;

export type CreateBranchAdminResult =
  | { success: true; userId: string }
  | { success: false; error: string };

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
    // 1. Verify branch exists and is active
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch || !branch.isActive) {
      return { success: false, error: "branchNotFound" };
    }

    // 2. Check for unique username
    const existing = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (existing) {
      return { success: false, error: "usernameTaken" };
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create user
    const newUser = await prisma.user.create({
      data: {
        username: trimmedUsername,
        fullName: fullName.trim(),
        passwordHash,
        role: UserRole.BRANCH_ADMIN,
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

