import type { MetricKey } from "@/lib/metrics";

/** Tipos compartidos por el servidor y por la pagina de ejemplo. */

export type MetricValues = Record<MetricKey, number | null>;

export type Measurement = MetricValues & {
  id: number;
  measuredAt: string;
  day: string;
  time: string;
  note: string | null;
  /** Ids del catalogo de tags.ts. Vacio si la toma no tiene ninguna. */
  tags: string[];
};

export type DaySummary = MetricValues & {
  day: string;
  total: number;
  counts: Record<MetricKey, number>;
  note: string | null;
};

/** Ultimo valor cargado de una metrica, con cuando fue. */
export type LatestValue = {
  value: number;
  day: string;
  time: string;
};

/** Un registro de como se sintio: puntaje, sintomas y nota. */
export type MoodLog = {
  id: number;
  loggedAt: string;
  day: string;
  time: string;
  /** De 0 a 10. */
  mood: number;
  /** Ids del catalogo de mood.ts. */
  symptoms: string[];
  note: string | null;
};

export type NewMoodLog = {
  loggedAt: Date;
  mood: number;
  symptoms: string[];
  note: string | null;
};

export type NewMeasurement = {
  measuredAt: Date;
  note: string | null;
  tags: string[];
} & Partial<MetricValues>;
