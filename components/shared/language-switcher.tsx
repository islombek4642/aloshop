"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe, Check } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_SHORT_LABELS,
  isLocale,
  type Locale,
} from "@/lib/constants/locales";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

export interface LanguageSwitcherProps {
  className?: string;
  variant?: "select" | "inline";
}

export function LanguageSwitcher({
  className,
  variant = "select",
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const tLabels = useTranslations("common.labels");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const handleLocaleChange = (nextLocale: string) => {
    if (isLocale(nextLocale) && nextLocale !== locale) {
      startTransition(() => {
        router.replace(pathname, { locale: nextLocale });
      });
    }
  };

  if (variant === "inline") {
    return (
      <div
        role="group"
        aria-label={tLabels("switchLanguage")}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border p-1 bg-background",
          className
        )}
      >
        <Globe
          className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-0.5"
          aria-hidden="true"
        />
        {LOCALES.map((cur) => {
          const isActive = cur === locale;
          return (
            <button
              key={cur}
              type="button"
              disabled={isPending}
              onClick={() => handleLocaleChange(cur)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-pressed={isActive}
            >
              {LOCALE_SHORT_LABELS[cur]}
              {isActive && <Check className="h-3 w-3" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center", className)}>
      <Select
        value={locale}
        onValueChange={handleLocaleChange}
        disabled={isPending}
      >
        <SelectTrigger
          className="h-9 w-auto min-w-[78px] sm:min-w-[145px] gap-1.5 sm:gap-2 text-xs font-medium border-border/80 bg-background px-2 sm:px-3"
          aria-label={tLabels("switchLanguage")}
        >
          <Globe
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <SelectValue
            aria-label={LOCALE_LABELS[locale as Locale] ?? locale}
            placeholder={LOCALE_LABELS[locale as Locale] ?? locale}
          >
            <span className="sm:hidden font-mono uppercase text-xs font-semibold">
              {LOCALE_SHORT_LABELS[locale as Locale] ?? locale.toUpperCase()}
            </span>
            <span className="hidden sm:inline font-medium">
              {LOCALE_LABELS[locale as Locale] ?? locale}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[145px]">
          {LOCALES.map((cur) => (
            <SelectItem
              key={cur}
              value={cur}
              className="text-xs cursor-pointer"
            >
              <span>{LOCALE_LABELS[cur]}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default LanguageSwitcher;
