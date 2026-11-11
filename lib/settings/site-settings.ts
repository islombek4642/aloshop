import { prisma } from "@/lib/db/prisma";
import { unstable_cache } from "next/cache";

export interface SiteSettingsData {
  id: string;
  siteName: string;
  phone: string;
  secondaryPhone: string | null;
  email: string | null;
  workingHours: string;
  address: string | null;
  telegramUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  announcementBanner: string | null;
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  id: "global",
  siteName: "AloShop",
  phone: "+998 71 200 11 22",
  secondaryPhone: null,
  email: "info@aloshop.uz",
  workingHours: "09:00 - 20:00",
  address: "Toshkent sh., Navoiy shoh ko'chasi",
  telegramUrl: "https://t.me/aloshop_official",
  instagramUrl: "https://instagram.com/aloshop",
  facebookUrl: null,
  announcementBanner: null,
};

/**
 * Direct database lookup without Next.js caching layer.
 * Recommended for Admin panel forms and server mutations.
 */
export async function getSiteSettingsDirect(): Promise<SiteSettingsData> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "global" },
    });
    if (settings) {
      return settings;
    }
    return DEFAULT_SITE_SETTINGS;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

/**
 * Cached site settings for public storefront with tag-based invalidation.
 */
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettingsData> => {
    return getSiteSettingsDirect();
  },
  ["site-settings"],
  {
    tags: ["site-settings"],
    revalidate: 60,
  }
);
