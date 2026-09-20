import type { MetricKey } from "@/lib/metrics";

/** Tipos compartidos por el servidor y por la pagina de ejemplo. */

export type MetricValues = Record<MetricKey, number | null>;

export type Measurement = MetricValues & {
  id: number;
  measuredAt: string;
  day: string;
  time: string;
  note: string | null;
};

export type DaySummary = MetricValues & {
  day: string;
  total: number;
  counts: Record<MetricKey, number>;
  note: string | null;
};

export type NewMeasurement = {
  measuredAt: Date;
  note: string | null;
} & Partial<MetricValues>;
