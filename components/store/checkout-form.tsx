"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Store,
  Truck,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Smartphone,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useCart, type CartItem } from "@/lib/store/use-cart";
import { createOrderAction } from "@/app/actions/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils/format-currency";
import { cn } from "@/lib/utils/cn";

export interface BranchOption {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
}

export interface CheckoutFormProps {
  branches: BranchOption[];
  directItem?: CartItem | null;
}

export function CheckoutForm({ branches, directItem }: CheckoutFormProps) {
  const tCheckout = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tCommon = useTranslations("common");
  const tProduct = useTranslations("product");
  const router = useRouter();

  const cartItems = useCart((state) => state.items);
  const clearCart = useCart((state) => state.clearCart);
  const getTotalPrice = useCart((state) => state.getTotalPrice);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine items to checkout: direct 1-click item or cart items
  const items = React.useMemo(() => {
    if (directItem) return [directItem];
    return cartItems;
  }, [directItem, cartItems]);

  // Form State
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("+998 ");
  const [fulfillmentType, setFulfillmentType] = React.useState<
    "PICKUP_FROM_BRANCH" | "DELIVERY"
  >("PICKUP_FROM_BRANCH");
  const [pickupBranchId, setPickupBranchId] = React.useState<string>(
    branches[0]?.id || ""
  );
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [paymentType, setPaymentType] = React.useState<
    "PAY_AT_BRANCH" | "CASH_ON_DELIVERY" | "CARD_ON_DELIVERY"
  >("PAY_AT_BRANCH");
  const [notes, setNotes] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");

  // UI status
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  );
  const [successOrderNumber, setSuccessOrderNumber] = React.useState<
    string | null
  >(null);

  // Sync default payment type when fulfillment changes
  React.useEffect(() => {
    if (fulfillmentType === "PICKUP_FROM_BRANCH") {
      setPaymentType("PAY_AT_BRANCH");
    } else {
      setPaymentType("CASH_ON_DELIVERY");
    }
  }, [fulfillmentType]);

  const totalAmount = React.useMemo(() => {
    if (directItem) {
      return directItem.price * directItem.quantity;
    }
    return getTotalPrice();
  }, [directItem, getTotalPrice]);

  // Clean phone input handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val.startsWith("+998")) {
      setCustomerPhone("+998 ");
      return;
    }
    setCustomerPhone(val);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Client-side quick checks
    const errors: Record<string, string> = {};
    if (!customerName.trim() || customerName.trim().length < 2) {
      errors.customerName = tCheckout("validation.fullNameRequired");
    }

    const cleanDigits = customerPhone.replace(/[^\d]/g, "");
    if (cleanDigits.length !== 12 || !cleanDigits.startsWith("998")) {
      errors.customerPhone = tCheckout("validation.phoneInvalid");
    }

    if (
      fulfillmentType === "PICKUP_FROM_BRANCH" &&
      (!pickupBranchId || pickupBranchId.trim().length === 0)
    ) {
      errors.pickupBranchId = tCheckout("validation.branchRequired");
    }

    if (
      fulfillmentType === "DELIVERY" &&
      (!deliveryAddress.trim() || deliveryAddress.trim().length < 3)
    ) {
      errors.deliveryAddress = tCheckout("validation.addressRequired");
    }

    if (items.length === 0) {
      errors.items = tCheckout("emptyCartWarning");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createOrderAction({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        fulfillmentType,
        pickupBranchId:
          fulfillmentType === "PICKUP_FROM_BRANCH" ? pickupBranchId : null,
        deliveryAddress:
          fulfillmentType === "DELIVERY" ? deliveryAddress.trim() : null,
        paymentType,
        notes: notes.trim() || null,
        honeypot: honeypot || null,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      });

      if (!response.success) {
        // Resolve error message
        let msg = tCheckout("errorGeneric");
        if (response.error === "rateLimitExceeded") {
          msg = tCheckout("validation.rateLimitExceeded");
        } else if (response.error === "spamDetected") {
          msg = tCheckout("validation.spamDetected");
        } else if (response.error === "branchRequired") {
          msg = tCheckout("validation.branchRequired");
        } else if (response.error === "addressRequired") {
          msg = tCheckout("validation.addressRequired");
        } else if (response.error === "insufficientBranchStock") {
          msg = tCheckout("validation.insufficientBranchStock");
        } else if (response.error === "outOfStockDelivery") {
          msg = tCheckout("validation.outOfStockDelivery");
        } else if (response.error) {
          msg = response.error;
        }
        setErrorMessage(msg);
      } else {
        // Success
        setSuccessOrderNumber(response.orderNumber);
        if (!directItem) {
          clearCart();
        }
      }
    } catch (err) {
      console.error("Order submit exception:", err);
      setErrorMessage(tCheckout("errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-muted/30 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // If cart is empty and no direct item
  if (items.length === 0 && !successOrderNumber) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
          <Smartphone className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            {tCart("emptyTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {tCheckout("emptyCartWarning")}
          </p>
        </div>
        <Button asChild size="lg" className="h-10 px-6 font-semibold">
          <Link href="/catalog">
            <span>{tCart("continueShopping")}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Anti-spam Honeypot field (hidden from legitimate users) */}
        <div
          aria-hidden="true"
          className="opacity-0 absolute -left-[9999px] top-0 pointer-events-none"
        >
          <label htmlFor="website_url">Website</label>
          <input
            id="website_url"
            name="website_url"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs sm:text-sm font-medium leading-relaxed">
              <span className="font-bold block">{tCheckout("errorTitle")}</span>
              {errorMessage}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Customer & Delivery Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Contact Information Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-foreground">
                {tCheckout("fastCheckout")}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="customerName"
                    className="text-xs font-semibold text-foreground"
                  >
                    {tCheckout("fullName")}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="customerName"
                    name="customerName"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (fieldErrors.customerName) {
                        setFieldErrors((prev) => ({ ...prev, customerName: "" }));
                      }
                    }}
                    placeholder={tCheckout("fullNamePlaceholder")}
                    className={cn(
                      "h-10 text-base sm:text-sm",
                      fieldErrors.customerName && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {fieldErrors.customerName && (
                    <p className="text-[11px] text-destructive">
                      {fieldErrors.customerName}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="customerPhone"
                    className="text-xs font-semibold text-foreground"
                  >
                    {tCheckout("phone")}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => {
                      handlePhoneChange(e);
                      if (fieldErrors.customerPhone) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          customerPhone: "",
                        }));
                      }
                    }}
                    placeholder={tCheckout("phonePlaceholder")}
                    className={cn(
                      "h-10 text-base sm:text-sm tabular-nums",
                      fieldErrors.customerPhone && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {fieldErrors.customerPhone && (
                    <p className="text-[11px] text-destructive">
                      {fieldErrors.customerPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Fulfillment Selector (Branch vs Delivery) */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">
                  {tCheckout("deliveryType")}
                </h2>
                <Badge
                  variant="success"
                  className="text-[11px] font-semibold px-2 py-0.5"
                >
                  {tCart("free")}
                </Badge>
              </div>

              {/* Fulfillment Toggle Tabs */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentType("PICKUP_FROM_BRANCH")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border text-center transition-all",
                    fulfillmentType === "PICKUP_FROM_BRANCH"
                      ? "border-primary bg-primary/5 text-primary font-bold shadow-2xs"
                      : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <Store className="h-5 w-5" aria-hidden="true" />
                  <span className="text-xs">{tCheckout("pickup")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType("DELIVERY")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border text-center transition-all",
                    fulfillmentType === "DELIVERY"
                      ? "border-primary bg-primary/5 text-primary font-bold shadow-2xs"
                      : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <Truck className="h-5 w-5" aria-hidden="true" />
                  <span className="text-xs">{tCheckout("delivery")}</span>
                </button>
              </div>

              {/* Conditional: Branch Selector */}
              {fulfillmentType === "PICKUP_FROM_BRANCH" && (
                <div className="space-y-3 pt-2">
                  <label
                    htmlFor="pickupBranchSelect"
                    className="text-xs font-semibold text-foreground block"
                  >
                    {tCheckout("pickupBranch")}{" "}
                    <span className="text-destructive">*</span>
                  </label>

                  <div className="space-y-2">
                    {branches.map((b) => {
                      const isSelected = pickupBranchId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setPickupBranchId(b.id)}
                          role="radio"
                          aria-checked={isSelected}
                          className={cn(
                            "w-full text-left flex items-start justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-2xs"
                              : "border-border/70 bg-muted/10 hover:border-border hover:bg-muted/20"
                          )}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-xs font-bold",
                                  isSelected
                                    ? "text-primary"
                                    : "text-foreground"
                                )}
                              >
                                {b.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                • {b.city}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {b.address}
                            </p>
                            <p className="text-[10px] text-muted-foreground/80">
                              {b.workingHours}
                            </p>
                          </div>

                          <div
                            className={cn(
                              "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40"
                            )}
                          >
                            {isSelected && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrors.pickupBranchId && (
                    <p className="text-[11px] text-destructive">
                      {fieldErrors.pickupBranchId}
                    </p>
                  )}
                </div>
              )}

              {/* Conditional: Delivery Address Input */}
              {fulfillmentType === "DELIVERY" && (
                <div className="space-y-1.5 pt-2">
                  <label
                    htmlFor="deliveryAddress"
                    className="text-xs font-semibold text-foreground"
                  >
                    {tCheckout("address")}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="deliveryAddress"
                    name="deliveryAddress"
                    required
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      if (fieldErrors.deliveryAddress) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          deliveryAddress: "",
                        }));
                      }
                    }}
                    placeholder={tCheckout("addressPlaceholder")}
                    className={cn(
                      "h-10 text-base sm:text-sm",
                      fieldErrors.deliveryAddress && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {fieldErrors.deliveryAddress && (
                    <p className="text-[11px] text-destructive">
                      {fieldErrors.deliveryAddress}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground pt-1">
                    {tCheckout("deliveryFreeNotice")}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Payment Method Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-foreground">
                {tCheckout("paymentMethod")}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fulfillmentType === "PICKUP_FROM_BRANCH" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPaymentType("PAY_AT_BRANCH")}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                        paymentType === "PAY_AT_BRANCH"
                          ? "border-primary bg-primary/5 text-foreground font-semibold shadow-2xs"
                          : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Banknote className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="text-xs">
                        {tCheckout("paymentBranch")}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentType("CARD_ON_DELIVERY")}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                        paymentType === "CARD_ON_DELIVERY"
                          ? "border-primary bg-primary/5 text-foreground font-semibold shadow-2xs"
                          : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <CreditCard className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="text-xs">
                        {tCheckout("paymentCard")}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setPaymentType("CASH_ON_DELIVERY")}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                        paymentType === "CASH_ON_DELIVERY"
                          ? "border-primary bg-primary/5 text-foreground font-semibold shadow-2xs"
                          : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Banknote className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="text-xs">
                        {tCheckout("paymentCash")}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentType("CARD_ON_DELIVERY")}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                        paymentType === "CARD_ON_DELIVERY"
                          ? "border-primary bg-primary/5 text-foreground font-semibold shadow-2xs"
                          : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <CreditCard className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="text-xs">
                        {tCheckout("paymentCard")}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 4. Notes (Optional) */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-2">
              <label
                htmlFor="orderNotes"
                className="text-xs font-semibold text-foreground block"
              >
                {tCheckout("notes")}
              </label>
              <Textarea
                id="orderNotes"
                name="orderNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tCheckout("notesPlaceholder")}
                className="text-base sm:text-xs resize-none h-20"
              />
            </div>
          </div>

          {/* Right Column: Order Summary & Confirmation CTA */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <h2 className="text-base font-bold text-foreground">
                  {tCheckout("orderSummary")}
                </h2>
                <Badge variant="outline" className="text-xs font-semibold">
                  {tCheckout("itemsInOrder", { count: items.length })}
                </Badge>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative h-12 w-12 shrink-0 rounded-lg bg-muted/40 border border-border/40 overflow-hidden flex items-center justify-center">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={`${item.brand} ${item.modelName}`}
                            fill
                            sizes="48px"
                            className="object-contain p-1"
                          />
                        ) : (
                          <Smartphone
                            className="h-5 w-5 text-muted-foreground/40"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">
                          {item.brand} {item.modelName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.storage} • {item.colorName} • {item.quantity} {tCommon("labels.pcs")}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-bold text-foreground tabular-nums shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2.5 border-t border-border/60 pt-4 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{tCart("subtotal")}</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{tCart("delivery")}</span>
                  <Badge
                    variant="success"
                    className="text-[10px] font-semibold px-2 py-0"
                  >
                    {tCart("free")}
                  </Badge>
                </div>

                <div className="border-t border-border/60 pt-3 flex items-baseline justify-between text-base">
                  <span className="font-bold text-foreground">
                    {tCart("total")}
                  </span>
                  <span className="text-xl font-black text-foreground tabular-nums">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* CTA Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || items.length === 0}
                className="w-full h-12 text-sm font-bold gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>{tCheckout("submitting")}</span>
                  </>
                ) : (
                  <>
                    <span>{tCheckout("submitOrder")}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>

              <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                {tCheckout("directOrderNotice")}
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Order Success Dialog */}
      <Dialog
        open={!!successOrderNumber}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessOrderNumber(null);
            router.push("/catalog");
          }
        }}
      >
        <DialogContent className="max-w-md p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-2">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>

          <DialogHeader className="space-y-2 text-center">
            <DialogTitle className="text-xl font-extrabold text-foreground text-center">
              {tCheckout("orderSuccessTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground text-center">
              {tCheckout("orderSuccessDescription")}
            </DialogDescription>
          </DialogHeader>

          {successOrderNumber && (
            <div className="my-4 rounded-xl border border-primary/20 bg-primary/5 py-3 px-4">
              <span className="text-xs text-muted-foreground block mb-0.5">
                {tCommon("labels.status")}: {tCommon("states.success")}
              </span>
              <span className="text-base sm:text-lg font-black tracking-wider text-primary">
                {tCheckout("orderNumber", { orderNumber: successOrderNumber })}
              </span>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="button"
              className="w-full h-10 text-xs font-semibold"
              onClick={() => {
                setSuccessOrderNumber(null);
                router.push("/catalog");
              }}
            >
              {tCheckout("backToCatalog")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
