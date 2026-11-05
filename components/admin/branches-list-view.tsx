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
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Boxes,
  Search,
  Loader2,
  Power,
  ShoppingBag,
  ShieldAlert,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { formatCurrency } from "@/lib/utils/format-currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  deleteBranchAction,
} from "@/app/actions/admin-branches";
import { isValidUzPhone } from "@/lib/utils/phone";

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
  assignedAdmin?: {
    id: string;
    fullName: string;
    username: string;
  } | null;
}

export interface AvailableAdminItem {
  id: string;
  fullName: string;
  username: string;
  branchId: string | null;
}

interface BranchesListViewProps {
  branches: BranchListItem[];
  availableAdmins?: AvailableAdminItem[];
  todaySalesTotal?: number;
  topBranchName?: string;
  isSuperAdmin: boolean;
  locale: string;
}

export function BranchesListView({
  branches,
  availableAdmins = [],
  todaySalesTotal = 0,
  topBranchName = "-",
  isSuperAdmin,
  locale,
}: BranchesListViewProps) {
  const t = useTranslations("admin.branchesManagement");
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBranch, setEditingBranch] = React.useState<BranchListItem | null>(null);

  // Mobile Bottom Sheet state
  const [selectedMobileBranch, setSelectedMobileBranch] = React.useState<BranchListItem | null>(null);

  // Delete Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [branchToDelete, setBranchToDelete] = React.useState<BranchListItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Form Fields
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("Toshkent");
  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [workingHours, setWorkingHours] = React.useState("09:00 - 20:00");
  const [isActive, setIsActive] = React.useState(true);
  const [assignedAdminId, setAssignedAdminId] = React.useState<string | null>(null);

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
    setAssignedAdminId(null);
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
    setAssignedAdminId(branch.assignedAdmin?.id || null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const openDeleteDialog = (branch: BranchListItem) => {
    setBranchToDelete(branch);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim() || !address.trim() || !phone.trim() || !workingHours.trim()) {
      setErrorMessage(t("errorGeneric"));
      return;
    }

    if (!isValidUzPhone(phone.trim())) {
      setErrorMessage(t("errorPhoneInvalid"));
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
          assignedAdminId,
        });

        if (!result.success) {
          if (result.error === "phoneInvalid") {
            setErrorMessage(t("errorPhoneInvalid"));
          } else if (result.error === "unauthorized") {
            setErrorMessage(t("superAdminOnlyNotice"));
          } else {
            setErrorMessage(t("errorGeneric"));
          }
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
          assignedAdminId,
        });

        if (!result.success) {
          if (result.error === "phoneInvalid") {
            setErrorMessage(t("errorPhoneInvalid"));
          } else if (result.error === "unauthorized") {
            setErrorMessage(t("superAdminOnlyNotice"));
          } else {
            setErrorMessage(t("errorGeneric"));
          }
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

  const handleDeleteBranch = async () => {
    if (!branchToDelete || !isSuperAdmin) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteBranchAction({ id: branchToDelete.id });
      if (!result.success) {
        if (result.error === "hasOrders") {
          setDeleteError(t("cannotDeleteWithOrders"));
        } else if (result.error === "hasActiveStock") {
          setDeleteError(t("cannotDeleteWithActiveStock") || "Filialda faol tovar qoldig'i mavjud. O'chirishdan oldin tovarlarni boshqa filialga o'tkazing.");
        } else if (result.error === "unauthorized") {
          setDeleteError(t("superAdminOnlyNotice"));
        } else {
          setDeleteError(t("errorGeneric"));
        }
        setIsDeleting(false);
        return;
      }

      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setBranchToDelete(null);
      router.refresh();
    } catch {
      setDeleteError(t("errorGeneric"));
      setIsDeleting(false);
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
      {/* Top Stats Overview (4 KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Branches */}
        <Card className="border-border/70 bg-card shadow-2xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              {t("totalBranches")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {totalBranchesCount}
            </div>
          </CardContent>
        </Card>

        {/* Active Branches */}
        <Card className="border-border/70 bg-card shadow-2xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              {t("activeBranches")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {activeBranchesCount}
            </div>
          </CardContent>
        </Card>

        {/* Today's Sales */}
        <Card className="border-border/70 bg-card shadow-2xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              {t("todaySales")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-mono truncate">
              {formatCurrency(todaySalesTotal)}
            </div>
          </CardContent>
        </Card>

        {/* Top Active Branch */}
        <Card className="border-border/70 bg-card shadow-2xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              {t("topBranch")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {topBranchName}
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
            className="pl-9 h-10 text-base sm:text-xs rounded-lg"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
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
        <>
          {/* DESKTOP 3-COLUMN VISUAL GRID (hidden on mobile, visible on md+) */}
          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredBranches.map((branch) => {
              const isToggling = togglingId === branch.id;

              return (
                <Card
                  key={branch.id}
                  className="flex flex-col justify-between border-border/70 bg-card hover:border-border transition-all shadow-2xs hover:shadow-xs rounded-xl overflow-hidden"
                >
                  <CardHeader className="p-5 pb-3 space-y-3">
                    {/* Header: Name, City, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base font-bold text-foreground truncate">
                            {branch.name}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] font-medium mt-0.5">
                            {branch.city}
                          </Badge>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={
                          branch.isActive
                            ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-medium shrink-0 gap-1.5"
                            : "border-muted-foreground/30 bg-muted/50 text-muted-foreground text-[10px] font-medium shrink-0 gap-1.5"
                        }
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            branch.isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                          }`}
                        />
                        <span>
                          {branch.isActive ? t("statusActive") : t("statusInactive")}
                        </span>
                      </Badge>
                    </div>

                    {/* Responsible Branch Admin Section */}
                    <div className="rounded-lg bg-muted/30 p-2.5 border border-border/50 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {branch.assignedAdmin
                            ? branch.assignedAdmin.fullName.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {branch.assignedAdmin
                              ? branch.assignedAdmin.fullName
                              : t("noAssignedAdmin")}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground truncate">
                            {branch.assignedAdmin
                              ? `@${branch.assignedAdmin.username}`
                              : t("responsibleAdmin")}
                          </p>
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(branch)}
                          className="h-7 px-2 text-[11px] text-primary hover:text-primary shrink-0"
                        >
                          {t("edit")}
                        </Button>
                      )}
                    </div>

                    {/* Address & Working Hours */}
                    <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{branch.address}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <a
                            href={`tel:${branch.phone.replace(/\s+/g, "")}`}
                            className="font-medium text-foreground hover:text-primary transition-colors truncate"
                          >
                            {branch.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{branch.workingHours}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4">
                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border/50">
                      <div className="rounded-lg bg-card border border-border/50 p-2">
                        <div className="text-sm font-bold text-foreground font-mono">
                          {branch.totalInventory}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {t("totalInventory")}
                        </div>
                      </div>

                      <div className="rounded-lg bg-card border border-border/50 p-2">
                        <div className="text-sm font-bold text-foreground font-mono">
                          {branch.ordersCount}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {t("ordersCount", { count: branch.ordersCount })}
                        </div>
                      </div>

                      <div className="rounded-lg bg-card border border-border/50 p-2">
                        <div className="text-sm font-bold text-foreground font-mono">
                          {branch.staffCount}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {t("totalStaff")}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isSuperAdmin && (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <Link
                          href={`/admin/inventory?branchId=${branch.id}`}
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-9 text-xs font-medium gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/40"
                          >
                            <Boxes className="w-3.5 h-3.5 text-primary" />
                            <span>{t("goToInventory")}</span>
                          </Button>
                        </Link>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(branch)}
                          className="h-9 px-3 text-xs"
                          title={t("edit")}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(branch)}
                          disabled={isToggling}
                          className={`h-9 px-3 text-xs ${
                            branch.isActive
                              ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          }`}
                          title={branch.isActive ? t("deactivate") : t("activate")}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(branch)}
                          className="h-9 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                          title={t("delete")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* MOBILE LIST VIEW (visible on mobile, hidden on md+) */}
          <div className="block md:hidden space-y-2.5">
            {filteredBranches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedMobileBranch(branch)}
                className="w-full text-left p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/30 active:bg-muted/50 transition-colors shadow-2xs flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {branch.name}
                      </span>
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          branch.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {branch.city} &bull; {branch.assignedAdmin?.fullName || t("noAssignedAdmin")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] font-mono font-bold">
                    {branch.totalInventory} ta
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                </div>
              </button>
            ))}
          </div>

          {/* Floating Action Button (FAB) for mobile */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="fixed bottom-6 right-6 z-40 sm:hidden h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label={t("newBranch")}
            >
              <Plus className="w-6 h-6" />
            </button>
          )}

          {/* MOBILE BOTTOM SHEET (ACTION DRAWER) */}
          <Dialog
            open={selectedMobileBranch !== null}
            onOpenChange={(open) => !open && setSelectedMobileBranch(null)}
          >
            <DialogContent className="fixed inset-x-0 bottom-0 top-auto translate-y-0 rounded-t-3xl rounded-b-none border-t border-border/80 bg-background p-6 shadow-2xl max-h-[85vh] overflow-y-auto sm:max-w-none sm:rounded-t-3xl">
              <DialogHeader className="text-left pb-2 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-lg font-bold text-foreground truncate">
                      {selectedMobileBranch?.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{selectedMobileBranch?.city} &bull; {selectedMobileBranch?.address}</span>
                    </DialogDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      selectedMobileBranch?.isActive
                        ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-medium shrink-0 gap-1"
                        : "border-muted-foreground/30 bg-muted/50 text-muted-foreground text-[10px] font-medium shrink-0 gap-1"
                    }
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedMobileBranch?.isActive ? "bg-emerald-500" : "bg-muted-foreground"
                      }`}
                    />
                    <span>
                      {selectedMobileBranch?.isActive ? t("statusActive") : t("statusInactive")}
                    </span>
                  </Badge>
                </div>
              </DialogHeader>

              {/* Details & Metrics in Bottom Sheet */}
              <div className="space-y-4 py-2 text-xs">
                {/* Responsible Admin Card */}
                <div className="rounded-xl border border-border/70 bg-card p-3 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {selectedMobileBranch?.assignedAdmin
                        ? selectedMobileBranch.assignedAdmin.fullName.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {t("responsibleAdmin")}
                      </span>
                      <p className="text-xs font-semibold text-foreground truncate">
                        {selectedMobileBranch?.assignedAdmin
                          ? selectedMobileBranch.assignedAdmin.fullName
                          : t("noAssignedAdmin")}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">
                        {selectedMobileBranch?.assignedAdmin
                          ? `@${selectedMobileBranch.assignedAdmin.username}`
                          : "-"}
                      </p>
                    </div>
                  </div>
                  {selectedMobileBranch?.phone && (
                    <a
                      href={`tel:${selectedMobileBranch.phone.replace(/\s+/g, "")}`}
                      className="h-9 px-3 rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground flex items-center gap-1.5 text-xs font-medium shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>{t("callBranch")}</span>
                    </a>
                  )}
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-muted/30 border border-border/50 p-2.5">
                    <div className="text-base font-bold text-foreground font-mono">
                      {selectedMobileBranch?.totalInventory}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {t("totalInventory")}
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/30 border border-border/50 p-2.5">
                    <div className="text-base font-bold text-foreground font-mono">
                      {selectedMobileBranch?.ordersCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {t("ordersCount", { count: selectedMobileBranch?.ordersCount || 0 })}
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/30 border border-border/50 p-2.5">
                    <div className="text-base font-bold text-foreground font-mono">
                      {selectedMobileBranch?.staffCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {t("totalStaff")}
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/40 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    {t("workingHours")}:{" "}
                    <strong className="text-foreground font-medium">
                      {selectedMobileBranch?.workingHours}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons in Bottom Sheet */}
              <div className="space-y-2 pt-2">
                {/* Go to Inventory */}
                {selectedMobileBranch && (
                  <Link
                    href={`/admin/inventory?branchId=${selectedMobileBranch.id}`}
                    onClick={() => setSelectedMobileBranch(null)}
                    className="w-full block"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 text-xs font-medium justify-start gap-2.5 px-4 hover:bg-primary/5 hover:text-primary hover:border-primary/40"
                    >
                      <Boxes className="w-4 h-4 text-primary" />
                      <span>{t("goToInventory")}</span>
                    </Button>
                  </Link>
                )}

                {/* Edit Branch */}
                {isSuperAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const b = selectedMobileBranch;
                      setSelectedMobileBranch(null);
                      if (b) openEditModal(b);
                    }}
                    className="w-full h-11 text-xs font-medium justify-start gap-2.5 px-4"
                  >
                    <Pencil className="w-4 h-4 text-primary" />
                    <span>{t("edit")}</span>
                  </Button>
                )}

                {/* Toggle Status */}
                {isSuperAdmin && selectedMobileBranch && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const b = selectedMobileBranch;
                      setSelectedMobileBranch(null);
                      if (b) handleToggleStatus(b);
                    }}
                    className={`w-full h-11 text-xs font-medium justify-start gap-2.5 px-4 ${
                      selectedMobileBranch.isActive
                        ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>
                      {selectedMobileBranch.isActive ? t("deactivate") : t("activate")}
                    </span>
                  </Button>
                )}

                {/* Delete Branch */}
                {isSuperAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const b = selectedMobileBranch;
                      setSelectedMobileBranch(null);
                      if (b) openDeleteDialog(b);
                    }}
                    className="w-full h-11 text-xs font-medium justify-start gap-2.5 px-4 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t("delete")}</span>
                  </Button>
                )}

                {/* Close Button */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedMobileBranch(null)}
                  className="w-full h-10 text-xs text-muted-foreground mt-2"
                >
                  {t("close")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
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
                  className="h-9 text-base sm:text-xs"
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
                  className="h-9 text-base sm:text-xs"
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
                  className="h-9 text-base sm:text-xs"
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
                  className="h-9 text-base sm:text-xs"
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
                  className="h-9 text-base sm:text-xs"
                  required
                />
              </div>

              {/* Responsible Admin */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                  <span>{t("responsibleAdmin")}</span>
                </label>
                <Select
                  value={assignedAdminId || "unassigned"}
                  onValueChange={(val) => setAssignedAdminId(val === "unassigned" ? null : val)}
                >
                  <SelectTrigger className="h-9 text-base sm:text-xs">
                    <SelectValue placeholder={t("selectAdminPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned" className="text-xs text-muted-foreground">
                      {t("unassignedOption")}
                    </SelectItem>
                    {availableAdmins.map((adm) => (
                      <SelectItem key={adm.id} value={adm.id} className="text-xs">
                        {adm.fullName} (@{adm.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <DialogFooter className="gap-2 sm:gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-10 sm:h-9 w-full sm:w-auto text-xs"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="h-10 sm:h-9 w-full sm:w-auto text-xs font-semibold min-w-24 gap-1.5"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isPending ? t("saving") : t("save")}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t("deleteConfirmTitle")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              {t("deleteConfirmDescription")}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive">
              <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{deleteError}</span>
            </div>
          )}

          {branchToDelete && (
            <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs space-y-1">
              <div className="font-semibold text-foreground">
                {branchToDelete.name} ({branchToDelete.city})
              </div>
              <div className="text-muted-foreground">
                {branchToDelete.address}
              </div>
              {branchToDelete.ordersCount > 0 && (
                <div className="text-amber-600 dark:text-amber-400 font-medium pt-1">
                  {t("cannotDeleteWithOrders")}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-10 sm:h-9 w-full sm:w-auto text-xs"
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteBranch}
              disabled={isDeleting || (branchToDelete ? branchToDelete.ordersCount > 0 : false)}
              className="h-10 sm:h-9 w-full sm:w-auto text-xs font-semibold min-w-24 gap-1.5"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{t("delete")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
