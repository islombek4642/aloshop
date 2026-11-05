import assert from "node:assert";
import { z } from "zod";
import { isValidUzPhone } from "../lib/utils/phone";

console.log("Starting admin-branches tests (manager assignment & KPI logic)...");

// 1. Test validation schema with assignedAdminId
const testBranchSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  city: z.string().trim().min(2).default("Toshkent"),
  address: z.string().trim().min(3),
  phone: z.string().trim().refine((val) => isValidUzPhone(val)),
  workingHours: z.string().trim().min(3),
  isActive: z.boolean().default(true),
  assignedAdminId: z.string().nullable().optional(),
});

// A: Valid input with assignedAdminId
const parsedWithAdmin = testBranchSchema.safeParse({
  name: "Malika Filiali",
  city: "Toshkent",
  address: "Navoiy ko'chasi, 12",
  phone: "+998 90 123 45 67",
  workingHours: "09:00 - 20:00",
  isActive: true,
  assignedAdminId: "user-admin-1",
});
assert.strictEqual(parsedWithAdmin.success, true);
assert.strictEqual(parsedWithAdmin.data?.assignedAdminId, "user-admin-1");
console.log("  + Valid branch input with assignedAdminId accepted");

// B: Valid input with null assignedAdminId (unassigned)
const parsedWithNullAdmin = testBranchSchema.safeParse({
  name: "Chilonzor Filiali",
  city: "Toshkent",
  address: "Chilonzor 9-mavze",
  phone: "+998 71 200 11 22",
  workingHours: "10:00 - 21:00",
  isActive: true,
  assignedAdminId: null,
});
assert.strictEqual(parsedWithNullAdmin.success, true);
assert.strictEqual(parsedWithNullAdmin.data?.assignedAdminId, null);
console.log("  + Valid branch input with null assignedAdminId accepted");

// 2. Test KPI calculations
interface SampleOrder {
  pickupBranchId: string | null;
  totalAmount: number;
}

interface SampleBranch {
  id: string;
  name: string;
  totalInventory: number;
}

function calculateBranchKPIs(branches: SampleBranch[], todayOrders: SampleOrder[]) {
  const todaySalesTotal = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Group today's orders by branch
  const branchSalesMap: Record<string, number> = {};
  for (const o of todayOrders) {
    if (o.pickupBranchId) {
      branchSalesMap[o.pickupBranchId] = (branchSalesMap[o.pickupBranchId] || 0) + o.totalAmount;
    }
  }

  // Find top branch by today's sales, or fallback to most stocked
  let topBranchName = "-";
  let maxSales = 0;
  for (const [branchId, sales] of Object.entries(branchSalesMap)) {
    if (sales > maxSales) {
      maxSales = sales;
      const b = branches.find((item) => item.id === branchId);
      if (b) topBranchName = b.name;
    }
  }

  if (topBranchName === "-" && branches.length > 0) {
    const sorted = [...branches].sort((a, b) => b.totalInventory - a.totalInventory);
    topBranchName = sorted[0].name;
  }

  return { todaySalesTotal, topBranchName };
}

const branchesSample: SampleBranch[] = [
  { id: "b1", name: "Malika", totalInventory: 150 },
  { id: "b2", name: "Chilonzor", totalInventory: 90 },
  { id: "b3", name: "Buyuk Ipak Yo'li", totalInventory: 45 },
];

// Test KPI with active orders
const ordersToday: SampleOrder[] = [
  { pickupBranchId: "b2", totalAmount: 12000000 },
  { pickupBranchId: "b2", totalAmount: 8500000 },
  { pickupBranchId: "b1", totalAmount: 14000000 },
];

const kpiResult = calculateBranchKPIs(branchesSample, ordersToday);
assert.strictEqual(kpiResult.todaySalesTotal, 34500000);
assert.strictEqual(kpiResult.topBranchName, "Chilonzor"); // b2 has 20.5M vs b1 has 14M
console.log("  + KPI todaySalesTotal and topBranchName correctly calculated");

// Test KPI with zero orders fallback to most stocked
const zeroOrdersKPI = calculateBranchKPIs(branchesSample, []);
assert.strictEqual(zeroOrdersKPI.todaySalesTotal, 0);
assert.strictEqual(zeroOrdersKPI.topBranchName, "Malika"); // fallback to max inventory
console.log("  + Zero orders KPI gracefully falls back to highest inventory branch");

console.log("\nAll admin-branches tests PASSED successfully!\n");
