"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Building2,
  Package,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transferStockAction } from "@/app/actions/admin-inventory";

export interface BranchOption {
  id: string;
  name: string;
}

export interface VariantOption {
  id: string;
  sku: string;
  modelName: string;
  color: string;
  storage: string;
}

export interface InventoryRecord {
  branchId: string;
  variantId: string;
  quantity: number;
}

interface StockTransferModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  branches: BranchOption[];
  variants: VariantOption[];
  inventories: InventoryRecord[];
  initialFromBranchId?: string;
  initialVariantId?: string;
  isLockedFromBranch?: boolean;
}

export function StockTransferModal({
  isOpen,
  onOpenChange,
  branches,
  variants,
  inventories,
  initialFromBranchId,
  initialVariantId,
  isLockedFromBranch = false,
}: StockTransferModalProps) {
  const t = useTranslations("admin.stockTransfer");
  const router = useRouter();

  const [fromBranchId, setFromBranchId] = React.useState<string>(
    initialFromBranchId || (branches[0]?.id ?? "")
  );
  const [toBranchId, setToBranchId] = React.useState<string>("");
  const [variantId, setVariantId] = React.useState<string>(
    initialVariantId || (variants[0]?.id ?? "")
  );
  const [quantity, setQuantity] = React.useState<number>(1);
  const [isPending, setIsPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  );

  // Reset feedback state and quantity whenever modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setQuantity(1);
    }
  }, [isOpen]);

  // Sync state when props change
  React.useEffect(() => {
    if (initialFromBranchId) {
      setFromBranchId(initialFromBranchId);
    }
  }, [initialFromBranchId]);

  React.useEffect(() => {
    if (initialVariantId) {
      setVariantId(initialVariantId);
    }
  }, [initialVariantId]);

  // Compute available stock in source branch for selected variant
  const availableStock = React.useMemo(() => {
    if (!fromBranchId || !variantId) return 0;
    const inv = inventories.find(
      (item) => item.branchId === fromBranchId && item.variantId === variantId
    );
    return inv ? inv.quantity : 0;
  }, [inventories, fromBranchId, variantId]);

  // Destination branch options: exclude source branch
  const destBranchOptions = React.useMemo(() => {
    return branches.filter((b) => b.id !== fromBranchId);
  }, [branches, fromBranchId]);

  // Default destination branch when source changes
  React.useEffect(() => {
    if (destBranchOptions.length > 0 && (!toBranchId || toBranchId === fromBranchId)) {
      setToBranchId(destBranchOptions[0].id);
    }
  }, [fromBranchId, destBranchOptions, toBranchId]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fromBranchId || !toBranchId || !variantId) {
      setErrorMessage(t("transferError"));
      return;
    }

    if (fromBranchId === toBranchId) {
      setErrorMessage(t("sameBranchError"));
      return;
    }

    if (quantity <= 0) {
      setErrorMessage(t("quantityPlaceholder"));
      return;
    }

    if (quantity > availableStock) {
      setErrorMessage(t("insufficientStock"));
      return;
    }

    setIsPending(true);

    try {
      const res = await transferStockAction({
        fromBranchId,
        toBranchId,
        variantId,
        quantity,
      });

      if (!res.success) {
        if (res.error === "insufficientStock") {
          setErrorMessage(t("insufficientStock"));
        } else if (res.error === "sameBranchError") {
          setErrorMessage(t("sameBranchError"));
        } else {
          setErrorMessage(t("transferError"));
        }
        setIsPending(false);
        return;
      }

      setSuccessMessage(t("transferSuccess"));
      router.refresh();

      setTimeout(() => {
        setIsPending(false);
        setSuccessMessage(null);
        onOpenChange(false);
      }, 900);
    } catch {
      setErrorMessage(t("transferError"));
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <ArrowRightLeft className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{t("modalTitle")}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("modalSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleTransfer} className="space-y-4 pt-1">
          {/* Error & Success banners */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-900">
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Product Variant Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{t("selectVariant")}</span>
            </label>
            <Select value={variantId} onValueChange={setVariantId}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder={t("variantPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {variants.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-xs">
                    {v.modelName} &bull; {v.storage} &bull; {v.color} ({v.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Branches Row: From & To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* From Branch */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{t("fromBranch")}</span>
              </label>
              <Select
                value={fromBranchId}
                onValueChange={setFromBranchId}
                disabled={isLockedFromBranch}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder={t("selectSourceBranch")} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To Branch */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{t("toBranch")}</span>
              </label>
              <Select value={toBranchId} onValueChange={setToBranchId}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder={t("selectDestBranch")} />
                </SelectTrigger>
                <SelectContent>
                  {destBranchOptions.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Available stock in source */}
          <div className="flex items-center justify-between text-xs px-3 py-2 bg-muted/40 rounded-md border border-border/60">
            <span className="text-muted-foreground">
              {t("availableInSource", { count: availableStock })}
            </span>
            <span
              className={
                availableStock > 0
                  ? "font-semibold text-emerald-600 dark:text-emerald-400 font-mono"
                  : "font-semibold text-destructive font-mono"
              }
            >
              {availableStock}
            </span>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t("quantity")}
            </label>
            <Input
              type="number"
              min={1}
              max={Math.max(availableStock, 1)}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder={t("quantityPlaceholder")}
              className="text-xs h-9"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-xs"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || availableStock === 0 || destBranchOptions.length === 0}
              className="text-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" aria-hidden="true" />
                  <span>{t("transferring")}</span>
                </>
              ) : (
                <span>{t("confirmTransfer")}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

