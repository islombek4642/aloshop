import * as React from "react";
import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Link } from "@/i18n/routing";
import { CheckoutForm } from "@/components/store/checkout-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return {
    title: t("title"),
  };
}

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

const FALLBACK_BRANCHES = [
  {
    id: "b1",
    name: "Malika Savdo Markazi",
    city: "Toshkent",
    address: "Navoiy shoh ko'chasi, Malika savdo majmuasi, A-blok 14-do'kon",
    phone: "+998 71 200 11 22",
    workingHours: "09:00 - 20:00",
  },
  {
    id: "b2",
    name: "Chilonzor filiali",
    city: "Toshkent",
    address: "Chilonzor 9-mavze, Qatortol ko'chasi 1-uy",
    phone: "+998 71 200 33 44",
    workingHours: "09:00 - 21:00",
  },
  {
    id: "b3",
    name: "Buyuk Ipak Yo'li filiali",
    city: "Toshkent",
    address: "Mirzo Ulug'bek shoh ko'chasi, Maksim Gorkiy metro bekati yaqinida",
    phone: "+998 71 200 55 66",
    workingHours: "09:00 - 21:00",
  },
];

async function getCheckoutBranches() {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        phone: true,
        workingHours: true,
      },
    });

    if (!branches || branches.length === 0) {
      return FALLBACK_BRANCHES;
    }
    return branches;
  } catch {
    return FALLBACK_BRANCHES;
  }
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;
  const tCheckout = await getTranslations({ locale, namespace: "checkout" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  // Load active branches with safe fallback
  const branches = await getCheckoutBranches();

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground transition-colors">
          {tNav("home")}
        </Link>
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
          aria-hidden="true"
        />
        <Link href="/cart" className="hover:text-foreground transition-colors">
          {tNav("cart")}
        </Link>
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
          aria-hidden="true"
        />
        <span className="font-medium text-foreground">
          {tCheckout("title")}
        </span>
      </nav>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {tCheckout("title")}
        </h1>
      </div>

      {/* Checkout Form */}
      <CheckoutForm branches={branches} />
    </div>
  );
}
