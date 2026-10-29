"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { OrderStatus, OrderFulfillment } from "@prisma/client";
import {
  ShoppingBag,
  Search,
  Filter,
  Phone,
  Building2,
  Truck,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { OrderStatusSelector } from "./order-status-selector";
import { AdminPagination } from "./admin-pagination";
import { formatCurrency } from "@/lib/utils/format-currency";

export interface SerializedOrderItem {
  id: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
}

export interface SerializedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: OrderFulfillment;
  pickupBranchId: string | null;
  pickupBranchName: string | null;
  deliveryAddress: string | null;
  totalAmount: number;
  status: OrderStatus;
  paymentType: string;
  isPaid: boolean;
  createdAt: string; // ISO string
  items: SerializedOrderItem[];
}

interface OrdersListViewProps {
  orders: SerializedOrder[];
  branches: { id: string; name: string }[];
  isSuperAdmin: boolean;
  locale: string;
}

export function OrdersListView({
  orders,
  branches,
  isSuperAdmin,
  locale,
}: OrdersListViewProps) {
  const t = useTranslations("admin.ordersManagement");

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [selectedBranch, setSelectedBranch] = React.useState<string>("ALL");

  // Pagination state (default: 20 per page)
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const filteredOrders = React.useMemo(() => {
    return orders.filter((ord) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        ord.orderNumber.toLowerCase().includes(term) ||
        ord.customerName.toLowerCase().includes(term) ||
        ord.customerPhone.toLowerCase().includes(term);

      const matchesStatus =
        selectedStatus === "ALL" || ord.status === selectedStatus;

      const matchesBranch =
        selectedBranch === "ALL" || ord.pickupBranchId === selectedBranch;

      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [orders, searchTerm, selectedStatus, selectedBranch]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedBranch]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;

  const paginatedOrders = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder={t("orderNumber") + " / " + t("customer") + "..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Status Filter */}
        <div className="w-[160px]">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t("allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                {t("allStatuses")}
              </SelectItem>
              <SelectItem value={OrderStatus.PENDING} className="text-xs">
                {t("statusPending")}
              </SelectItem>
              <SelectItem value={OrderStatus.CONFIRMED} className="text-xs">
                {t("statusConfirmed")}
              </SelectItem>
              <SelectItem value={OrderStatus.SHIPPED} className="text-xs">
                {t("statusShipped")}
              </SelectItem>
              <SelectItem value={OrderStatus.DELIVERED} className="text-xs">
                {t("statusDelivered")}
              </SelectItem>
              <SelectItem value={OrderStatus.CANCELLED} className="text-xs">
                {t("statusCancelled")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Branch Filter (SuperAdmin only) */}
        {isSuperAdmin && (
          <div className="w-[180px]">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={t("filterByBranch")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  {t("allBranches")}
                </SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <ShoppingBag className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" aria-hidden="true" />
            <p className="font-medium text-foreground">{t("noOrdersFound")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">{t("orderNumber")}</TableHead>
                <TableHead className="text-xs">{t("customer")}</TableHead>
                <TableHead className="text-xs">{t("fulfillment")}</TableHead>
                <TableHead className="text-xs">{t("items")}</TableHead>
                <TableHead className="text-xs">{t("total")}</TableHead>
                <TableHead className="text-xs">{t("date")}</TableHead>
                <TableHead className="text-xs text-right">{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((ord) => (
                <TableRow key={ord.id} className="hover:bg-muted/30">
                  {/* Order Number */}
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {ord.orderNumber}
                  </TableCell>

                  {/* Customer Info */}
                  <TableCell className="text-xs font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">
                        {ord.customerName}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-muted-foreground/70 shrink-0" aria-hidden="true" />
                        <span>{ord.customerPhone}</span>
                      </span>
                    </div>
                  </TableCell>

                  {/* Fulfillment */}
                  <TableCell className="text-xs">
                    {ord.fulfillmentType === OrderFulfillment.PICKUP_FROM_BRANCH ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge
                          variant="outline"
                          className="w-fit text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-medium"
                        >
                          <Building2 className="w-3 h-3 mr-1" aria-hidden="true" />
                          <span>{t("deliveryPickup")}</span>
                        </Badge>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {ord.pickupBranchName || "-"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <Badge
                          variant="outline"
                          className="w-fit text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-medium"
                        >
                          <Truck className="w-3 h-3 mr-1" aria-hidden="true" />
                          <span>{t("deliveryCourier")}</span>
                        </Badge>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {ord.deliveryAddress || "-"}
                        </span>
                      </div>
                    )}
                  </TableCell>

                  {/* Order Items */}
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="space-y-0.5 max-w-[220px]">
                      {ord.items.map((item) => (
                        <div key={item.id} className="truncate text-[11px]">
                          <span className="text-foreground font-medium">
                            {item.quantity}x
                          </span>{" "}
                          <span>{item.variantName}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>

                  {/* Total */}
                  <TableCell className="text-xs font-bold font-mono">
                    {formatCurrency(ord.totalAmount)}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(ord.createdAt))}
                  </TableCell>

                  {/* Status Dropdown */}
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <OrderStatusSelector
                        orderId={ord.id}
                        currentStatus={ord.status}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {filteredOrders.length > 0 && (
          <div className="border-t border-border px-4 py-2">
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredOrders.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

