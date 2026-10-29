import * as React from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Prisma } from "@prisma/client";
import { Smartphone, RotateCcw, Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard, type ProductCardData } from "@/components/store/product-card";
import { FilterSidebar, type FilterBranch } from "@/components/store/filter-sidebar";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface CatalogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    brand?: string;
    storage?: string;
    branch?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    q?: string;
  }>;
}

const FALLBACK_BRANCHES: FilterBranch[] = [
  { id: "b1", name: "Malika Filiali", slug: "malika" },
  { id: "b2", name: "Chilonzor Filiali", slug: "chilonzor" },
  { id: "b3", name: "Buyuk Ipak Yo'li Filiali", slug: "buyuk-ipak-yoli" },
];

const FALLBACK_CATALOG: ProductCardData[] = [
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
        inventory: [
          { quantity: 3, branch: { name: "Malika", slug: "malika" } },
        ],
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
        inventory: [
          { quantity: 2, branch: { name: "Chilonzor", slug: "chilonzor" } },
        ],
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
        inventory: [
          { quantity: 5, branch: { name: "Malika", slug: "malika" } },
        ],
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
        inventory: [
          {
            quantity: 4,
            branch: { name: "Buyuk Ipak Yo'li", slug: "buyuk-ipak-yoli" },
          },
        ],
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
        inventory: [
          { quantity: 2, branch: { name: "Malika", slug: "malika" } },
        ],
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
        inventory: [
          { quantity: 3, branch: { name: "Chilonzor", slug: "chilonzor" } },
        ],
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
        inventory: [
          { quantity: 6, branch: { name: "Malika", slug: "malika" } },
        ],
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
        inventory: [
          {
            quantity: 3,
            branch: { name: "Buyuk Ipak Yo'li", slug: "buyuk-ipak-yoli" },
          },
        ],
      },
    ],
  },
];

async function getBranches(): Promise<FilterBranch[]> {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
    if (!branches || branches.length === 0) return FALLBACK_BRANCHES;
    return branches;
  } catch {
    return FALLBACK_BRANCHES;
  }
}

function filterFallbackProducts(
  products: ProductCardData[],
  filters: {
    brand?: string;
    storage?: string;
    branch?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    q?: string;
  }
): ProductCardData[] {
  let list = [...products];

  if (filters.brand) {
    list = list.filter(
      (p) => p.brand.toLowerCase() === filters.brand!.toLowerCase()
    );
  }

  if (filters.q) {
    const qLower = filters.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.modelName.toLowerCase().includes(qLower) ||
        p.brand.toLowerCase().includes(qLower)
    );
  }

  if (filters.storage) {
    list = list.filter((p) =>
      p.variants.some(
        (v) => v.storage.toLowerCase() === filters.storage!.toLowerCase()
      )
    );
  }

  if (filters.branch) {
    list = list.filter((p) =>
      p.variants.some((v) =>
        v.inventory?.some(
          (inv) =>
            inv.branch?.slug?.toLowerCase() === filters.branch!.toLowerCase() &&
            inv.quantity > 0
        )
      )
    );
  }

  if (filters.minPrice) {
    const min = Number(filters.minPrice);
    if (!isNaN(min)) {
      list = list.filter((p) =>
        p.variants.some((v) => Number(v.price.toString()) >= min)
      );
    }
  }

  if (filters.maxPrice) {
    const max = Number(filters.maxPrice);
    if (!isNaN(max)) {
      list = list.filter((p) =>
        p.variants.some((v) => Number(v.price.toString()) <= max)
      );
    }
  }

  if (filters.sort === "priceAsc") {
    list.sort(
      (a, b) =>
        Number(a.variants[0]?.price.toString() || 0) -
        Number(b.variants[0]?.price.toString() || 0)
    );
  } else if (filters.sort === "priceDesc") {
    list.sort(
      (a, b) =>
        Number(b.variants[0]?.price.toString() || 0) -
        Number(a.variants[0]?.price.toString() || 0)
    );
  } else if (filters.sort === "nameAsc") {
    list.sort((a, b) => a.modelName.localeCompare(b.modelName));
  }

  return list;
}

export default async function CatalogPage({
  params,
  searchParams,
}: CatalogPageProps) {
  const { locale } = await params;
  const queryParams = await searchParams;
  setRequestLocale(locale);

  const tCatalog = await getTranslations({ locale, namespace: "catalog" });

  const branches = await getBranches();

  // Try DB query with full relational filters
  let products: ProductCardData[] = [];
  try {
    const where: Prisma.ProductWhereInput = {};

    if (queryParams.brand) {
      where.brand = { equals: queryParams.brand, mode: "insensitive" };
    }

    if (queryParams.q) {
      where.OR = [
        { modelName: { contains: queryParams.q, mode: "insensitive" } },
        { brand: { contains: queryParams.q, mode: "insensitive" } },
      ];
    }

    const variantFilterConditions: Prisma.ProductVariantWhereInput[] = [];

    if (queryParams.storage) {
      variantFilterConditions.push({
        storage: { equals: queryParams.storage, mode: "insensitive" },
      });
    }

    if (queryParams.branch) {
      variantFilterConditions.push({
        inventory: {
          some: {
            branch: { slug: queryParams.branch },
            quantity: { gt: 0 },
          },
        },
      });
    }

    if (queryParams.minPrice || queryParams.maxPrice) {
      const priceCondition: Prisma.DecimalFilter = {};
      if (queryParams.minPrice && !isNaN(Number(queryParams.minPrice))) {
        priceCondition.gte = Number(queryParams.minPrice);
      }
      if (queryParams.maxPrice && !isNaN(Number(queryParams.maxPrice))) {
        priceCondition.lte = Number(queryParams.maxPrice);
      }
      variantFilterConditions.push({ price: priceCondition });
    }

    if (variantFilterConditions.length > 0) {
      where.variants = {
        some: {
          AND: variantFilterConditions,
        },
      };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (queryParams.sort === "nameAsc") {
      orderBy = { modelName: "asc" };
    }

    const dbProducts = await prisma.product.findMany({
      where,
      orderBy,
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
    });

    if (dbProducts && dbProducts.length > 0) {
      products = dbProducts.map((p) => ({
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

      // In-memory sort for prices if needed
      if (queryParams.sort === "priceAsc") {
        products.sort(
          (a, b) =>
            Number(a.variants[0]?.price.toString() || 0) -
            Number(b.variants[0]?.price.toString() || 0)
        );
      } else if (queryParams.sort === "priceDesc") {
        products.sort(
          (a, b) =>
            Number(b.variants[0]?.price.toString() || 0) -
            Number(a.variants[0]?.price.toString() || 0)
        );
      }
    } else {
      // Empty result from DB
      products = [];
    }
  } catch {
    // If DB is offline or not migrated yet, use fallback filter engine
    products = filterFallbackProducts(FALLBACK_CATALOG, queryParams);
  }

  const availableBrands = ["Apple", "Samsung", "Xiaomi"];
  const availableStorages = ["128GB", "256GB", "512GB", "1TB"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {tCatalog("title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground pt-1">
            {tCatalog("resultsCount", { count: products.length })}
          </p>
        </div>

        {/* Active Query Badge */}
        {queryParams.q && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 py-1 text-xs">
              <Search className="h-3 w-3" aria-hidden="true" />
              <span>&quot;{queryParams.q}&quot;</span>
            </Badge>
          </div>
        )}
      </div>

      {/* Main Layout: Sidebar + Grid */}
      <div className="mt-6 flex flex-col md:flex-row gap-8 items-start">
        {/* Filter Sidebar */}
        <FilterSidebar
          availableBrands={availableBrands}
          availableStorages={availableStorages}
          branches={branches}
        />

        {/* Product Grid Area */}
        <div className="flex-1 w-full">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center space-y-4 my-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Smartphone className="h-6 w-6 stroke-[1.5]" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  {tCatalog("noProductsFound")}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {tCatalog("noProductsFound")}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-2 text-xs">
                <Link href="/catalog">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{tCatalog("resetFilters")}</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
