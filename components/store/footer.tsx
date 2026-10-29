import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Smartphone,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { Link } from "@/i18n/routing";

export function StoreFooter() {
  const tFooter = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");

  const currentYear = new Date().getFullYear();

  const quickNav = [
    { href: "/", label: tNav("home") },
    { href: "/catalog", label: tNav("catalog") },
    { href: "/branches", label: tNav("branches") },
    { href: "/cart", label: tNav("cart") },
  ];

  const branches = [
    {
      name: "Malika Filiali",
      address: "Toshkent sh., Shayxontohur t., Kichik Halka Yo'li 59 (C-4)",
      phone: "+998 71 200 11 22",
    },
    {
      name: "Chilonzor Filiali",
      address: "Toshkent sh., Chilonzor t., Qatortol ko'chasi 28",
      phone: "+998 71 200 33 44",
    },
    {
      name: "Buyuk Ipak Yo'li Filiali",
      address: "Toshkent sh., Mirzo Ulug'bek t., Buyuk Ipak Yo'li 14",
      phone: "+998 71 200 55 66",
    },
  ];

  return (
    <footer className="border-t bg-muted/30 text-foreground pb-20 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Summary */}
          <div className="flex flex-col space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label={tCommon("siteName")}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Smartphone className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                {tCommon("siteName")}
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

          {/* Branch Locations */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-sm font-semibold tracking-wide text-foreground">
              {tFooter("branchesTitle")}
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {branches.map((b) => (
                <li key={b.name} className="flex flex-col space-y-0.5">
                  <span className="font-medium text-foreground">{b.name}</span>
                  <span className="text-xs text-muted-foreground flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    {b.address}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts & Working Hours */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-sm font-semibold tracking-wide text-foreground">
              {tFooter("contactsTitle")}
            </h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span>{tFooter("workingHours")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <a
                  href="tel:+998712001122"
                  className="transition-colors hover:text-foreground font-mono text-xs"
                >
                  +998 71 200 11 22
                </a>
              </div>
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
            &copy; {currentYear} {tCommon("siteName")}. {tFooter("allRightsReserved")}
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

