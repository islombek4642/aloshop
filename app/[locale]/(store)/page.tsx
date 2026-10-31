import * as React from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Smartphone,
  ShieldCheck,
  Truck,
  Store,
  BadgePercent,
  ArrowRight,
  Clock,
  Phone,
  MapPin,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard, type ProductCardData } from "@/components/store/product-card";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const FALLBACK_PRODUCTS: ProductCardData[] = [
  {
    id: "fb-1",
    brand: "Apple",
    modelName: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    warrantyMonths: 12,
    variants: [
      {
        id: "fb-v1",
        sku: "IP15P-128-NAT",
        colorNameUz: "Tabiiy titan",
        colorHex: "#9A958E",
        storage: "128GB",
        condition: "NEW",
        price: 14850000,
        oldPrice: 15500000,
        images: [
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [{ quantity: 3 }],
      },
      {
        id: "fb-v2",
        sku: "IP15P-256-BLK",
        colorNameUz: "Qora titan",
        colorHex: "#393836",
        storage: "256GB",
        condition: "NEW",
        price: 16200000,
        oldPrice: null,
        images: [
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [{ quantity: 2 }],
      },
    ],
  },
  {
    id: "fb-2",
    brand: "Apple",
    modelName: "iPhone 15",
    slug: "iphone-15",
    warrantyMonths: 12,
    variants: [
      {
        id: "fb-v3",
        sku: "IP15-128-BLK",
        colorNameUz: "Qora",
        colorHex: "#34393D",
        storage: "128GB",
        condition: "NEW",
        price: 10450000,
        oldPrice: 11000000,
        images: [
          "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [{ quantity: 5 }],
      },
      {
        id: "fb-v4",
        sku: "IP15-256-BLU",
        colorNameUz: "Moviy",
        colorHex: "#D0DCE5",
        storage: "256GB",
        condition: "NEW",
        price: 11800000,
        oldPrice: null,
        images: [
          "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [{ quantity: 4 }],
      },
    ],
  },
  {
    id: "fb-3",
    brand: "Samsung",
    modelName: "Galaxy S24 Ultra",
    slug: "galaxy-s24-ultra",
    warrantyMonths: 12,
    variants: [
      {
        id: "fb-v5",
        sku: "S24U-256-GRY",
        colorNameUz: "Titan kulrang",
        colorHex: "#686866",
        storage: "256GB",
        condition: "NEW",
        price: 15200000,
        oldPrice: 16000000,
        images: [
          "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [{ quantity: 2 }],
      },
      {
        id: "fb-v6",
        sku: "S24U-512-BLK",
        colorNameUz: "Titan qora",
        colorHex: "#2C2C2B",
        storage: "512GB",
        condition: "NEW",
        price: 17100000,
        oldPrice: null,
        images: [
          "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [{ quantity: 3 }],
      },
    ],
  },
  {
    id: "fb-4",
    brand: "Xiaomi",
    modelName: "Xiaomi 14",
    slug: "xiaomi-14",
    warrantyMonths: 12,
    variants: [
      {
        id: "fb-v7",
        sku: "MI14-256-BLK",
        colorNameUz: "Qora",
        colorHex: "#1F1F1F",
        storage: "256GB",
        condition: "NEW",
        price: 8900000,
        oldPrice: 9400000,
        images: [
          "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [{ quantity: 6 }],
      },
      {
        id: "fb-v8",
        sku: "MI14-512-WHT",
        colorNameUz: "Oq",
        colorHex: "#F2F2F2",
        storage: "512GB",
        condition: "NEW",
        price: 9900000,
        oldPrice: null,
        images: [
          "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [{ quantity: 3 }],
      },
    ],
  },
];

async function getFeaturedProducts(): Promise<ProductCardData[]> {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: {
          include: {
            inventory: {
              include: {
                branch: true,
              },
            },
          },
        },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    if (!products || products.length === 0) {
      return FALLBACK_PRODUCTS;
    }

    return products.map((p) => ({
      id: p.id,
      brand: p.brand,
      modelName: p.modelName,
      slug: p.slug,
      warrantyMonths: p.warrantyMonths,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        colorNameUz: v.colorNameUz,
        colorNameRu: v.colorNameRu,
        colorNameEn: v.colorNameEn,
        colorHex: v.colorHex,
        storage: v.storage,
        condition: v.condition,
        price: v.price.toString(),
        oldPrice: v.oldPrice ? v.oldPrice.toString() : null,
        images: v.images,
        inventory: v.inventory.map((inv) => ({
          quantity: inv.quantity,
          branch: { name: inv.branch.name, slug: inv.branch.slug },
        })),
      })),
    }));
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tHome = await getTranslations({ locale, namespace: "home" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tBranches = await getTranslations({ locale, namespace: "branches" });
  const tCatalog = await getTranslations({ locale, namespace: "catalog" });

  const featuredProducts = await getFeaturedProducts();

  const brandPills = [
    { name: "Apple", query: "Apple" },
    { name: "Samsung", query: "Samsung" },
    { name: "Xiaomi", query: "Xiaomi" },
  ];

  const highlights = [
    {
      icon: ShieldCheck,
      title: tHome("badgeOfficial"),
      description: tHome("badgeOfficialDesc"),
    },
    {
      icon: Truck,
      title: tHome("badgeFastDelivery"),
      description: tHome("badgeFastDeliveryDesc"),
    },
    {
      icon: Store,
      title: tHome("badgePickup"),
      description: tHome("badgePickupDesc"),
    },
    {
      icon: BadgePercent,
      title: tHome("badgeBestPrice"),
      description: tHome("badgeBestPriceDesc"),
    },
  ];

  const branchCards = [
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
    <div className="flex flex-col space-y-12 md:space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-muted/20 py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-background"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>{tHome("badgeOfficial")}</span>
            </Badge>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
              {tHome("heroTitle")}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {tHome("heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
              <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
                <Link href="/catalog">
                  <span>{tHome("exploreCatalog")}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                <Link href="/branches">
                  <Store className="h-4 w-4" aria-hidden="true" />
                  <span>{tHome("ourBranches")}</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Highlights Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-6">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col items-center sm:items-start p-4 rounded-xl border border-border/80 bg-card text-center sm:text-left space-y-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Brand Quick Filters */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-lg font-bold text-foreground">
            {tHome("popularBrands")}
          </h2>
          <Link
            href="/catalog"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>{tHome("viewAll")}</span>
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {brandPills.map((b) => (
            <Link
              key={b.name}
              href={`/catalog?brand=${b.query}`}
              className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-border/80 bg-card p-2.5 sm:p-4 transition-all hover:border-primary hover:shadow-xs group min-w-0"
            >
              <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {b.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Smartphones Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between pb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {tHome("featuredSmartphones")}
            </h2>
            <p className="text-xs text-muted-foreground pt-0.5">
              {tCatalog("allProducts")}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
            <Link href="/catalog">
              <span>{tHome("viewAll")}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Branch Highlights */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full pb-8">
        <div className="flex items-center justify-between pb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {tBranches("title")}
            </h2>
            <p className="text-xs text-muted-foreground pt-0.5">
              {tBranches("subtitle")}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1 text-xs">
            <Link href="/branches">
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{tBranches("allBranches")}</span>
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {branchCards.map((b) => (
            <div
              key={b.name}
              className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">
                    {b.name}
                  </h3>
                  <Badge variant="success" className="text-[10px] px-1.5 py-0.5 font-medium">
                    {tBranches("availableNow")}
                  </Badge>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-snug">{b.address}</span>
                </div>
              </div>

              <div className="space-y-1.5 border-t pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{tBranches("workingHoursValue")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  <a
                    href={`tel:${b.phone.replace(/[^0-9+]/g, "")}`}
                    className="font-mono hover:text-foreground transition-colors"
                  >
                    {b.phone}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
