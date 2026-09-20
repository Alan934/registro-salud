import { METRIC_BY_KEY, type MetricKey } from "@/lib/metrics";

/**
 * Las zonas de referencia de cada metrica, para la barra de colores que
 * acompania al valor ("baja | normal | elevada | alta").
 *
 * Es la misma idea que `normal` en metrics.ts pero contada en varios tramos,
 * asi se ve de un vistazo que tan lejos quedo el valor. Sigue siendo
 * orientativo: no es un diagnostico y los cortes los confirma el medico.
 */

export type ZoneTone = "low" | "ok" | "warn" | "high";

export type Zone = {
  /** Como se lee en la pastilla de estado: "Elevada". */
  label: string;
  /** Como entra abajo de la barra, que es angosta: "ELEV". */
  short: string;
  tone: ZoneTone;
  /** Limite superior, exclusivo. La ultima zona no tiene. */
  to: number | null;
};

export type Scale = {
  /** Extremos de la barra dibujada (no del valor aceptado en el formulario). */
  from: number;
  to: number;
  zones: Zone[];
};

export const SCALES: Partial<Record<MetricKey, Scale>> = {
  systolic: {
    from: 80,
    to: 180,
    zones: [
      { label: "Baja", short: "BAJA", tone: "low", to: 90 },
      { label: "Normal", short: "NORM", tone: "ok", to: 130 },
      { label: "Elevada", short: "ELEV", tone: "warn", to: 140 },
      { label: "Alta", short: "ALTA", tone: "high", to: null },
    ],
  },
  diastolic: {
    from: 50,
    to: 110,
    zones: [
      { label: "Baja", short: "BAJA", tone: "low", to: 60 },
      { label: "Normal", short: "NORM", tone: "ok", to: 85 },
      { label: "Elevada", short: "ELEV", tone: "warn", to: 90 },
      { label: "Alta", short: "ALTA", tone: "high", to: null },
    ],
  },
  glucose: {
    from: 50,
    to: 250,
    zones: [
      { label: "Baja", short: "BAJA", tone: "low", to: 70 },
      { label: "Normal", short: "NORM", tone: "ok", to: 140 },
      { label: "Elevada", short: "ELEV", tone: "warn", to: 200 },
      { label: "Alta", short: "ALTA", tone: "high", to: null },
    ],
  },
  spo2: {
    from: 85,
    to: 100,
    zones: [
      { label: "Bajo", short: "BAJO", tone: "high", to: 90 },
      { label: "Límite", short: "LÍM", tone: "warn", to: 95 },
      { label: "Normal", short: "NORM", tone: "ok", to: null },
    ],
  },
  pulse: {
    from: 40,
    to: 140,
    zones: [
      { label: "Bajo", short: "BAJO", tone: "low", to: 60 },
      { label: "Normal", short: "NORM", tone: "ok", to: 100 },
      { label: "Elevado", short: "ELEV", tone: "warn", to: 120 },
      { label: "Alto", short: "ALTO", tone: "high", to: null },
    ],
  },
  temperature: {
    from: 35,
    to: 40,
    zones: [
      { label: "Baja", short: "BAJA", tone: "low", to: 36 },
      { label: "Normal", short: "NORM", tone: "ok", to: 37.3 },
      { label: "Febrícula", short: "FEBR", tone: "warn", to: 38 },
      { label: "Fiebre", short: "FIEBRE", tone: "high", to: null },
    ],
  },
};

/** Colores de cada tono: el fuerte para la zona donde cayo el valor. */
export const TONE_COLOR: Record<ZoneTone, { strong: string; soft: string }> = {
  low: { strong: "var(--info)", soft: "var(--info-soft)" },
  ok: { strong: "var(--ok)", soft: "var(--ok-soft)" },
  warn: { strong: "var(--warn)", soft: "var(--warn-soft)" },
  high: { strong: "var(--danger)", soft: "var(--danger-soft)" },
};

export const TONE_PILL: Record<ZoneTone, string> = {
  low: "pill-low",
  ok: "pill-ok",
  warn: "pill-warn",
  high: "pill-high",
};

/** En que zona de una escala cualquiera cae el valor. */
export function zoneIn(scale: Scale, value: number | null): Zone | null {
  if (value === null || Number.isNaN(value)) return null;
  return scale.zones.find((zone) => zone.to === null || value < zone.to) ?? null;
}

/** En que zona cae el valor, o null si la metrica no tiene escala. */
export function zoneFor(key: MetricKey, value: number | null): Zone | null {
  const scale = SCALES[key];
  if (!scale) return null;
  return zoneIn(scale, value);
}

/** El tono mas preocupante de varios, para resumir la presion en una pastilla. */
export function worstTone(tones: ZoneTone[]): ZoneTone | null {
  const order: ZoneTone[] = ["high", "warn", "low", "ok"];
  return order.find((tone) => tones.includes(tone)) ?? null;
}

/** Los tramos de la barra, en porcentaje del ancho total. */
export function zoneSegments(
  scale: Scale,
): Array<{ zone: Zone; from: number; to: number; width: number }> {
  const span = scale.to - scale.from;
  let cursor = scale.from;
  return scale.zones.map((zone) => {
    const end = zone.to === null ? scale.to : Math.min(zone.to, scale.to);
    const from = cursor;
    cursor = end;
    return {
      zone,
      from,
      to: end,
      width: Math.max(((end - from) / span) * 100, 0),
    };
  });
}

/** Donde va el marcador, de 0 a 100. Los valores fuera de la barra se pegan al borde. */
export function markerPosition(scale: Scale, value: number): number {
  const ratio = (value - scale.from) / (scale.to - scale.from);
  return Math.min(Math.max(ratio, 0), 1) * 100;
}

/** "Presión sistólica 142 mmHg: alta" para lectores de pantalla. */
export function zoneText(key: MetricKey, value: number): string {
  const zone = zoneFor(key, value);
  const metric = METRIC_BY_KEY[key];
  if (!zone) return `${metric.label} ${value} ${metric.unit}`;
  return `${metric.label} ${value} ${metric.unit}: ${zone.label.toLowerCase()}`;
}
