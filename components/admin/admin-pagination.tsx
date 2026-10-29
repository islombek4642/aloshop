"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

export interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function AdminPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
}: AdminPaginationProps) {
  const t = useTranslations("admin.pagination");

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const from = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const to = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate pagination page numbers
  const pageNumbers = React.useMemo(() => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    const pages: (number | "dots")[] = [];

    if (safeCurrentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push("dots");
      pages.push(safeTotalPages);
    } else if (safeCurrentPage >= safeTotalPages - 3) {
      pages.push(1);
      pages.push("dots");
      for (let i = safeTotalPages - 4; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push("dots");
      pages.push(safeCurrentPage - 1);
      pages.push(safeCurrentPage);
      pages.push(safeCurrentPage + 1);
      pages.push("dots");
      pages.push(safeTotalPages);
    }

    return pages;
  }, [safeCurrentPage, safeTotalPages]);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 text-xs text-muted-foreground",
        className
      )}
    >
      {/* Items count summary & Page size selector */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="font-medium">
          {t("showing", { total: totalItems, from, to })}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">{t("perPage")}:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-[76px] px-2.5 text-xs">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 gap-1 text-xs"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          aria-label={t("prev")}
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("prev")}</span>
        </Button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) => {
            if (page === "dots") {
              return (
                <span
                  key={`dots-${idx}`}
                  className="px-2 py-1 text-xs text-muted-foreground select-none"
                >
                  &hellip;
                </span>
              );
            }

            const isCurrent = page === safeCurrentPage;
            return (
              <Button
                key={page}
                variant={isCurrent ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 min-w-[32px] px-2 text-xs font-medium font-mono",
                  isCurrent && "pointer-events-none"
                )}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 gap-1 text-xs"
          disabled={safeCurrentPage >= safeTotalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          aria-label={t("next")}
        >
          <span className="hidden sm:inline">{t("next")}</span>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
