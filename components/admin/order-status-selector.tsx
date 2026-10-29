"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import {
  Clock,
  CheckCircle2,
  Truck,
  CheckCheck,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatusAction } from "@/app/actions/admin-orders";
import { cn } from "@/lib/utils/cn";

interface OrderStatusSelectorProps {
  orderId: string;
  currentStatus: OrderStatus;
  disabled?: boolean;
}

export function OrderStatusSelector({
  orderId,
  currentStatus,
  disabled = false,
}: OrderStatusSelectorProps) {
  const t = useTranslations("admin.ordersTable");
  const router = useRouter();
  const [status, setStatus] = React.useState<OrderStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleStatusChange = async (newVal: string) => {
    const newStatus = newVal as OrderStatus;
    if (newStatus === status) return;

    setStatus(newStatus);
    setIsUpdating(true);

    try {
      const res = await updateOrderStatusAction(orderId, newStatus);
      if (!res.success) {
        // Rollback on failure
        setStatus(currentStatus);
      } else {
        router.refresh();
      }
    } catch {
      setStatus(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusConfig = (val: OrderStatus) => {
    switch (val) {
      case OrderStatus.PENDING:
        return {
          label: t("statusPending"),
          icon: Clock,
          color:
            "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        };
      case OrderStatus.CONFIRMED:
        return {
          label: t("statusConfirmed"),
          icon: CheckCircle2,
          color:
            "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
        };
      case OrderStatus.SHIPPED:
        return {
          label: t("statusCompleted"),
          icon: Truck,
          color:
            "border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
        };
      case OrderStatus.DELIVERED:
        return {
          label: t("statusCompleted"),
          icon: CheckCheck,
          color:
            "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        };
      case OrderStatus.CANCELLED:
        return {
          label: t("statusCancelled"),
          icon: XCircle,
          color:
            "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
        };
      default:
        return {
          label: val,
          icon: Clock,
          color: "border-border bg-muted text-muted-foreground",
        };
    }
  };

  const currentConfig = getStatusConfig(status);
  const Icon = currentConfig.icon;

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={status}
        onValueChange={handleStatusChange}
        disabled={disabled || isUpdating}
      >
        <SelectTrigger
          className={cn(
            "h-8 px-2.5 text-xs font-medium border rounded-md transition-colors w-[140px]",
            currentConfig.color
          )}
        >
          {isUpdating ? (
            <div className="flex items-center gap-1.5 truncate">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
              <span className="truncate">...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 truncate">
              <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <SelectValue />
            </div>
          )}
        </SelectTrigger>
        <SelectContent align="end" className="text-xs">
          <SelectItem value={OrderStatus.PENDING} className="text-xs">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              <span>{t("statusPending")}</span>
            </span>
          </SelectItem>
          <SelectItem value={OrderStatus.CONFIRMED} className="text-xs">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
              <span>{t("statusConfirmed")}</span>
            </span>
          </SelectItem>
          <SelectItem value={OrderStatus.SHIPPED} className="text-xs">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
              <span>{t("statusCompleted")} (Shipped)</span>
            </span>
          </SelectItem>
          <SelectItem value={OrderStatus.DELIVERED} className="text-xs">
            <span className="flex items-center gap-1.5">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
              <span>{t("statusCompleted")} (Delivered)</span>
            </span>
          </SelectItem>
          <SelectItem value={OrderStatus.CANCELLED} className="text-xs">
            <span className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
              <span>{t("statusCancelled")}</span>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
