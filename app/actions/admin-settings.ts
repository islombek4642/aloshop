"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";
import {
  updateSiteSettingsSchema,
  type UpdateSiteSettingsInput,
} from "@/lib/validations/admin-settings";
import {
  DEFAULT_SITE_SETTINGS,
  getSiteSettingsDirect,
  type SiteSettingsData,
} from "@/lib/settings/site-settings";

function safeRevalidate(): void {
  try {
    revalidateTag("site-settings");
  } catch {
    // Gracefully ignore outside Next.js request context
  }
  try {
    revalidatePath("/", "layout");
    revalidatePath("/[locale]", "layout");
    revalidatePath("/uz", "layout");
    revalidatePath("/ru", "layout");
    revalidatePath("/en", "layout");
    revalidatePath("/branches");
    revalidatePath("/admin/settings");
  } catch {
    // Gracefully ignore
  }
}

export type GetSiteSettingsResult =
  | { success: true; settings: SiteSettingsData }
  | { success: false; error: string };

export async function getSiteSettingsAction(): Promise<GetSiteSettingsResult> {
  try {
    const settings = await getSiteSettingsDirect();
    return {
      success: true,
      settings,
    };
  } catch {
    return {
      success: true,
      settings: DEFAULT_SITE_SETTINGS,
    };
  }
}

export type UpdateSiteSettingsResult =
  | { success: true; settings: SiteSettingsData }
  | { success: false; error: string };

export async function updateSiteSettingsAction(
  input: UpdateSiteSettingsInput
): Promise<UpdateSiteSettingsResult> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: "unauthorized" };
  }

  if (!isSuperAdmin(session)) {
    return { success: false, error: "forbidden" };
  }

  const parsed = updateSiteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input data",
    };
  }

  try {
    const data = parsed.data;
    const settings = await prisma.siteSettings.upsert({
      where: { id: "global" },
      update: {
        siteName: data.siteName,
        phone: data.phone,
        secondaryPhone: data.secondaryPhone || null,
        email: data.email || null,
        workingHours: data.workingHours,
        address: data.address || null,
        telegramUrl: data.telegramUrl || null,
        instagramUrl: data.instagramUrl || null,
        facebookUrl: data.facebookUrl || null,
        announcementBanner: data.announcementBanner || null,
      },
      create: {
        id: "global",
        siteName: data.siteName,
        phone: data.phone,
        secondaryPhone: data.secondaryPhone || null,
        email: data.email || null,
        workingHours: data.workingHours,
        address: data.address || null,
        telegramUrl: data.telegramUrl || null,
        instagramUrl: data.instagramUrl || null,
        facebookUrl: data.facebookUrl || null,
        announcementBanner: data.announcementBanner || null,
      },
    });

    safeRevalidate();

    return {
      success: true,
      settings,
    };
  } catch (error) {
    console.error("Failed to update site settings:", error);
    return {
      success: false,
      error: "Sozlamalarni saqlashda xatolik yuz berdi",
    };
  }
}
