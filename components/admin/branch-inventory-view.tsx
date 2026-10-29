"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  ArrowRightLeft,
  Boxes,
  Save,
  Check,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { updateStockAction } from "@/app/actions/admin-inventory";
import {
  StockTransferModal,
  type BranchOption,
  type VariantOption,
  type InventoryRecord,
} from "./stock-transfer-modal";
import { formatCurrency } from "@/lib/utils/format-currency";

export interface BranchDetails {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
}

export interface InventoryItemDetail {
  id: string;
  branchId: string;
  variantId: string;
  quantity: number;
  productName: string;
  sku: string;
  colorName: string;
  colorHex: string;
  storage: string;
  condition: string;
  price: number;
}

interface BranchInventoryViewProps {
  branches: BranchDetails[];
  inventoryItems: InventoryItemDetail[];
  allVariants: VariantOption[];
  isSuperAdmin: boolean;
  userBranchId: string | null;
}

export function BranchInventoryView({
  branches,
  inventoryItems,
  allVariants,
  isSuperAdmin,
  userBranchId,
}: BranchInventoryViewProps) {
  const t = useTranslations("admin.branchesPage");
  const router = useRouter();

  // Active branch tab (defaults to user's branch or first branch)
  const initialBranchId = userBranchId || branches[0]?.id || "";
  const [activeBranchId, setActiveBranchId] = React.useState<string>(initialBranchId);

  // Search filter
  const [searchTerm, setSearchTerm] = React.useState("");

  // Transfer modal state
  const [isTransferOpen, setIsTransferOpen] = React.useState(false);
  const [transferFromBranchId, setTransferFromBranchId] = React.useState(activeBranchId);
  const [transferVariantId, setTransferVariantId] = React.useState<string | undefined>();

  // Inline stock edit states: variantId -> current string value
  const [editedStock, setEditedStock] = React.useState<Record<string, number>>({});
  const [savingVariantId, setSavingVariantId] = React.useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = React.useState<{
    variantId: string;
    type: "success" | "error";
  } | null>(null);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  const currentBranchItems = React.useMemo(() => {
    if (!activeBranch) return [];
    return inventoryItems
      .filter((item) => item.branchId === activeBranch.id)
      .filter((item) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          item.productName.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term) ||
          item.colorName.toLowerCase().includes(term) ||
          item.storage.toLowerCase().includes(term)
        );
      });
  }, [inventoryItems, activeBranch, searchTerm]);

  const totalUnits = React.useMemo(() => {
    if (!activeBranch) return 0;
    return inventoryItems
      .filter((item) => item.branchId === activeBranch.id)
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [inventoryItems, activeBranch]);

  const handleStockChange = (variantId: string, val: number) => {
    setEditedStock((prev) => ({
      ...prev,
      [variantId]: Math.max(0, val),
    }));
  };

  const handleSaveStock = async (variantId: string, currentQty: number) => {
    const qty = editedStock[variantId] !== undefined ? editedStock[variantId] : currentQty;
    setSavingVariantId(variantId);
    setStatusFeedback(null);

    try {
      const res = await updateStockAction({
        branchId: activeBranch.id,
        variantId,
        quantity: qty,
      });

      if (!res.success) {
        setStatusFeedback({ variantId, type: "error" });
      } else {
        setStatusFeedback({ variantId, type: "success" });
        router.refresh();
      }
    } catch {
      setStatusFeedback({ variantId, type: "error" });
    } finally {
      setSavingVariantId(null);
    }
  };

  const openTransferForVariant = (variantId?: string) => {
    setTransferFromBranchId(activeBranch.id);
    setTransferVariantId(variantId);
    setIsTransferOpen(true);
  };

  const branchOptions: BranchOption[] = branches.map((b) => ({
    id: b.id,
    name: b.name,
  }));

  const inventoryRecords: InventoryRecord[] = inventoryItems.map((item) => ({
    branchId: item.branchId,
    variantId: item.variantId,
    quantity: item.quantity,
  }));

  if (!activeBranch) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        {t("noBranches")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Branch Tabs (if multiple branches accessible) */}
      {branches.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
          {branches.map((b) => {
            const isActive = b.id === activeBranchId;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setActiveBranchId(b.id);
                  setEditedStock({});
                  setStatusFeedback(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card hover:bg-muted text-muted-foreground border border-border"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{b.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Branch Info Card */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                {activeBranch.name}
              </h2>
              <Badge variant="outline" className="text-[11px] font-mono">
                {activeBranch.city}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground/80" aria-hidden="true" />
                <span>{activeBranch.address}</span>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-muted-foreground/80" aria-hidden="true" />
                <span>{activeBranch.phone}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/80" aria-hidden="true" />
                <span>{activeBranch.workingHours}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right pr-2">
              <div className="text-[11px] text-muted-foreground">
                {t("inStockCount")}
              </div>
              <div className="text-xl font-bold font-mono text-foreground">
                {totalUnits}
              </div>
            </div>

            {/* Transfer Stock Button */}
            <Button
              size="sm"
              onClick={() => openTransferForVariant(undefined)}
              className="gap-1.5 text-xs h-9 shrink-0"
            >
              <ArrowRightLeft className="w-4 h-4" aria-hidden="true" />
              <span>{t("transferStock")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table & Filter Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="relative w-full max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder={t("searchProduct")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
          {currentBranchItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Boxes className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" aria-hidden="true" />
              <p className="font-medium text-foreground">{t("noInventory")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">SKU</TableHead>
                  <TableHead className="text-xs">{t("searchProduct").replace("...", "")}</TableHead>
                  <TableHead className="text-xs">Color & Storage</TableHead>
                  <TableHead className="text-xs">Price</TableHead>
                  <TableHead className="text-xs text-center w-40">{t("stockQuantity")}</TableHead>
                  <TableHead className="text-xs text-right w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentBranchItems.map((item) => {
                  const currentQty =
                    editedStock[item.variantId] !== undefined
                      ? editedStock[item.variantId]
                      : item.quantity;
                  const isDirty =
                    editedStock[item.variantId] !== undefined &&
                    editedStock[item.variantId] !== item.quantity;
                  const isSaving = savingVariantId === item.variantId;
                  const feedback =
                    statusFeedback?.variantId === item.variantId
                      ? statusFeedback.type
                      : null;

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {item.sku}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        <span className="font-semibold text-foreground">
                          {item.productName}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                            style={{ backgroundColor: item.colorHex }}
                            aria-hidden="true"
                          />
                          <span>
                            {item.colorName} &bull; {item.storage}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Input
                            type="number"
                            min={0}
                            value={currentQty}
                            onChange={(e) =>
                              handleStockChange(
                                item.variantId,
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className="w-20 h-8 text-center text-xs font-mono font-bold"
                          />
                          <Button
                            size="sm"
                            variant={isDirty ? "default" : "outline"}
                            disabled={!isDirty || isSaving}
                            onClick={() =>
                              handleSaveStock(item.variantId, item.quantity)
                            }
                            className="h-8 px-2.5 text-xs"
                          >
                            {isSaving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                            ) : feedback === "success" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                            ) : feedback === "error" ? (
                              <AlertCircle className="w-3.5 h-3.5 text-destructive" aria-hidden="true" />
                            ) : (
                              <Save className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openTransferForVariant(item.variantId)}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                          title={t("transferStock")}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Stock Transfer Modal */}
      <StockTransferModal
        isOpen={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        branches={branchOptions}
        variants={allVariants}
        inventories={inventoryRecords}
        initialFromBranchId={transferFromBranchId}
        initialVariantId={transferVariantId}
        isLockedFromBranch={!isSuperAdmin}
      />
    </div>
  );
}
