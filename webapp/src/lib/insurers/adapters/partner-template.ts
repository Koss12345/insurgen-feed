import type { InsurerAdapter, Quote, QuoteRequest } from "../types";

/**
 * TEMPLATE — not registered anywhere, never called by the app.
 *
 * This is the shape a real insurer/aggregator integration should take
 * once a partner is signed and their API docs/credentials exist. It is
 * intentionally not wired into `registry.ts` yet: there is no partner to
 * call, so a mock adapter would just throw or return fake-looking data.
 *
 * To go live with a partner:
 *   1. Copy this file, rename it to the partner's id (e.g. `sravni.ts`).
 *   2. Implement the fetch call in getQuote() against their documented
 *      quote endpoint, mapping their response into the shared Quote shape.
 *   3. Add the partner's API base URL / key to env vars (see webapp/README.md).
 *   4. Register the adapter in registry.ts alongside (or instead of) the
 *      mock adapters — the rest of the app (calculator, applications API,
 *      admin panel) needs no changes, since it only depends on InsurerAdapter.
 */
export function createPartnerAdapter(config: {
  id: string;
  name: string;
  apiBaseUrl: string;
  apiKey: string;
}): InsurerAdapter {
  return {
    id: config.id,
    name: config.name,
    supports: ["osago", "kasko", "dms", "travel"],
    async getQuote(request: QuoteRequest): Promise<Quote | null> {
      const response = await fetch(`${config.apiBaseUrl}/v1/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          product: request.type,
          parameters: request.params,
        }),
      });

      if (!response.ok) {
        // A partner being down/erroring shouldn't break the whole quote
        // request for the user — the registry drops null results and
        // shows whichever other insurers did respond.
        return null;
      }

      const data = await response.json();

      return {
        insurerId: config.id,
        insurerName: config.name,
        premium: data.premium,
        currency: "RUB",
        coverageSummary: data.coverageSummary ?? "",
      };
    },
  };
}
