"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession, canManageBranches } from "@/lib/auth/admin";
import { isValidUzPhone } from "@/lib/utils/phone";
import { generateSlug } from "@/lib/utils/slug";

export { generateSlug };

const createBranchSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  city: z.string().trim().min(2, "City is required").default("Toshkent"),
  address: z.string().trim().min(3, "Address is required"),
  phone: z
    .string()
    .trim()
    .refine((val) => isValidUzPhone(val), {
      message: "phoneInvalid",
    }),
  workingHours: z.string().trim().min(3, "Working hours are required"),
  isActive: z.boolean().default(true),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export type CreateBranchResult =
  | { success: true; branchId: string }
  | { success: false; error: "unauthorized" | "validationError" | "phoneInvalid" | "failedToCreate" };

export async function createBranchAction(
  input: CreateBranchInput
): Promise<CreateBranchResult> {
  const session = await getAdminSession();
  if (!session || !canManageBranches(session)) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = createBranchSchema.safeParse(input);
  if (!parsed.success) {
    const isPhoneIssue = parsed.error.issues.some((i) =>
      i.path.includes("phone")
    );
    return {
      success: false,
      error: isPhoneIssue ? "phoneInvalid" : "validationError",
    };
  }

  const { name, city, address, phone, workingHours, isActive } = parsed.data;

  try {
    // Generate unique URL-safe slug with Cyrillic & Uzbek support
    let baseSlug = generateSlug(name);
    if (!baseSlug) {
      baseSlug = `branch-${Date.now().toString().slice(-4)}`;
    }
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.branch.findUnique({
        where: { slug },
      });
      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const newBranch = await prisma.branch.create({
      data: {
        name,
        slug,
        city,
        address,
        phone,
        workingHours,
        isActive,
      },
    });

    // Populate initial zero-inventory for all existing product variants
    const allVariants = await prisma.productVariant.findMany({
      select: { id: true },
    });

    if (allVariants.length > 0) {
      await prisma.branchInventory.createMany({
        data: allVariants.map((v) => ({
          branchId: newBranch.id,
          variantId: v.id,
          quantity: 0,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/admin/branches");
    revalidatePath("/admin/inventory");
    revalidatePath("/branches");
    revalidatePath("/checkout");

    return { success: true, branchId: newBranch.id };
  } catch (err) {
    console.error("createBranchAction error:", err);
    return { success: false, error: "failedToCreate" };
  }
}

const updateBranchSchema = z.object({
  id: z.string().min(1, "Branch ID is required"),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  city: z.string().trim().min(2, "City is required"),
  address: z.string().trim().min(3, "Address is required"),
  phone: z
    .string()
    .trim()
    .refine((val) => isValidUzPhone(val), {
      message: "phoneInvalid",
    }),
  workingHours: z.string().trim().min(3, "Working hours are required"),
  isActive: z.boolean(),
});

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

export type UpdateBranchResult =
  | { success: true }
  | {
      success: false;
      error:
        | "unauthorized"
        | "validationError"
        | "phoneInvalid"
        | "notFound"
        | "failedToUpdate";
    };

export async function updateBranchAction(
  input: UpdateBranchInput
): Promise<UpdateBranchResult> {
  const session = await getAdminSession();
  if (!session || !canManageBranches(session)) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = updateBranchSchema.safeParse(input);
  if (!parsed.success) {
    const isPhoneIssue = parsed.error.issues.some((i) =>
      i.path.includes("phone")
    );
    return {
      success: false,
      error: isPhoneIssue ? "phoneInvalid" : "validationError",
    };
  }

  const { id, name, city, address, phone, workingHours, isActive } = parsed.data;

  try {
    const existing = await prisma.branch.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "notFound" };
    }

    await prisma.branch.update({
      where: { id },
      data: {
        name,
        city,
        address,
        phone,
        workingHours,
        isActive,
      },
    });

    revalidatePath("/admin/branches");
    revalidatePath("/admin/inventory");
    revalidatePath("/branches");
    revalidatePath("/checkout");

    return { success: true };
  } catch (err) {
    console.error("updateBranchAction error:", err);
    return { success: false, error: "failedToUpdate" };
  }
}

const toggleBranchStatusSchema = z.object({
  id: z.string().min(1, "Branch ID is required"),
  isActive: z.boolean(),
});

export type ToggleBranchStatusInput = z.infer<typeof toggleBranchStatusSchema>;

export type ToggleBranchStatusResult =
  | { success: true; isActive: boolean }
  | { success: false; error: "unauthorized" | "validationError" | "failedToToggle" };

export async function toggleBranchStatusAction(
  input: ToggleBranchStatusInput
): Promise<ToggleBranchStatusResult> {
  const session = await getAdminSession();
  if (!session || !canManageBranches(session)) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = toggleBranchStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validationError" };
  }

  const { id, isActive } = parsed.data;

  try {
    const updated = await prisma.branch.update({
      where: { id },
      data: { isActive },
      select: { isActive: true },
    });

    revalidatePath("/admin/branches");
    revalidatePath("/admin/inventory");
    revalidatePath("/branches");
    revalidatePath("/checkout");

    return { success: true, isActive: updated.isActive };
  } catch (err) {
    console.error("toggleBranchStatusAction error:", err);
    return { success: false, error: "failedToToggle" };
  }
}

const deleteBranchSchema = z.object({
  id: z.string().min(1, "Branch ID is required"),
});

export type DeleteBranchInput = z.infer<typeof deleteBranchSchema>;

export type DeleteBranchResult =
  | { success: true }
  | {
      success: false;
      error:
        | "unauthorized"
        | "validationError"
        | "notFound"
        | "hasOrders"
        | "failedToDelete";
    };

export async function deleteBranchAction(
  input: DeleteBranchInput
): Promise<DeleteBranchResult> {
  const session = await getAdminSession();
  if (!session || !canManageBranches(session)) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = deleteBranchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validationError" };
  }

  const { id } = parsed.data;

  try {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true, users: true },
        },
      },
    });

    if (!branch) {
      return { success: false, error: "notFound" };
    }

    if (branch._count.orders > 0) {
      return { success: false, error: "hasOrders" };
    }

    // Disassociate any assigned users
    if (branch._count.users > 0) {
      await prisma.user.updateMany({
        where: { branchId: id },
        data: { branchId: null },
      });
    }

    // Remove branch inventory items
    await prisma.branchInventory.deleteMany({
      where: { branchId: id },
    });

    // Delete the branch
    await prisma.branch.delete({
      where: { id },
    });

    revalidatePath("/admin/branches");
    revalidatePath("/admin/inventory");
    revalidatePath("/branches");
    revalidatePath("/checkout");

    return { success: true };
  } catch (err) {
    console.error("deleteBranchAction error:", err);
    return { success: false, error: "failedToDelete" };
  }
}
