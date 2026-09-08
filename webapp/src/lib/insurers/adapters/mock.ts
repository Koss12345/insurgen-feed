import type { InsurerAdapter, Quote, QuoteRequest } from "../types";

const COVERAGE_SUMMARY: Record<string, string> = {
  osago: "Полис ОСАГО, покрытие по закону — до 400 000 ₽ имущество, до 500 000 ₽ жизнь и здоровье",
  kasko: "КАСКО: ущерб, угон, ремонт на СТО по выбору",
  dms: "ДМС: амбулаторная и стационарная помощь по программе",
  travel: "Медицинская страховка выезжающих за рубеж + круглосуточный ассистанс",
};

interface MockInsurerConfig {
  id: string;
  name: string;
  multiplier: number;
  fixedFee: number;
}

const MOCK_INSURERS: MockInsurerConfig[] = [
  { id: "glavstrah", name: "ГлавСтрахование", multiplier: 1.0, fixedFee: 300 },
  { id: "nadezhny-soyuz", name: "Надёжный Союз", multiplier: 0.93, fixedFee: 450 },
  { id: "strah-rezerv", name: "СтрахРезерв", multiplier: 1.08, fixedFee: 150 },
];

/**
 * Placeholder pricing until real insurer partners are connected. Every
 * mock insurer prices off the same `basePremium` (see pricing.ts) with a
 * fixed multiplier/fee, so results are deterministic and comparable.
 */
function createMockAdapter(config: MockInsurerConfig): InsurerAdapter {
  return {
    id: config.id,
    name: config.name,
    supports: ["osago", "kasko", "dms", "travel"],
    async getQuote(request: QuoteRequest, basePremium: number): Promise<Quote | null> {
      const premium = Math.round(basePremium * config.multiplier + config.fixedFee);
      return {
        insurerId: config.id,
        insurerName: config.name,
        premium,
        currency: "RUB",
        coverageSummary: COVERAGE_SUMMARY[request.type] ?? "",
      };
    },
  };
}

export const mockAdapters: InsurerAdapter[] = MOCK_INSURERS.map(createMockAdapter);
