export type InsuranceType = "osago" | "kasko" | "dms" | "travel";

export type QuoteParamValue = string | number | boolean;

export interface QuoteRequest {
  type: InsuranceType;
  params: Record<string, QuoteParamValue>;
}

export interface Quote {
  insurerId: string;
  insurerName: string;
  premium: number;
  currency: "RUB";
  coverageSummary: string;
}

/**
 * Everything that quotes a price for a policy implements this — a mock
 * pricing model today, a real insurer/aggregator API tomorrow. The rest of
 * the app (the calculator, the applications flow) only ever talks to this
 * interface, so swapping mocks for a real partner is a registry change,
 * not a rewrite. See adapters/partner-template.ts for the shape a real
 * integration would take.
 */
export interface InsurerAdapter {
  id: string;
  name: string;
  supports: InsuranceType[];
  getQuote(request: QuoteRequest, basePremium: number): Promise<Quote | null>;
}
