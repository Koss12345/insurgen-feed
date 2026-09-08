import type { InsuranceType, QuoteParamValue } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function num(params: Record<string, QuoteParamValue>, key: string, fallback = 0): number {
  const value = params[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function str(params: Record<string, QuoteParamValue>, key: string, fallback = ""): string {
  const value = params[key];
  return typeof value === "string" ? value : fallback;
}

function bool(params: Record<string, QuoteParamValue>, key: string): boolean {
  return params[key] === true;
}

const REGION_MULTIPLIER: Record<string, number> = {
  moscow: 1.9,
  spb: 1.6,
  region: 1,
};

const FRANCHISE_DISCOUNT: Record<string, number> = {
  "0": 1,
  "15000": 0.9,
  "30000": 0.82,
  "50000": 0.72,
};

const DMS_PROGRAM_BASE: Record<string, number> = {
  standard: 25000,
  optimum: 45000,
  premium: 90000,
};

const TRAVEL_DESTINATION_RATE: Record<string, number> = {
  russia: 60,
  asia: 120,
  schengen: 180,
  world: 220,
};

function ageFactor(age: number): number {
  if (age < 22) return 1.6;
  if (age < 25) return 1.3;
  if (age < 60) return 1;
  return 1.25;
}

// Rough stand-in for a bonus-malus/no-claims discount: each accident-free
// year shaves 5% off, capped at 50% — similar shape to the real ОСАГО КБМ
// scale without reproducing its actual table.
function noAccidentFactor(years: number): number {
  return clamp(1 - years * 0.05, 0.5, 1);
}

function multiPolicyFactor(params: Record<string, QuoteParamValue>): number {
  return bool(params, "multiPolicy") ? 0.95 : 1;
}

/**
 * Rough, transparent pricing formulas — not a real actuarial model. They
 * exist to produce a plausible base premium for the mock adapters to apply
 * their own markup/discount to. A real insurer integration ignores this
 * file entirely and prices from the partner's own API response instead.
 */
export function computeBasePremium(type: InsuranceType, params: Record<string, QuoteParamValue>): number {
  switch (type) {
    case "osago": {
      const region = REGION_MULTIPLIER[str(params, "region", "region")] ?? 1;
      const driverAge = clamp(num(params, "driverAge", 30), 18, 90);
      const experience = clamp(num(params, "experienceYears", 5), 0, 70);
      const power = clamp(num(params, "power", 100), 30, 600);
      const noAccidentYears = clamp(num(params, "noAccidentYears", 0), 0, 15);
      const experienceFactor = experience < 3 ? 1.5 : 1;
      const powerFactor = 0.6 + power / 200;
      const base =
        5500 * region * ageFactor(driverAge) * experienceFactor * powerFactor * noAccidentFactor(noAccidentYears);
      return Math.round(base);
    }
    case "kasko": {
      const price = clamp(num(params, "vehiclePrice", 1_500_000), 200_000, 30_000_000);
      const vehicleAge = clamp(num(params, "vehicleAge", 3), 0, 25);
      const driverAge = clamp(num(params, "driverAge", 30), 18, 90);
      const franchise = FRANCHISE_DISCOUNT[str(params, "franchise", "0")] ?? 1;
      const noAccidentYears = clamp(num(params, "noAccidentYears", 0), 0, 15);
      const ageWear = 1 - clamp(vehicleAge, 0, 12) * 0.02;
      const base =
        price *
        0.055 *
        ageFactor(driverAge) *
        ageWear *
        franchise *
        noAccidentFactor(noAccidentYears) *
        multiPolicyFactor(params);
      return Math.round(base);
    }
    case "dms": {
      const programBase = DMS_PROGRAM_BASE[str(params, "programLevel", "standard")] ?? DMS_PROGRAM_BASE.standard;
      const age = clamp(num(params, "age", 30), 0, 100);
      const chronic = bool(params, "chronicConditions") ? 1.35 : 1;
      const elderlyFactor = age > 55 ? 1.5 : age > 40 ? 1.2 : 1;
      const base = programBase * elderlyFactor * chronic * multiPolicyFactor(params);
      return Math.round(base);
    }
    case "travel": {
      const rate = TRAVEL_DESTINATION_RATE[str(params, "destination", "russia")] ?? TRAVEL_DESTINATION_RATE.russia;
      const days = clamp(num(params, "days", 7), 1, 365);
      const travelers = clamp(num(params, "travelersCount", 1), 1, 20);
      const age = clamp(num(params, "age", 30), 0, 100);
      const base = rate * days * travelers * ageFactor(age) * multiPolicyFactor(params);
      return Math.round(base);
    }
    default:
      return 0;
  }
}
