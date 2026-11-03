export interface SuggestedPrice {
  price: number;
  oldPrice: number | null;
}

/**
 * Estimates realistic retail market prices in UZS based on brand, model name, and storage tier.
 * Pure utility function safe for both client-side UI presets and server-side actions/seeding.
 */
export function getSuggestedPriceForModel(
  brand: string,
  modelName: string,
  storage: string
): SuggestedPrice {
  const b = brand.trim().toLowerCase();
  const m = modelName.trim().toLowerCase();
  const s = storage.trim().toLowerCase();

  let basePrice = 12000000;

  if (b.includes("apple")) {
    if (m.includes("18 pro max")) basePrice = 21000000;
    else if (m.includes("18 pro")) basePrice = 18500000;
    else if (m.includes("17 pro max")) basePrice = 19500000;
    else if (m.includes("17 pro")) basePrice = 17500000;
    else if (m.includes("17")) basePrice = 13500000;
    else if (m.includes("16 pro max")) basePrice = 18200000;
    else if (m.includes("16 pro")) basePrice = 16200000;
    else if (m.includes("16 plus")) basePrice = 13200000;
    else if (m.includes("16")) basePrice = 11800000;
    else if (m.includes("15 pro max")) basePrice = 15800000;
    else if (m.includes("15 pro")) basePrice = 13800000;
    else if (m.includes("15 plus")) basePrice = 11800000;
    else if (m.includes("15")) basePrice = 10400000;
    else if (m.includes("14 pro max")) basePrice = 13500000;
    else if (m.includes("14 pro")) basePrice = 12000000;
    else if (m.includes("14 plus")) basePrice = 10200000;
    else if (m.includes("14")) basePrice = 9200000;
    else if (m.includes("13 pro max")) basePrice = 11500000;
    else if (m.includes("13 pro")) basePrice = 10200000;
    else if (m.includes("13 mini")) basePrice = 7800000;
    else if (m.includes("13")) basePrice = 8200000;
    else if (m.includes("se")) basePrice = 5800000;
  } else if (b.includes("samsung")) {
    if (m.includes("s26 ultra")) basePrice = 18500000;
    else if (m.includes("s26+")) basePrice = 15500000;
    else if (m.includes("s26 fe")) basePrice = 8500000;
    else if (m.includes("s26")) basePrice = 12500000;
    else if (m.includes("s25 ultra")) basePrice = 16800000;
    else if (m.includes("s25+")) basePrice = 14200000;
    else if (m.includes("s25 fe")) basePrice = 8500000;
    else if (m.includes("s25")) basePrice = 11200000;
    else if (m.includes("fe")) basePrice = 8500000;
    else if (m.includes("a57") || m.includes("a56")) basePrice = 5200000;
    else if (m.includes("a37") || m.includes("a36")) basePrice = 4100000;
    else if (m.includes("a27") || m.includes("a26")) basePrice = 3200000;
    else if (m.includes("a18") || m.includes("a17")) basePrice = 2400000;
    else if (m.includes("a08") || m.includes("a07")) basePrice = 1600000;
  }

  let multiplier = 1;
  if (s.includes("256")) multiplier = 1.1;
  else if (s.includes("512")) multiplier = 1.25;
  else if (s.includes("1tb") || s.includes("1 tb")) multiplier = 1.45;
  else if (s.includes("2tb") || s.includes("2 tb")) multiplier = 1.7;

  const finalPrice = Math.round((basePrice * multiplier) / 10000) * 10000;
  const hasDiscount = finalPrice % 200000 === 0;
  const oldPrice = hasDiscount ? finalPrice + 800000 : null;

  return { price: finalPrice, oldPrice };
}
