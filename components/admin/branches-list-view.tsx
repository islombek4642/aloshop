"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  Plus,
  Pencil,
  CheckCircle2,
  XCircle,
  Users,
  Boxes,
  Search,
  Loader2,
  Power,
  ShoppingBag,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createBranchAction,
  updateBranchAction,
  toggleBranchStatusAction,
} from "@/app/actions/admin-branches";

export interface BranchListItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  isActive: boolean;
  staffCount: number;
  totalInventory: number;
  totalVariants: number;
  ordersCount: number;
  createdAt: string;
}

interface BranchesListViewProps {
  branches: BranchListItem[];
  isSuperAdmin: boolean;
  locale: string;
}

export function BranchesListView({
  branches,
  isSuperAdmin,
  locale,
}: BranchesListViewProps) {
  const t = useTranslations("admin.branchesManagement");
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBranch, setEditingBranch] = React.useState<BranchListItem | null>(null);

  // Form Fields
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("Toshkent");
  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [workingHours, setWorkingHours] = React.useState("09:00 - 20:00");
  const [isActive, setIsActive] = React.useState(true);

  // Status & Notifications
  const [isPending, setIsPending] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const openCreateModal = () => {
    setEditingBranch(null);
    setName("");
    setCity("Toshkent");
    setAddress("");
    setPhone("+998 ");
    setWorkingHours("09:00 - 20:00");
    setIsActive(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (branch: BranchListItem) => {
    setEditingBranch(branch);
    setName(branch.name);
    setCity(branch.city);
    setAddress(branch.address);
    setPhone(branch.phone);
    setWorkingHours(branch.workingHours);
    setIsActive(branch.isActive);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim() || !address.trim() || !phone.trim() || !workingHours.trim()) {
      setErrorMessage(t("errorGeneric"));
      return;
    }

    setIsPending(true);

    try {
      if (editingBranch) {
        const result = await updateBranchAction({
          id: editingBranch.id,
          name: name.trim(),
          city: city.trim(),
          address: address.trim(),
          phone: phone.trim(),
          workingHours: workingHours.trim(),
          isActive,
        });

        if (!result.success) {
          setErrorMessage(t("errorGeneric"));
          setIsPending(false);
          return;
        }

        setSuccessMessage(t("updateSuccess"));
      } else {
        const result = await createBranchAction({
          name: name.trim(),
          city: city.trim(),
          address: address.trim(),
          phone: phone.trim(),
          workingHours: workingHours.trim(),
          isActive,
        });

        if (!result.success) {
          setErrorMessage(t("errorGeneric"));
          setIsPending(false);
          return;
        }

        setSuccessMessage(t("createSuccess"));
      }

      setIsPending(false);
      setTimeout(() => {
        setIsModalOpen(false);
        router.refresh();
      }, 700);
    } catch {
      setErrorMessage(t("errorGeneric"));
      setIsPending(false);
    }
  };

  const handleToggleStatus = async (branch: BranchListItem) => {
    if (!isSuperAdmin) return;

    setTogglingId(branch.id);
    try {
      const result = await toggleBranchStatusAction({
        id: branch.id,
        isActive: !branch.isActive,
      });

      if (result.success) {
        router.refresh();
      }
    } catch (err) {
      console.error("toggle error:", err);
    } finally {
      setTogglingId(null);
    }
  };

  // Filtered branches
  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (statusFilter === "active") return b.isActive;
    if (statusFilter === "inactive") return !b.isActive;
    return true;
  });

  // Aggregated Stats
  const totalBranchesCount = branches.length;
  const activeBranchesCount = branches.filter((b) => b.isActive).length;
  const totalStaffCount = branches.reduce((sum, b) => sum + b.staffCount, 0);
  const totalStockCount = branches.reduce((sum, b) => sum + b.totalInventory, 0);

  return (
    <div className="space-y-6">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/60 bg-card shadow-xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              {t("totalBranches")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {totalBranchesCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              {t("activeBranches")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {activeBranchesCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              {t("totalStaff")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {totalStaffCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              {t("totalInventory")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Boxes className="w-4 h-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {totalStockCount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar: Search, Status Filter & Create Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border border-border/60 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9 h-10 text-xs rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="flex items-center rounded-lg border border-border p-1 bg-muted/40">
            <Button
              type="button"
              variant={statusFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="h-8 text-xs px-2.5"
            >
              {t("filterAll")}
            </Button>
            <Button
              type="button"
              variant={statusFilter === "active" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("active")}
              className="h-8 text-xs px-2.5"
            >
              {t("filterActive")}
            </Button>
            <Button
              type="button"
              variant={statusFilter === "inactive" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("inactive")}
              className="h-8 text-xs px-2.5"
            >
              {t("filterInactive")}
            </Button>
          </div>

          {/* Create Branch Button (SuperAdmin only) */}
          {isSuperAdmin && (
            <Button
              onClick={openCreateModal}
              size="sm"
              className="h-10 text-xs font-semibold gap-1.5 rounded-lg shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t("newBranch")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Non-SuperAdmin notice */}
      {!isSuperAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t("superAdminOnlyNotice")}</span>
        </div>
      )}

      {/* Branches Grid */}
      {filteredBranches.length === 0 ? (
        <Card className="border-dashed border-border/80 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <Building2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {t("noBranchesFound")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {t("noBranchesDesc")}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => {
            const isToggling = togglingId === branch.id;

            return (
              <Card
                key={branch.id}
                className="flex flex-col justify-between border-border/70 bg-card hover:border-border transition-all shadow-xs"
              >
                <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                          {branch.name}
                        </CardTitle>
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {branch.city}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={
                        branch.isActive
                          ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-medium shrink-0 gap-1"
                          : "border-muted-foreground/30 bg-muted/50 text-muted-foreground text-[10px] font-medium shrink-0 gap-1"
                      }
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          branch.isActive ? "bg-emerald-500" : "bg-muted-foreground"
                        }`}
                      />
                      <span>
                        {branch.isActive ? t("statusActive") : t("statusInactive")}
                      </span>
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed pt-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{branch.address}</span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0 space-y-3 pb-3 sm:pb-3 text-xs">
                  {/* Phone & Working Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <a
                        href={`tel:${branch.phone.replace(/\s+/g, "")}`}
                        className="text-[11px] font-medium text-foreground hover:text-primary transition-colors truncate"
                      >
                        {branch.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[11px] font-medium text-foreground truncate">
                        {branch.workingHours}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="rounded-lg bg-card border border-border/50 p-2">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                        <Users className="w-3 h-3 text-blue-500" />
                      </div>
                      <div className="text-xs font-bold text-foreground">
                        {branch.staffCount}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {t("totalStaff")}
                      </div>
                    </div>

                    <div className="rounded-lg bg-card border border-border/50 p-2">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                        <Boxes className="w-3 h-3 text-amber-500" />
                      </div>
                      <div className="text-xs font-bold text-foreground">
                        {branch.totalInventory}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {t("totalInventory")}
                      </div>
                    </div>

                    <div className="rounded-lg bg-card border border-border/50 p-2">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                        <ShoppingBag className="w-3 h-3 text-primary" />
                      </div>
                      <div className="text-xs font-bold text-foreground">
                        {branch.ordersCount}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {t("ordersCount", { count: branch.ordersCount })}
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Card Actions (SuperAdmin only) */}
                {isSuperAdmin && (
                  <div className="p-4 sm:p-5 pt-3 sm:pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(branch)}
                      className="h-8 text-xs font-medium gap-1.5 rounded-lg flex-1"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t("edit")}</span>
                    </Button>

                    <Button
                      variant={branch.isActive ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => handleToggleStatus(branch)}
                      disabled={isToggling}
                      className={`h-8 text-xs font-medium gap-1.5 rounded-lg flex-1 ${
                        branch.isActive
                          ? "hover:border-destructive/40 hover:text-destructive text-muted-foreground"
                          : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Power className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>
                        {branch.isActive ? t("deactivate") : t("activate")}
                      </span>
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>{editingBranch ? t("editBranch") : t("newBranch")}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("subtitle")}
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 mt-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive">
                <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 p-3 mt-3 text-xs rounded-lg border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="space-y-3.5 py-4">
              {/* Branch Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  {t("branchName")} *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* City */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  {t("city")} *
                </label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("cityPlaceholder")}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  {t("address")} *
                </label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("addressPlaceholder")}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  {t("phone")} *
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("phonePlaceholder")}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Working Hours */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  {t("workingHours")} *
                </label>
                <Input
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder={t("workingHoursPlaceholder")}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Status Toggle in Form */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t("status")}
                </label>
                <div
                  onClick={() => setIsActive(!isActive)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer select-none transition-colors ${
                    isActive
                      ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-border bg-muted/40"
                  }`}
                >
                  <div className="pt-0.5">
                    <div
                      className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-colors ${
                        isActive
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-border bg-background"
                      }`}
                    >
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">
                      {isActive ? t("statusActive") : t("statusInactive")}
                    </span>
                    <span className="text-[11px] text-muted-foreground block leading-tight">
                      {isActive ? t("statusActiveDesc") : t("statusInactiveDesc")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-9 text-xs"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="h-9 text-xs font-semibold min-w-24 gap-1.5"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isPending ? t("saving") : t("save")}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
