"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building2,
  Lock,
  AlertCircle,
  Check,
  Loader2,
  Pencil,
  KeyRound,
  Trash2,
  ChevronRight,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  createBranchAdminAction,
  updateBranchAdminAction,
  resetBranchAdminPasswordAction,
  deleteBranchAdminAction,
  type CreateBranchAdminInput,
} from "@/app/actions/admin-users";
import { AdminPagination } from "./admin-pagination";

export interface SerializedAdminUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  branchId?: string | null;
  branchName: string | null;
  isActive?: boolean;
  createdAt: string;
}

interface UsersListViewProps {
  users: SerializedAdminUser[];
  branches: { id: string; name: string }[];
  locale: string;
}

export function UsersListView({ users, branches, locale }: UsersListViewProps) {
  const t = useTranslations("admin.usersManagement");
  const router = useRouter();

  // Create User State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showCreatePassword, setShowCreatePassword] = React.useState(false);
  const [branchId, setBranchId] = React.useState(branches[0]?.id || "");

  // Edit User State
  const [editingUser, setEditingUser] = React.useState<SerializedAdminUser | null>(null);
  const [editUsername, setEditUsername] = React.useState("");
  const [editFullName, setEditFullName] = React.useState("");
  const [editBranchId, setEditBranchId] = React.useState<string | null>(null);
  const [editIsActive, setEditIsActive] = React.useState(true);

  // Reset Password State
  const [resetUser, setResetUser] = React.useState<SerializedAdminUser | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
  const [showResetPassword, setShowResetPassword] = React.useState(false);

  // Delete User State
  const [deletingUser, setDeletingUser] = React.useState<SerializedAdminUser | null>(null);

  // Mobile Bottom Sheet State
  const [selectedMobileUser, setSelectedMobileUser] = React.useState<SerializedAdminUser | null>(null);

  const [isPending, setIsPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Pagination state (default: 10 per page)
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = React.useMemo(() => {
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    return users.slice(startIndex, startIndex + pageSize);
  }, [users, currentPage, pageSize, totalPages]);

  const resetCreateForm = () => {
    setUsername("");
    setFullName("");
    setPassword("");
    setBranchId(branches[0]?.id || "");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim() || !fullName.trim() || !password || !branchId) {
      setErrorMessage(t("error"));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t("passwordPlaceholder"));
      return;
    }

    setIsPending(true);

    try {
      const payload: CreateBranchAdminInput = {
        username: username.trim(),
        fullName: fullName.trim(),
        password,
        branchId,
      };

      const result = await createBranchAdminAction(payload);

      if (!result.success) {
        if (result.error === "usernameTaken") {
          setErrorMessage(t("usernameTaken"));
        } else if (result.error === "branchNotFound") {
          setErrorMessage(t("branchNotFound"));
        } else if (result.error === "unauthorized") {
          setErrorMessage(t("unauthorized"));
        } else {
          setErrorMessage(t("error"));
        }
        setIsPending(false);
        return;
      }

      setSuccessMessage(t("successCreated"));
      setIsPending(false);
      resetCreateForm();
      setIsModalOpen(false);
      router.refresh();
    } catch {
      setErrorMessage(t("error"));
      setIsPending(false);
    }
  };

  const handleOpenEdit = (user: SerializedAdminUser) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditFullName(user.fullName);
    setEditBranchId(user.branchId || null);
    setEditIsActive(user.isActive !== false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setErrorMessage(null);

    setIsPending(true);
    try {
      const result = await updateBranchAdminAction({
        userId: editingUser.id,
        username: editUsername.trim(),
        fullName: editFullName.trim(),
        branchId: editBranchId,
        isActive: editIsActive,
      });

      if (!result.success) {
        if (result.error === "usernameTaken") {
          setErrorMessage(t("usernameTaken"));
        } else {
          setErrorMessage(result.error);
        }
        setIsPending(false);
        return;
      }

      setIsPending(false);
      setEditingUser(null);
      router.refresh();
    } catch {
      setErrorMessage(t("error"));
      setIsPending(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage(t("passwordPlaceholder"));
      return;
    }

    setIsPending(true);
    try {
      const result = await resetBranchAdminPasswordAction({
        userId: resetUser.id,
        newPassword,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        setIsPending(false);
        return;
      }

      setIsPending(false);
      setResetUser(null);
      setNewPassword("");
      router.refresh();
    } catch {
      setErrorMessage(t("error"));
      setIsPending(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setErrorMessage(null);

    setIsPending(true);
    try {
      const result = await deleteBranchAdminAction({
        userId: deletingUser.id,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        setIsPending(false);
        return;
      }

      setIsPending(false);
      setDeletingUser(null);
      router.refresh();
    } catch {
      setErrorMessage(t("error"));
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2.5 py-1 gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span>{t("totalUsers", { count: users.length })}</span>
          </Badge>
        </div>

        <Button
          onClick={() => {
            resetCreateForm();
            setIsModalOpen(true);
          }}
          size="sm"
          className="text-xs gap-1.5 h-9 font-medium"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          <span>{t("createUserBtn")}</span>
        </Button>
      </div>

      {/* Empty State */}
      {users.length === 0 ? (
        <div className="rounded-xl border border-border/80 bg-card flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <Users className="w-10 h-10 mb-2 stroke-[1.2] opacity-40" aria-hidden="true" />
          <p className="text-xs">{t("noUsers")}</p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (hidden on mobile, visible on md and up) */}
          <div className="hidden md:block rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-xs font-semibold text-center">№</TableHead>
                  <TableHead className="text-xs font-semibold">{t("tableHeadUser")}</TableHead>
                  <TableHead className="text-xs font-semibold">{t("tableHeadRole")}</TableHead>
                  <TableHead className="text-xs font-semibold">{t("tableHeadBranch")}</TableHead>
                  <TableHead className="text-xs font-semibold">{t("tableHeadStatus")}</TableHead>
                  <TableHead className="text-xs font-semibold text-right">{t("tableHeadCreated")}</TableHead>
                  <TableHead className="text-xs font-semibold text-right">{t("tableHeadActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((u, index) => (
                  <TableRow key={u.id} className="hover:bg-muted/20">
                    <TableCell className="w-12 text-xs font-mono text-muted-foreground text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">
                          {u.fullName}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          @{u.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.role === "SUPER_ADMIN" ? (
                        <Badge variant="default" className="text-[10px] px-2 py-0.5 gap-1 font-medium bg-amber-500 hover:bg-amber-600 text-white">
                          <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                          <span>{t("roleSuperAdmin")}</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 gap-1 font-medium">
                          <Building2 className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                          <span>{t("roleBranchAdmin")}</span>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.branchName || t("allBranchesScope")}
                    </TableCell>
                    <TableCell>
                      {u.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                          <span>{t("statusActive")}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" aria-hidden="true" />
                          <span>{t("statusInactive")}</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground text-right">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "short",
                      }).format(new Date(u.createdAt))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title={t("actionEdit")}
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>

                        {/* Reset Password Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setResetUser(u);
                            setNewPassword("");
                            setErrorMessage(null);
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title={t("actionResetPassword")}
                        >
                          <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>

                        {/* Delete Button (disabled for Super Admin) */}
                        {u.role !== "SUPER_ADMIN" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingUser(u);
                              setErrorMessage(null);
                            }}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title={t("actionDelete")}
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* MOBILE LIST VIEW (visible on mobile, hidden on md and up) */}
          <div className="block md:hidden space-y-2">
            {paginatedUsers.map((u, index) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedMobileUser(u)}
                className="w-full text-left p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/30 active:bg-muted/50 transition-colors shadow-2xs flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-semibold text-muted-foreground w-5 text-center shrink-0">
                    {(currentPage - 1) * pageSize + index + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold text-xs">
                    {u.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {u.fullName}
                      </span>
                      {u.isActive !== false ? (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title={t("statusActive")} />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" title={t("statusInactive")} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      @{u.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {u.role === "SUPER_ADMIN" ? (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0.5 bg-amber-500 text-white font-medium">
                      <ShieldCheck className="w-2.5 h-2.5 mr-0.5 inline" />
                      {t("roleSuperAdmin")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-medium max-w-[110px] truncate">
                      {u.branchName || t("allBranchesScope")}
                    </Badge>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {users.length > 0 && (
            <div className="rounded-xl border border-border/80 bg-card p-3 shadow-2xs">
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={users.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </>
      )}

      {/* MOBILE BOTTOM SHEET (ACTION DRAWER) */}
      <Dialog
        open={selectedMobileUser !== null}
        onOpenChange={(open) => !open && setSelectedMobileUser(null)}
      >
        <DialogContent className="fixed inset-x-0 bottom-0 top-auto translate-y-0 rounded-t-3xl rounded-b-none border-t border-border/80 bg-background p-6 shadow-2xl max-h-[85vh] overflow-y-auto sm:max-w-none sm:rounded-t-3xl">
          <DialogHeader className="text-left pb-2 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-bold text-foreground truncate">
                  {selectedMobileUser?.fullName}
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-muted-foreground truncate">
                  @{selectedMobileUser?.username}
                </DialogDescription>
              </div>
              <div className="shrink-0 flex items-center gap-1.5">
                {selectedMobileUser?.role === "SUPER_ADMIN" ? (
                  <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-amber-500 text-white font-medium">
                    <ShieldCheck className="w-3 h-3 mr-1 inline" />
                    {t("roleSuperAdmin")}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
                    <Building2 className="w-3 h-3 mr-1 inline text-muted-foreground" />
                    {t("roleBranchAdmin")}
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-border/60 my-2">
            <div className="p-2.5 rounded-lg bg-muted/30 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {t("tableHeadBranch")}
              </span>
              <p className="text-xs font-semibold text-foreground truncate">
                {selectedMobileUser?.branchName || t("allBranchesScope")}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/30 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t("tableHeadCreated")}
              </span>
              <p className="text-xs font-semibold text-foreground">
                {selectedMobileUser?.createdAt &&
                  new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                    new Date(selectedMobileUser.createdAt)
                  )}
              </p>
            </div>

            <div className="col-span-2 p-2.5 rounded-lg bg-muted/30 flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {t("tableHeadStatus")}
              </span>
              {selectedMobileUser?.isActive !== false ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {t("statusActive")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                  {t("statusInactive")}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {/* Edit Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const user = selectedMobileUser;
                setSelectedMobileUser(null);
                if (user) handleOpenEdit(user);
              }}
              className="w-full h-11 text-xs font-medium justify-start gap-2.5 px-4"
            >
              <Pencil className="w-4 h-4 text-primary" />
              <span>{t("actionEdit")}</span>
            </Button>

            {/* Reset Password Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const user = selectedMobileUser;
                setSelectedMobileUser(null);
                if (user) {
                  setResetUser(user);
                  setNewPassword("");
                  setErrorMessage(null);
                }
              }}
              className="w-full h-11 text-xs font-medium justify-start gap-2.5 px-4"
            >
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>{t("actionResetPassword")}</span>
            </Button>

            {/* Delete Button (disabled for Super Admin) */}
            {selectedMobileUser?.role !== "SUPER_ADMIN" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const user = selectedMobileUser;
                  setSelectedMobileUser(null);
                  if (user) {
                    setDeletingUser(user);
                    setErrorMessage(null);
                  }
                }}
                className="w-full h-11 text-xs font-medium justify-start gap-2.5 px-4 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t("actionDelete")}</span>
              </Button>
            )}

            {/* Close Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelectedMobileUser(null)}
              className="w-full h-10 text-xs text-muted-foreground mt-2"
            >
              {t("close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <UserPlus className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{t("modalTitle")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("modalSubtitle")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 pt-1">
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

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("username")} *
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("usernamePlaceholder")}
                className="text-base sm:text-xs h-9 font-mono"
                required
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("fullName")} *
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("fullNamePlaceholder")}
                className="text-base sm:text-xs h-9"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{t("password")} *</span>
              </label>
              <div className="relative">
                <Input
                  type={showCreatePassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className="text-base sm:text-xs h-9 font-mono pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                  aria-label={showCreatePassword ? "Hide password" : "Show password"}
                >
                  {showCreatePassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Branch Assignment */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{t("branchSelect")} *</span>
              </label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="text-base sm:text-xs h-9">
                  <SelectValue placeholder={t("selectBranchPlaceholder")} />
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

            <DialogFooter className="pt-2 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="h-10 sm:h-9 text-xs w-full sm:w-auto"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="h-10 sm:h-9 text-xs gap-1.5 w-full sm:w-auto"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>{t("creating")}</span>
                  </>
                ) : (
                  <span>{t("createUserBtn")}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Pencil className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{t("editModalTitle")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("editModalSubtitle", { username: editingUser?.username || "" })}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateUser} className="space-y-4 pt-1">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("username")} *
              </label>
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="text-base sm:text-xs h-9 font-mono"
                required
                minLength={3}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("fullName")} *
              </label>
              <Input
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="text-base sm:text-xs h-9"
                required
              />
            </div>

            {editingUser?.role !== "SUPER_ADMIN" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>{t("branchLabel")}</span>
                  </label>
                  <Select value={editBranchId || ""} onValueChange={(val) => setEditBranchId(val || null)}>
                    <SelectTrigger className="text-base sm:text-xs h-9">
                      <SelectValue placeholder={t("selectBranchPlaceholder")} />
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

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    {t("activityStatus")}
                  </label>
                  <Select
                    value={editIsActive ? "active" : "inactive"}
                    onValueChange={(val) => setEditIsActive(val === "active")}
                  >
                    <SelectTrigger className="text-base sm:text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active" className="text-xs text-emerald-600">
                        {t("statusActive")}
                      </SelectItem>
                      <SelectItem value="inactive" className="text-xs text-muted-foreground">
                        {t("statusInactive")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <DialogFooter className="pt-2 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(null)}
                disabled={isPending}
                className="h-10 sm:h-9 text-xs w-full sm:w-auto"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="h-10 sm:h-9 text-xs w-full sm:w-auto"
              >
                {isPending ? t("saving") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={resetUser !== null} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <KeyRound className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{t("resetPasswordModalTitle")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("resetPasswordModalSubtitle", { username: resetUser?.username || "" })}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 pt-1">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("newPasswordLabel")} *
              </label>
              <div className="relative">
                <Input
                  type={showResetPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("newPasswordPlaceholder")}
                  className="text-base sm:text-xs h-9 font-mono pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                  aria-label={showResetPassword ? "Hide password" : "Show password"}
                >
                  {showResetPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setResetUser(null)}
                disabled={isPending}
                className="h-10 sm:h-9 text-xs w-full sm:w-auto"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="h-10 sm:h-9 text-xs w-full sm:w-auto"
              >
                {isPending ? t("resettingPassword") : t("resetPasswordBtn")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deletingUser !== null} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-destructive">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>{t("deleteModalTitle")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("deleteModalSubtitle", { username: deletingUser?.username || "", fullName: deletingUser?.fullName || "" })}
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingUser(null)}
              disabled={isPending}
              className="h-10 sm:h-9 text-xs w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteUser}
              disabled={isPending}
              className="h-10 sm:h-9 text-xs w-full sm:w-auto"
            >
              {isPending ? t("deleting") : t("deleteBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
