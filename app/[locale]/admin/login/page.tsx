"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ShieldCheck, User, Lock, LogIn, Loader2, AlertCircle } from "lucide-react";
import { loginAdminAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export default function AdminLoginPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;

    setIsPending(true);
    setErrorMessage(null);

    try {
      const res = await loginAdminAction({ username, password });
      if (res.success) {
        router.push(`/${locale}/admin/dashboard`);
        router.refresh();
      } else {
        setIsPending(false);
        const errKey = res.error || "loginErrorInvalid";
        setErrorMessage(
          errKey === "loginErrorRateLimit"
            ? t("loginErrorRateLimit")
            : t("loginErrorInvalid")
        );
      }
    } catch {
      setIsPending(false);
      setErrorMessage(t("loginErrorInvalid"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Bar with Language Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <LanguageSwitcher variant="select" />
      </div>

      <div className="w-full max-w-md">
        {/* Branding & Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            AloShop
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {t("title")}
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-border/80">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold tracking-tight">
              {t("loginTitle")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("loginSubtitle")}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-username"
                  className="text-xs font-medium text-foreground block"
                >
                  {t("username")}
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="admin-username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t("usernamePlaceholder")}
                    className="pl-9 text-sm"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password"
                  className="text-xs font-medium text-foreground block"
                >
                  {t("password")}
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="admin-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("passwordPlaceholder")}
                    className="pl-9 text-sm"
                    disabled={isPending}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full gap-2 font-medium"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>{t("loggingIn")}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    <span>{t("submitLogin")}</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
