"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Cpu, Monitor, Camera, BatteryCharging, Zap, Smartphone, KeyRound, Activity, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductEditorState } from "./types";

interface SpecsSectionProps {
  state: ProductEditorState;
  onChange: (fields: Partial<ProductEditorState>) => void;
}

export function SpecsSection({ state, onChange }: SpecsSectionProps) {
  const t = useTranslations("admin.productCreate");
  const isUsed = state.condition === "USED";

  return (
    <Card className="border-border/70 bg-card shadow-2xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{t("sectionSpecs")}</span>
          </div>
          {isUsed && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/20">
              {t("conditionUsed")}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Conditional USED Device Highlights (IMEI, Battery Health, Grade) */}
        {isUsed && (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Ishlatilgan (B/U) qurilma identifikatorlari</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* IMEI */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  <span>{t("imeiNumber")} *</span>
                </Label>
                <Input
                  value={state.imei}
                  maxLength={15}
                  onChange={(e) => onChange({ imei: e.target.value.replace(/[^0-9]/g, "") })}
                  placeholder={t("imeiPlaceholder")}
                  className="h-11 sm:h-9 text-base sm:text-xs font-mono"
                  required={!state.isDraft}
                />
              </div>

              {/* Battery Health % */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  <span>{t("batteryHealth")} (%)</span>
                </Label>
                <Input
                  type="number"
                  min={50}
                  max={100}
                  value={state.batteryHealth ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : null;
                    onChange({ batteryHealth: val });
                  }}
                  placeholder="85%"
                  className="h-11 sm:h-9 text-base sm:text-xs font-mono"
                />
              </div>

              {/* Grade */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Tashqi holati
                </Label>
                <Select
                  value={state.usedConditionGrade || "A"}
                  onValueChange={(val) => onChange({ usedConditionGrade: val })}
                >
                  <SelectTrigger className="h-11 sm:h-9 text-base sm:text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+" className="text-xs">A+ (Ideal / Yangi kabi)</SelectItem>
                    <SelectItem value="A" className="text-xs">A (Yaxshi, mayda izlar)</SelectItem>
                    <SelectItem value="B" className="text-xs">B (Ko'rinadigan chizilganlar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Standard Hardware Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Processor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{t("cpuLabel")}</span>
            </Label>
            <Input
              value={state.processor}
              onChange={(e) => onChange({ processor: e.target.value })}
              placeholder="Apple A18 Pro (3nm)"
              className="h-11 sm:h-9 text-base sm:text-xs"
            />
          </div>

          {/* Screen Size & Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{t("screenLabel")}</span>
            </Label>
            <Input
              value={state.screenSize}
              onChange={(e) => onChange({ screenSize: e.target.value })}
              placeholder='6.3" Super Retina XDR 120Hz'
              className="h-11 sm:h-9 text-base sm:text-xs"
            />
          </div>

          {/* Camera */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{t("cameraLabel")}</span>
            </Label>
            <Input
              value={state.camera}
              onChange={(e) => onChange({ camera: e.target.value })}
              placeholder="48MP + 48MP + 12MP"
              className="h-11 sm:h-9 text-base sm:text-xs"
            />
          </div>

          {/* Battery */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{t("batteryLabel")}</span>
            </Label>
            <Input
              value={state.battery}
              onChange={(e) => onChange({ battery: e.target.value })}
              placeholder="4422 mAh"
              className="h-11 sm:h-9 text-base sm:text-xs"
            />
          </div>

          {/* Charging */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{t("chargingLabel")}</span>
            </Label>
            <Input
              value={state.charging}
              onChange={(e) => onChange({ charging: e.target.value })}
              placeholder="25W MagSafe, USB-C"
              className="h-11 sm:h-9 text-base sm:text-xs"
            />
          </div>

          {/* Operating System */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{t("osLabel")}</span>
            </Label>
            <Input
              value={state.os}
              onChange={(e) => onChange({ os: e.target.value })}
              placeholder="iOS 18"
              className="h-11 sm:h-9 text-base sm:text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

