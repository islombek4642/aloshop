import * as React from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Building2,
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Store,
  Layers,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface BranchesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: BranchesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "branches" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export interface StorefrontBranch {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  totalStock?: number;
}

const FALLBACK_BRANCHES: StorefrontBranch[] = [
  {
    id: "b1",
    name: "Malika Savdo Markazi",
    slug: "malika",
    city: "Toshkent",
    address: "Navoiy shoh ko'chasi, Malika savdo majmuasi, A-blok 14-do'kon",
    phone: "+998 71 200 11 22",
    workingHours: "09:00 - 20:00",
    totalStock: 38,
  },
  {
    id: "b2",
    name: "Chilonzor filiali",
    slug: "chilonzor",
    city: "Toshkent",
    address: "Chilonzor 9-mavze, Qatortol ko'chasi 1-uy",
    phone: "+998 71 200 33 44",
    workingHours: "09:00 - 21:00",
    totalStock: 25,
  },
  {
    id: "b3",
    name: "Buyuk Ipak Yo'li filiali",
    slug: "buyuk-ipak-yoli",
    city: "Toshkent",
    address: "Mirzo Ulug'bek shoh ko'chasi, Maksim Gorkiy metro bekati yaqinida",
    phone: "+998 71 200 55 66",
    workingHours: "09:00 - 21:00",
    totalStock: 19,
  },
];

async function getStorefrontBranches(): Promise<StorefrontBranch[]> {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        inventory: {
          select: { quantity: true },
        },
      },
    });

    if (!branches || branches.length === 0) {
      return FALLBACK_BRANCHES;
    }

    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      city: b.city,
      address: b.address,
      phone: b.phone,
      workingHours: b.workingHours,
      totalStock: b.inventory.reduce((sum, cur) => sum + cur.quantity, 0),
    }));
  } catch {
    return FALLBACK_BRANCHES;
  }
}

export default async function BranchesPage({ params }: BranchesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tBranches = await getTranslations({ locale, namespace: "branches" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tHome = await getTranslations({ locale, namespace: "home" });

  const branches = await getStorefrontBranches();

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl space-y-8">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground transition-colors">
          {tNav("home")}
        </Link>
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
          aria-hidden="true"
        />
        <span className="font-medium text-foreground">
          {tNav("branches")}
        </span>
      </nav>

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-muted/50 to-background p-6 sm:p-10">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-xs">
            <Store className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>
              {branches.length} {tBranches("title").toLowerCase()}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {tBranches("title")}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {tBranches("subtitle")}
          </p>
        </div>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((b) => (
          <Card
            key={b.id}
            className="flex flex-col justify-between border-border/70 hover:border-primary/50 transition-all hover:shadow-md"
          >
            <CardHeader className="p-4 sm:p-6 space-y-3 pb-3 sm:pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-medium"
                  >
                    {b.city}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-medium gap-1"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{tBranches("availableNow")}</span>
                  </Badge>
                </div>
              </div>

              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {b.name}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5 leading-relaxed">
                  <MapPin
                    className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{b.address}</span>
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 text-xs text-muted-foreground pb-4">
              {/* Working Hours */}
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
                <Clock
                  className="h-4 w-4 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {tBranches("workingHours")}
                  </span>
                  <span className="font-medium text-foreground">
                    {b.workingHours}
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
                <Phone
                  className="h-4 w-4 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {tBranches("phone")}
                  </span>
                  <a
                    href={`tel:${b.phone.replace(/\s+/g, "")}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {b.phone}
                  </a>
                </div>
              </div>

              {/* Live stock indicator */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{tBranches("stockAvailable")}</span>
                </div>
                {b.totalStock !== undefined && b.totalStock > 0 && (
                  <span className="text-muted-foreground font-mono">
                    {b.totalStock} dona
                  </span>
                )}
              </div>
            </CardContent>

            <CardFooter className="p-4 sm:p-6 pt-3 sm:pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-border/60">
              <Button
                asChild
                variant="outline"
                className="w-full h-11 sm:h-10 text-sm font-medium gap-2 rounded-xl border-border/80 hover:bg-muted/60 transition-colors"
              >
                <a href={`tel:${b.phone.replace(/\s+/g, "")}`}>
                  <Phone className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  <span className="truncate">{tBranches("phone")}</span>
                </a>
              </Button>

              <Button
                asChild
                className="w-full h-11 sm:h-10 text-sm font-semibold gap-2 rounded-xl shadow-xs"
              >
                <Link href={`/catalog?branch=${b.slug}`}>
                  <Layers className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{tNav("catalog")}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Trust & Guarantee Section */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              {tHome("badgeOfficial")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              {tCommon("siteTagline")}
            </p>
          </div>
        </div>

        <Button asChild size="lg" className="h-10 px-6 font-semibold shrink-0">
          <Link href="/catalog">
            <span>{tNav("catalog")}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
