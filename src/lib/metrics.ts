/** Definicion unica de las metricas que se registran y se grafican. */
export type MetricKey =
  | "weight"
  | "systolic"
  | "diastolic"
  | "glucose"
  | "spo2"
  | "pulse"
  | "temperature";

export type Metric = {
  key: MetricKey;
  label: string;
  short: string;
  unit: string;
  /** Decimales al mostrar promedios. */
  decimals: number;
  step: string;
  min: number;
  max: number;
  color: string;
  /** Rango de referencia orientativo (no es diagnostico). */
  normal?: [number, number];
  placeholder?: string;
};

export const METRICS: Metric[] = [
  {
    key: "weight",
    label: "Peso",
    short: "Peso",
    unit: "kg",
    decimals: 1,
    step: "0.1",
    min: 20,
    max: 300,
    color: "#4a3aa7",
    placeholder: "68.5",
  },
  {
    key: "systolic",
    label: "Presión sistólica",
    short: "Sistólica",
    unit: "mmHg",
    decimals: 0,
    step: "1",
    min: 50,
    max: 300,
    color: "#e34948",
    normal: [90, 130],
    placeholder: "120",
  },
  {
    key: "diastolic",
    label: "Presión diastólica",
    short: "Diastólica",
    unit: "mmHg",
    decimals: 0,
    step: "1",
    min: 30,
    max: 200,
    color: "#2a78d6",
    normal: [60, 85],
    placeholder: "80",
  },
  {
    key: "glucose",
    label: "Glucosa",
    short: "Glucosa",
    unit: "mg/dL",
    decimals: 0,
    step: "1",
    min: 20,
    max: 600,
    color: "#eb6834",
    normal: [70, 140],
    placeholder: "95",
  },
  {
    key: "spo2",
    label: "Oxígeno en sangre",
    short: "Oxígeno",
    unit: "%",
    decimals: 0,
    step: "1",
    min: 50,
    max: 100,
    color: "#008300",
    normal: [95, 100],
    placeholder: "97",
  },
  {
    key: "pulse",
    label: "Pulsaciones",
    short: "Pulso",
    unit: "lpm",
    decimals: 0,
    step: "1",
    min: 20,
    max: 250,
    color: "#e87ba4",
    normal: [60, 100],
    placeholder: "72",
  },
  {
    key: "temperature",
    label: "Temperatura",
    short: "Temp.",
    unit: "°C",
    decimals: 1,
    step: "0.1",
    min: 30,
    max: 45,
    color: "#eda100",
    normal: [36, 37.3],
    placeholder: "36.5",
  },
];

export const METRIC_BY_KEY = Object.fromEntries(
  METRICS.map((metric) => [metric.key, metric]),
) as Record<MetricKey, Metric>;

export function formatValue(key: MetricKey, value: number | null): string {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toFixed(METRIC_BY_KEY[key].decimals);
}

/** "dentro" | "bajo" | "alto" | null si la metrica no tiene rango. */
export function statusFor(
  key: MetricKey,
  value: number | null,
): "ok" | "low" | "high" | null {
  const normal = METRIC_BY_KEY[key].normal;
  if (!normal || value === null) return null;
  if (value < normal[0]) return "low";
  if (value > normal[1]) return "high";
  return "ok";
}
