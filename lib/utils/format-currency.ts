export type CurrencyInput =
  | number
  | string
  | { toString(): string }
  | null
  | undefined;

export interface FormatCurrencyOptions {
  currency?: string;
  showCurrency?: boolean;
  decimals?: number;
}

/**
 * Formats a numeric or Decimal currency value with space digit grouping.
 * E.g. 14850000 -> "14 850 000 so'm"
 */
export function formatCurrency(
  value: CurrencyInput,
  optionsOrCurrency?: string | FormatCurrencyOptions
): string {
  const options: FormatCurrencyOptions =
    typeof optionsOrCurrency === "string"
      ? { currency: optionsOrCurrency }
      : optionsOrCurrency ?? {};

  const currency = options.currency ?? "so'm";
  const showCurrency = options.showCurrency ?? true;

  if (value === null || value === undefined) {
    return showCurrency && currency ? `0 ${currency}`.trim() : "0";
  }

  let rawStr = typeof value === "number" ? value.toString() : value.toString().trim();
  if (!rawStr || isNaN(Number(rawStr))) {
    return showCurrency && currency ? `0 ${currency}`.trim() : "0";
  }

  const isNegative = rawStr.startsWith("-");
  if (isNegative) {
    rawStr = rawStr.slice(1);
  }

  const parts = rawStr.split(".");
  let integerPart = parts[0] || "0";
  let decimalPart = parts[1];

  if (options.decimals !== undefined) {
    const num = Number(`${isNegative ? "-" : ""}${rawStr}`);
    const fixed = num.toFixed(options.decimals);
    const fixedParts = (isNegative ? fixed.slice(1) : fixed).split(".");
    integerPart = fixedParts[0] || "0";
    decimalPart = fixedParts[1];
  }

  // Format integer digits with spaces every 3 digits
  const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  let result = isNegative ? `-${formattedInt}` : formattedInt;
  if (decimalPart && decimalPart.length > 0 && options.decimals !== 0) {
    result += `.${decimalPart}`;
  }

  if (showCurrency && currency) {
    return `${result} ${currency}`.trim();
  }

  return result;
}
