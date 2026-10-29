"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession, canManageBranches } from "@/lib/auth/admin";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const createBranchSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  city: z.string().trim().min(2, "City is required").default("Toshkent"),
  address: z.string().trim().min(3, "Address is required"),
  phone: z.string().trim().min(7, "Phone number is required"),
  workingHours: z.string().trim().min(3, "Working hours are required"),
  isActive: z.boolean().default(true),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export type CreateBranchResult =
  | { success: true; branchId: string }
  | { success: false; error: string };

export async function createBranchAction(
  input: CreateBranchInput
): Promise<CreateBranchResult> {
  const session = await getAdminSession();
  if (!session || !canManageBranches(session)) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = createBranchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validationError" };
  }

  const { name, city, address, phone, workingHours, isActive } = parsed.data;

  try {
    // Generate unique slug
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
  phone: z.string().trim().min(7, "Phone number is required"),
  workingHours: z.string().trim().min(3, "Working hours are required"),
  isActive: z.boolean(),
});

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

export type UpdateBranchResult =
  | { success: true }
  | { success: false; error: string };

export async function updateBranchAction(
  input: UpdateBranchInput
): Promise<UpdateBranchResult> {
  const session = await getAdminSession();
  if (!session || !canManageBranches(session)) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = updateBranchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validationError" };
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
  | { success: false; error: string };

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
