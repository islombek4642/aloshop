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
  type CreateBranchAdminInput,
} from "@/app/actions/admin-users";

export interface SerializedAdminUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  branchName: string | null;
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

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [branchId, setBranchId] = React.useState(branches[0]?.id || "");

  const [isPending, setIsPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const resetForm = () => {
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

      const res = await createBranchAdminAction(payload);

      if (!res.success) {
        if (res.error === "usernameTaken") {
          setErrorMessage(t("usernameTaken"));
        } else {
          setErrorMessage(t("error"));
        }
        setIsPending(false);
        return;
      }

      setSuccessMessage(t("success"));
      router.refresh();

      setTimeout(() => {
        setIsPending(false);
        setIsModalOpen(false);
        resetForm();
      }, 900);
    } catch {
      setErrorMessage(t("error"));
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {t("users")} ({users.length})
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="gap-1.5 text-xs h-9 shrink-0"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          <span>{t("createNewUser")}</span>
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        {users.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" aria-hidden="true" />
            <p className="font-medium text-foreground">{t("noUsers")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">{t("username")}</TableHead>
                <TableHead className="text-xs">{t("fullName")}</TableHead>
                <TableHead className="text-xs">{t("role")}</TableHead>
                <TableHead className="text-xs">{t("assignedBranch")}</TableHead>
                <TableHead className="text-xs text-right">{t("created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    @{u.username}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {u.fullName}
                  </TableCell>
                  <TableCell className="text-xs">
                    {u.role === "SUPER_ADMIN" ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0 border-primary/30 bg-primary/10 text-primary font-medium"
                      >
                        <ShieldCheck className="w-3 h-3 mr-1" aria-hidden="true" />
                        <span>{t("roleSuperAdmin")}</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-2 py-0 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-medium"
                      >
                        <Building2 className="w-3 h-3 mr-1" aria-hidden="true" />
                        <span>{t("roleBranchAdmin")}</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.branchName || t("allBranchesScope")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground text-right">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "short",
                    }).format(new Date(u.createdAt))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

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
                className="text-xs h-9 font-mono"
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
                className="text-xs h-9"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{t("password")} *</span>
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="text-xs h-9 font-mono"
                required
              />
            </div>

            {/* Branch Assignment */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{t("branchSelect")} *</span>
              </label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="text-xs h-9">
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

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="text-xs"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs gap-1.5"
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
    </div>
  );
}

