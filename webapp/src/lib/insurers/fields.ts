import type { InsuranceType } from "./types";

export type FieldDef =
  | { name: string; label: string; kind: "number"; min?: number; max?: number; suffix?: string; defaultValue: number }
  | { name: string; label: string; kind: "select"; options: { value: string; label: string }[]; defaultValue: string }
  | { name: string; label: string; kind: "checkbox"; defaultValue: boolean };

export interface InsuranceTypeConfig {
  id: InsuranceType;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  fields: FieldDef[];
}

export const INSURANCE_TYPES: InsuranceTypeConfig[] = [
  {
    id: "osago",
    title: "ОСАГО",
    shortTitle: "ОСАГО",
    description: "Обязательное страхование автогражданской ответственности",
    icon: "🚗",
    fields: [
      {
        name: "region",
        label: "Регион регистрации",
        kind: "select",
        defaultValue: "region",
        options: [
          { value: "moscow", label: "Москва" },
          { value: "spb", label: "Санкт-Петербург" },
          { value: "region", label: "Другой регион" },
        ],
      },
      { name: "driverAge", label: "Возраст водителя", kind: "number", min: 18, max: 90, suffix: "лет", defaultValue: 30 },
      { name: "experienceYears", label: "Стаж вождения", kind: "number", min: 0, max: 70, suffix: "лет", defaultValue: 5 },
      { name: "power", label: "Мощность двигателя", kind: "number", min: 30, max: 600, suffix: "л.с.", defaultValue: 100 },
    ],
  },
  {
    id: "kasko",
    title: "КАСКО",
    shortTitle: "КАСКО",
    description: "Добровольное страхование автомобиля от ущерба и угона",
    icon: "🛡️",
    fields: [
      { name: "vehiclePrice", label: "Стоимость автомобиля", kind: "number", min: 200_000, max: 30_000_000, suffix: "₽", defaultValue: 1_500_000 },
      { name: "vehicleAge", label: "Возраст автомобиля", kind: "number", min: 0, max: 25, suffix: "лет", defaultValue: 3 },
      { name: "driverAge", label: "Возраст водителя", kind: "number", min: 18, max: 90, suffix: "лет", defaultValue: 30 },
      {
        name: "franchise",
        label: "Франшиза",
        kind: "select",
        defaultValue: "0",
        options: [
          { value: "0", label: "Без франшизы" },
          { value: "15000", label: "15 000 ₽" },
          { value: "30000", label: "30 000 ₽" },
          { value: "50000", label: "50 000 ₽" },
        ],
      },
    ],
  },
  {
    id: "dms",
    title: "ДМС",
    shortTitle: "ДМС",
    description: "Добровольное медицинское страхование",
    icon: "🩺",
    fields: [
      { name: "age", label: "Возраст застрахованного", kind: "number", min: 0, max: 100, suffix: "лет", defaultValue: 30 },
      {
        name: "programLevel",
        label: "Программа",
        kind: "select",
        defaultValue: "standard",
        options: [
          { value: "standard", label: "Стандарт — поликлиника" },
          { value: "optimum", label: "Оптимум — поликлиника + стационар" },
          { value: "premium", label: "Премиум — полное покрытие" },
        ],
      },
      { name: "chronicConditions", label: "Есть хронические заболевания", kind: "checkbox", defaultValue: false },
    ],
  },
  {
    id: "travel",
    title: "Страхование путешественников",
    shortTitle: "Путешествия",
    description: "Медицинская страховка и помощь в поездке за границу",
    icon: "✈️",
    fields: [
      {
        name: "destination",
        label: "Направление",
        kind: "select",
        defaultValue: "schengen",
        options: [
          { value: "russia", label: "Россия" },
          { value: "asia", label: "Азия" },
          { value: "schengen", label: "Европа (Шенген)" },
          { value: "world", label: "Весь мир" },
        ],
      },
      { name: "days", label: "Длительность поездки", kind: "number", min: 1, max: 365, suffix: "дней", defaultValue: 10 },
      { name: "travelersCount", label: "Количество путешественников", kind: "number", min: 1, max: 20, suffix: "чел.", defaultValue: 1 },
      { name: "age", label: "Возраст (старшего из путешественников)", kind: "number", min: 0, max: 100, suffix: "лет", defaultValue: 30 },
    ],
  },
];

export function getInsuranceTypeConfig(type: string): InsuranceTypeConfig | undefined {
  return INSURANCE_TYPES.find((t) => t.id === type);
}

export function isInsuranceType(value: string): value is InsuranceType {
  return INSURANCE_TYPES.some((t) => t.id === value);
}
