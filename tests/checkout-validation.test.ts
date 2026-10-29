import {
  checkoutSchema,
  cleanUzPhone,
  isValidUzPhone,
  type CheckoutInput,
} from "../lib/validations/checkout";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log("Starting checkout-validation unit tests...\n");

  // 1. Phone validation tests
  assert(isValidUzPhone("+998 90 123 45 67"), "Formatted UZ phone should be valid");
  assert(isValidUzPhone("+998901234567"), "Compact UZ phone should be valid");
  assert(isValidUzPhone("+998-93-555-44-33"), "Hyphenated UZ phone should be valid");
  assert(!isValidUzPhone("+1234567890"), "Non-UZ phone must be invalid");
  assert(!isValidUzPhone("+99812"), "Short UZ phone must be invalid");
  assert(!isValidUzPhone("998901234567"), "Phone without leading + must be invalid");
  assert(!isValidUzPhone(""), "Empty phone must be invalid");
  assert(cleanUzPhone("+998 90 123 45 67") === "+998901234567", "cleanUzPhone should strip spaces");
  console.log("  + Phone validation and cleaning passed");

  // Base valid payload
  const baseValidPickup: CheckoutInput = {
    customerName: "Ali Valiyev",
    customerPhone: "+998 90 123 45 67",
    fulfillmentType: "PICKUP_FROM_BRANCH",
    pickupBranchId: "branch-malika-01",
    deliveryAddress: null,
    paymentType: "PAY_AT_BRANCH",
    notes: "I will pick up at 18:00",
    honeypot: "",
    items: [
      {
        variantId: "variant-ip15p-256-titan",
        quantity: 1,
        unitPrice: 14850000,
      },
    ],
  };

  // 2. Valid pickup order
  const pickupRes = checkoutSchema.safeParse(baseValidPickup);
  assert(pickupRes.success, `Expected pickup order to be valid, got: ${JSON.stringify(pickupRes)}`);
  console.log("  + Valid pickup order parsed successfully");

  // 3. Valid delivery order
  const validDelivery: CheckoutInput = {
    ...baseValidPickup,
    fulfillmentType: "DELIVERY",
    pickupBranchId: null,
    deliveryAddress: "Toshkent sh., Yunusobod tumani, 4-mavze, 12-uy",
    paymentType: "CASH_ON_DELIVERY",
  };
  const deliveryRes = checkoutSchema.safeParse(validDelivery);
  assert(deliveryRes.success, `Expected delivery order to be valid, got: ${JSON.stringify(deliveryRes)}`);
  console.log("  + Valid delivery order parsed successfully");

  // 4. Missing pickupBranchId for PICKUP_FROM_BRANCH
  const invalidPickup = {
    ...baseValidPickup,
    pickupBranchId: "",
  };
  const invalidPickupRes = checkoutSchema.safeParse(invalidPickup);
  assert(!invalidPickupRes.success, "Pickup order without branch must fail");
  if (!invalidPickupRes.success) {
    const branchIssue = invalidPickupRes.error.issues.find(
      (i) => i.path.includes("pickupBranchId")
    );
    assert(!!branchIssue, "Should produce issue for pickupBranchId");
    assert(branchIssue.message === "branchRequired", "Should have branchRequired message");
  }
  console.log("  + Conditional pickupBranchId requirement passed");

  // 5. Missing deliveryAddress for DELIVERY
  const invalidDelivery = {
    ...validDelivery,
    deliveryAddress: "   ",
  };
  const invalidDeliveryRes = checkoutSchema.safeParse(invalidDelivery);
  assert(!invalidDeliveryRes.success, "Delivery order without address must fail");
  if (!invalidDeliveryRes.success) {
    const addrIssue = invalidDeliveryRes.error.issues.find(
      (i) => i.path.includes("deliveryAddress")
    );
    assert(!!addrIssue, "Should produce issue for deliveryAddress");
    assert(addrIssue.message === "addressRequired", "Should have addressRequired message");
  }
  console.log("  + Conditional deliveryAddress requirement passed");

  // 6. Invalid phone
  const invalidPhoneOrder = {
    ...baseValidPickup,
    customerPhone: "+12345678",
  };
  const invalidPhoneRes = checkoutSchema.safeParse(invalidPhoneOrder);
  assert(!invalidPhoneRes.success, "Order with non-UZ phone must fail");
  console.log("  + Invalid phone order rejected passed");

  // 7. Empty items array
  const emptyItemsOrder = {
    ...baseValidPickup,
    items: [],
  };
  const emptyItemsRes = checkoutSchema.safeParse(emptyItemsOrder);
  assert(!emptyItemsRes.success, "Order with 0 items must fail");
  console.log("  + Empty items rejection passed");

  // 8. Invalid item quantity (<= 0)
  const zeroQtyOrder = {
    ...baseValidPickup,
    items: [
      {
        variantId: "v1",
        quantity: 0,
        unitPrice: 1000000,
      },
    ],
  };
  const zeroQtyRes = checkoutSchema.safeParse(zeroQtyOrder);
  assert(!zeroQtyRes.success, "Item with 0 quantity must fail");
  console.log("  + Zero item quantity rejection passed");

  // 9. Negative price
  const negPriceOrder = {
    ...baseValidPickup,
    items: [
      {
        variantId: "v1",
        quantity: 1,
        unitPrice: -500,
      },
    ],
  };
  const negPriceRes = checkoutSchema.safeParse(negPriceOrder);
  assert(!negPriceRes.success, "Negative item price must fail");
  console.log("  + Negative price rejection passed");

  // 10. Short customer name (< 2 chars)
  const shortNameOrder = {
    ...baseValidPickup,
    customerName: "A",
  };
  const shortNameRes = checkoutSchema.safeParse(shortNameOrder);
  assert(!shortNameRes.success, "Short customer name must fail");
  console.log("  + Short customer name rejection passed");

  // 11. Honeypot anti-spam trigger
  const spamOrder = {
    ...baseValidPickup,
    honeypot: "bot-filled-secret-field",
  };
  const spamRes = checkoutSchema.safeParse(spamOrder);
  assert(!spamRes.success, "Honeypot filled order must fail");
  if (!spamRes.success) {
    const spamIssue = spamRes.error.issues.find(
      (i) => i.path.includes("honeypot")
    );
    assert(!!spamIssue, "Should produce issue for honeypot");
    assert(spamIssue.message === "spamDetected", "Should report spamDetected");
  }
  console.log("  + Honeypot anti-spam verification passed");

  console.log("\nAll checkout-validation tests PASSED successfully!\n");
}

runTests();
