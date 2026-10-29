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

export default async function CheckoutPage() {
  const tCheckout = await getTranslations("checkout");
  const tNav = await getTranslations("nav");

  // Load active branches for pickup options
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

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground"
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
