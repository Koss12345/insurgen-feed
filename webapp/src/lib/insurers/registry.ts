import { mockAdapters } from "./adapters/mock";
import { computeBasePremium } from "./pricing";
import type { InsurerAdapter, Quote, QuoteRequest } from "./types";

// Swap or extend this list to plug in real partners — see
// adapters/partner-template.ts for what a real adapter looks like.
const adapters: InsurerAdapter[] = [...mockAdapters];

export async function getQuotes(request: QuoteRequest): Promise<Quote[]> {
  const basePremium = computeBasePremium(request.type, request.params);
  const supporting = adapters.filter((adapter) => adapter.supports.includes(request.type));

  const results = await Promise.all(
    supporting.map((adapter) => adapter.getQuote(request, basePremium).catch(() => null)),
  );

  return results
    .filter((quote): quote is Quote => quote !== null)
    .sort((a, b) => a.premium - b.premium);
}
