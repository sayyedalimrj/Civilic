/**
 * test-review-logic.ts — تست‌های pure-function برای منطق رسیدگی و وابستگی.
 * اجرا: `bun .zscripts/test-review-logic.ts`
 */
import { resolveEffective, buildDisplayStack, type ReviewLayer } from "../src/lib/review/layers";
import { allDependents, directDependents, STAGE_ORDER } from "../src/lib/calculation/dependency-engine";

let passed = 0;
let failed = 0;
function assert(name: string, cond: boolean) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

console.log("— effective value resolution —");
const base = { quantity: 120, unitPrice: 1000, amount: 120000 };

// 1) contractor only
{
  const eff = resolveEffective(base, []);
  assert("contractor only → contractor amount", eff.amount === 120000 && eff.byParty === "CONTRACTOR");
}
// 2) consultant revised
{
  const layers: ReviewLayer[] = [{ partyType: "CONSULTANT", decision: "REVISED", amount: 110000, isEffective: true }];
  const eff = resolveEffective(base, layers);
  assert("consultant revised → consultant amount", eff.amount === 110000 && eff.byParty === "CONSULTANT");
}
// 3) employer final wins over consultant
{
  const layers: ReviewLayer[] = [
    { partyType: "CONSULTANT", decision: "REVISED", amount: 110000, isEffective: true },
    { partyType: "EMPLOYER", decision: "REVISED", amount: 105000, isEffective: true },
  ];
  const eff = resolveEffective(base, layers);
  assert("employer final → employer amount", eff.amount === 105000 && eff.byParty === "EMPLOYER");
}
// 4) rejected → zero
{
  const layers: ReviewLayer[] = [{ partyType: "CONSULTANT", decision: "REJECTED", isEffective: true }];
  const eff = resolveEffective(base, layers);
  assert("rejected → amount 0", eff.amount === 0 && eff.decision === "REJECTED");
}
// 5) approved as-is inherits contractor
{
  const layers: ReviewLayer[] = [{ partyType: "CONSULTANT", decision: "APPROVED_AS_IS", isEffective: true }];
  const eff = resolveEffective(base, layers);
  assert("approved as-is → inherits contractor amount", eff.amount === 120000 && eff.byParty === "CONSULTANT");
}

console.log("— display stack (strikethrough) —");
{
  const layers: ReviewLayer[] = [{ partyType: "CONSULTANT", decision: "REVISED", amount: 110000, isEffective: true }];
  const stack = buildDisplayStack(base, layers);
  assert("contractor row superseded when consultant revises", stack[0].partyType === "CONTRACTOR" && stack[0].superseded === true);
  assert("consultant row not superseded (top)", stack[1].partyType === "CONSULTANT" && stack[1].superseded === false);
}
{
  const layers: ReviewLayer[] = [
    { partyType: "CONSULTANT", decision: "REVISED", amount: 110000, isEffective: true },
    { partyType: "EMPLOYER", decision: "REVISED", amount: 105000, isEffective: true },
  ];
  const stack = buildDisplayStack(base, layers);
  assert("consultant superseded by employer revision", stack[1].partyType === "CONSULTANT" && stack[1].superseded === true);
  assert("employer row final (not superseded)", stack[2].partyType === "EMPLOYER" && stack[2].superseded === false);
}

console.log("— dependency graph (stale propagation) —");
{
  const deps = allDependents("MEASUREMENT_DETAIL");
  assert("measurement detail → summary stale", deps.includes("MEASUREMENT_SUMMARY"));
  assert("measurement detail → financial stale", deps.includes("FINANCIAL_SHEET"));
  assert("measurement detail → payment stale", deps.includes("PAYMENT_CERTIFICATE"));
  assert("measurement detail → adjustment stale", deps.includes("ADJUSTMENT"));
  assert("measurement detail → export stale", deps.includes("EXPORT"));
}
{
  const direct = directDependents("PAYMENT_CERTIFICATE");
  assert("payment → deduction direct dependent", direct.includes("DEDUCTION"));
  assert("payment → adjustment direct dependent", direct.includes("ADJUSTMENT"));
  assert("STAGE_ORDER has 11 stages", STAGE_ORDER.length === 11);
}

console.log(`\nنتیجه: ${passed} موفق، ${failed} ناموفق`);
if (failed > 0) process.exit(1);
