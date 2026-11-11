import { z } from "zod";

export const updateSiteSettingsSchema = z.object({
  siteName: z.string().trim().min(2, "Do'kon nomi kiritilishi shart").max(100),
  phone: z.string().trim().min(7, "Telefon raqami kiritilishi shart").max(30),
  secondaryPhone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email("Noto'g'ri email formati").optional().nullable().or(z.literal("")),
  workingHours: z.string().trim().min(3, "Ish vaqti kiritilishi shart").max(100),
  address: z.string().trim().max(255).optional().nullable(),
  telegramUrl: z.string().trim().max(255).optional().nullable(),
  instagramUrl: z.string().trim().max(255).optional().nullable(),
  facebookUrl: z.string().trim().max(255).optional().nullable(),
  announcementBanner: z.string().trim().max(500).optional().nullable(),
});

export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;
