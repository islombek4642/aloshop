"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Instagram,
  Facebook,
  Megaphone,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SiteSettingsData } from "@/lib/settings/site-settings";
import { updateSiteSettingsAction } from "@/app/actions/admin-settings";

interface SettingsFormProps {
  initialSettings: SiteSettingsData;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const t = useTranslations("admin.settingsPage");
  const [formData, setFormData] = React.useState({
    siteName: initialSettings.siteName || "AloShop",
    phone: initialSettings.phone || "+998 71 200 11 22",
    secondaryPhone: initialSettings.secondaryPhone || "",
    email: initialSettings.email || "info@aloshop.uz",
    workingHours: initialSettings.workingHours || "09:00 - 20:00",
    address: initialSettings.address || "Toshkent sh., Navoiy shoh ko'chasi",
    telegramUrl: initialSettings.telegramUrl || "https://t.me/aloshop_official",
    instagramUrl: initialSettings.instagramUrl || "https://instagram.com/aloshop",
    facebookUrl: initialSettings.facebookUrl || "",
    announcementBanner: initialSettings.announcementBanner || "",
  });

  const [isPending, setIsPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setFeedback(null);

    try {
      const res = await updateSiteSettingsAction({
        siteName: formData.siteName,
        phone: formData.phone,
        secondaryPhone: formData.secondaryPhone.trim() || null,
        email: formData.email.trim() || null,
        workingHours: formData.workingHours,
        address: formData.address.trim() || null,
        telegramUrl: formData.telegramUrl.trim() || null,
        instagramUrl: formData.instagramUrl.trim() || null,
        facebookUrl: formData.facebookUrl.trim() || null,
        announcementBanner: formData.announcementBanner.trim() || null,
      });

      if (res.success) {
        setFeedback({ type: "success", message: t("saveSuccess") });
      } else {
        setFeedback({ type: "error", message: res.error || t("saveError") });
      }
    } catch {
      setFeedback({ type: "error", message: t("saveError") });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Feedback banner */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-medium animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. General & Contact Section */}
      <Card className="border-border/70 shadow-2xs">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{t("generalSection")}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("siteName")} *
              </label>
              <Input
                value={formData.siteName}
                onChange={(e) =>
                  setFormData({ ...formData, siteName: e.target.value })
                }
                className="text-base sm:text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{t("email")}</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="text-base sm:text-xs h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{t("phone")} *</span>
              </label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="text-base sm:text-xs h-9 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{t("secondaryPhone")}</span>
              </label>
              <Input
                value={formData.secondaryPhone}
                onChange={(e) =>
                  setFormData({ ...formData, secondaryPhone: e.target.value })
                }
                className="text-base sm:text-xs h-9 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{t("address")}</span>
            </label>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="text-base sm:text-xs h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Working Hours Section */}
      <Card className="border-border/70 shadow-2xs">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{t("workingHoursSection")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t("workingHours")} *
            </label>
            <Input
              value={formData.workingHours}
              onChange={(e) =>
                setFormData({ ...formData, workingHours: e.target.value })
              }
              placeholder={t("workingHoursPlaceholder")}
              className="text-base sm:text-xs h-9 font-mono"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Social Media & Announcement */}
      <Card className="border-border/70 shadow-2xs">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{t("socialSection")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{t("telegramUrl")}</span>
              </label>
              <Input
                value={formData.telegramUrl}
                onChange={(e) =>
                  setFormData({ ...formData, telegramUrl: e.target.value })
                }
                className="text-base sm:text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{t("instagramUrl")}</span>
              </label>
              <Input
                value={formData.instagramUrl}
                onChange={(e) =>
                  setFormData({ ...formData, instagramUrl: e.target.value })
                }
                className="text-base sm:text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{t("facebookUrl")}</span>
              </label>
              <Input
                value={formData.facebookUrl}
                onChange={(e) =>
                  setFormData({ ...formData, facebookUrl: e.target.value })
                }
                className="text-base sm:text-xs h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{t("announcementBanner")}</span>
            </label>
            <Input
              value={formData.announcementBanner}
              onChange={(e) =>
                setFormData({ ...formData, announcementBanner: e.target.value })
              }
              className="text-base sm:text-xs h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="h-10 px-6 text-xs font-semibold gap-2 shadow-sm"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="w-4 h-4" aria-hidden="true" />
          )}
          <span>{isPending ? t("saving") : t("saveButton")}</span>
        </Button>
      </div>
    </form>
  );
}
