/**
 * index.ts — ارکستراتور normalize: از یک TexsaImport، پروژه و موجودیت‌های محصول را می‌سازد.
 */
import { makeContext, type NormalizeStat } from "./context";
import { normalizeContract } from "./contract";
import { normalizeParties } from "./parties";
import { normalizePriceList } from "./price-list";
import { normalizeMeasurements } from "./measurements";
import { normalizePaymentCertificates } from "./payment-certificates";
import { normalizeAdjustments } from "./adjustments";
import { normalizeDeductions } from "./deductions";
import { normalizeTransport } from "./transport";
import { normalizeResources } from "./resources";

export interface NormalizeResult {
  projectId?: string;
  stats: NormalizeStat[];
  facts: Record<string, string | number>;
}

export async function normalizeImport(importId: string, tenantId: string): Promise<NormalizeResult> {
  const ctx = makeContext(importId, tenantId);
  const stats: NormalizeStat[] = [];

  const contract = await normalizeContract(ctx);
  stats.push(contract.stat);
  const projectId = contract.projectId;
  if (!projectId) {
    return { stats, facts: contract.facts };
  }

  stats.push(await normalizeParties(ctx, projectId));
  stats.push(await normalizePriceList(ctx, projectId, Number(contract.facts.priceListYear) || 1403));
  stats.push(...(await normalizeMeasurements(ctx, projectId)));
  stats.push(await normalizePaymentCertificates(ctx, projectId));
  stats.push(await normalizeAdjustments(ctx, projectId));
  stats.push(await normalizeDeductions(ctx, projectId));
  stats.push(await normalizeTransport(ctx));
  stats.push(await normalizeResources(ctx));

  return { projectId, stats, facts: contract.facts };
}
