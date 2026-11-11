import * as React from "react";
import { getTranslations } from "next-intl/server";
import {
  Smartphone,
  MapPin,
  Clock,
  Phone,
  Mail,
  Send,
  Instagram,
  Facebook,
  ShieldCheck,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/db/prisma";
import { getSiteSettings, type SiteSettingsData } from "@/lib/settings/site-settings";

const FALLBACK_BRANCHES = [
  {
    id: "b1",
    name: "Malika Savdo Markazi",
    address: "Navoiy shoh ko'chasi, A-blok 14-do'kon",
    slug: "malika",
  },
  {
    id: "b2",
    name: "Chilonzor filiali",
    address: "Qatortol ko'chasi 1-uy",
    slug: "chilonzor",
  },
  {
    id: "b3",
    name: "Buyuk Ipak Yo'li filiali",
    address: "Mirzo Ulug'bek shoh ko'chasi 14",
    slug: "buyuk-ipak-yoli",
  },
];

export interface StoreFooterProps {
  settings?: SiteSettingsData | null;
}

export async function StoreFooter({ settings: propSettings }: StoreFooterProps = {}) {
  const tFooter = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tHome = await getTranslations("home");

  const [fetchedSettings, dbBranches] = await Promise.all([
    propSettings !== undefined
      ? Promise.resolve(propSettings)
      : getSiteSettings().catch(() => null),
    prisma.branch
      .findMany({
        where: { isActive: true },
        select: { id: true, name: true, address: true, slug: true },
        orderBy: { name: "asc" },
      })
      .catch(() => []),
  ]);

  const settings = propSettings !== undefined ? propSettings : fetchedSettings;
  const siteName = settings?.siteName?.trim() || tCommon("siteName");
  const branches = dbBranches && dbBranches.length > 0 ? dbBranches : FALLBACK_BRANCHES;
  const address = settings?.address || "Toshkent sh., Navoiy shoh ko'chasi";
  const phone = settings?.phone || "+998 71 200 11 22";
  const secondaryPhone = settings?.secondaryPhone;
  const email = settings?.email;
  const workingHours = settings?.workingHours || tFooter("workingHours");
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const cleanSecondaryPhone = secondaryPhone ? secondaryPhone.replace(/[^\d+]/g, "") : null;
  const telegramUrl = settings?.telegramUrl;
  const instagramUrl = settings?.instagramUrl;
  const facebookUrl = settings?.facebookUrl;

  const currentYear = new Date().getFullYear();

  const quickNav = [
    { href: "/", label: tNav("home") },
    { href: "/catalog", label: tNav("catalog") },
    { href: "/branches", label: tNav("branches") },
    { href: "/cart", label: tNav("cart") },
  ];

  return (
    <footer className="border-t bg-muted/30 text-foreground pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Summary */}
          <div className="flex flex-col space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label={siteName}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Smartphone className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                {siteName}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tFooter("aboutText")}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>{tHome("badgeOfficial")}</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-sm font-semibold tracking-wide text-foreground">
              {tFooter("quickLinks")}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {quickNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                  >
                    <ArrowRight className="h-3 w-3 text-muted-foreground/60" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Branch Locations (Dynamic from Database) */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-sm font-semibold tracking-wide text-foreground">
              {tFooter("branchesTitle")}
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {branches.map((b) => (
                <li key={b.slug || b.name}>
                  <Link
                    href="/branches"
                    className="flex flex-col space-y-0.5 group hover:text-foreground transition-colors"
                  >
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {b.name}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                      {b.address}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts & Working Hours (Dynamic from SiteSettings) */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-sm font-semibold tracking-wide text-foreground">
              {tFooter("contactsTitle")}
            </h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              {/* Dynamic Address */}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-xs leading-relaxed text-foreground/90">{address}</span>
              </div>

              {/* Working Hours */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <span>{workingHours}</span>
              </div>

              {/* Main Phone */}
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <a
                  href={`tel:${cleanPhone}`}
                  className="transition-colors hover:text-foreground font-mono text-xs"
                >
                  {phone}
                </a>
              </div>

              {/* Secondary Phone (if set) */}
              {secondaryPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <a
                    href={`tel:${cleanSecondaryPhone}`}
                    className="transition-colors hover:text-foreground font-mono text-xs"
                  >
                    {secondaryPhone}
                  </a>
                </div>
              )}

              {/* Email (if set) */}
              {email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <a
                    href={`mailto:${email}`}
                    className="transition-colors hover:text-foreground text-xs"
                  >
                    {email}
                  </a>
                </div>
              )}

              {/* Social Media Links */}
              {(telegramUrl || instagramUrl || facebookUrl) && (
                <div className="flex items-center gap-2 pt-1.5">
                  {telegramUrl && (
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground hover:border-primary/50 hover:text-sky-500 transition-colors"
                      aria-label="Telegram"
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground hover:border-primary/50 hover:text-pink-500 transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground hover:border-primary/50 hover:text-blue-600 transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}

              {/* Payment Methods */}
              <div className="flex items-center gap-2 pt-2">
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="text-xs leading-snug">
                  {tFooter("paymentMethods")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {currentYear} {siteName}. {tFooter("allRightsReserved")}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/catalog" className="hover:text-foreground transition-colors">
              {tNav("catalog")}
            </Link>
            <Link href="/branches" className="hover:text-foreground transition-colors">
              {tNav("branches")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
