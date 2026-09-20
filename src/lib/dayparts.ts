import { METRICS, type MetricKey } from "@/lib/metrics";
import type { Measurement, MetricValues } from "@/lib/model";

/**
 * Momentos del dia. Sirven para ver el patron de las tomas: la presion de la
 * mañana y la de la noche no se leen igual, y el promedio de todo junto las
 * mezcla.
 *
 * Los cortes se definen una sola vez: la app real los usa en SQL y la pagina
 * de ejemplo los calcula en el navegador con `summarizeDayParts`.
 */

export type DayPartId = "manana" | "tarde" | "noche";

export const DAY_PARTS: Array<{
  id: DayPartId;
  label: string;
  hint: string;
  /** Hora de inicio, inclusive. El tramo termina donde arranca el siguiente. */
  from: number;
}> = [
  { id: "manana", label: "Mañana", hint: "00 a 12 h", from: 0 },
  { id: "tarde", label: "Tarde", hint: "12 a 19 h", from: 12 },
  { id: "noche", label: "Noche", hint: "19 a 24 h", from: 19 },
];

export type DayPartSummary = MetricValues & {
  part: DayPartId;
  total: number;
  counts: Record<MetricKey, number>;
};

export function partOfHour(hour: number): DayPartId {
  let current: DayPartId = DAY_PARTS[0].id;
  for (const part of DAY_PARTS) {
    if (hour >= part.from) current = part.id;
  }
  return current;
}

/** Promedios por momento del dia, calculados en el navegador (pagina de ejemplo). */
export function summarizeDayParts(
  measurements: Measurement[],
): DayPartSummary[] {
  const buckets = new Map<DayPartId, Measurement[]>();
  for (const measurement of measurements) {
    const hour = Number(measurement.time.slice(0, 2));
    const part = partOfHour(Number.isFinite(hour) ? hour : 0);
    const list = buckets.get(part);
    if (list) list.push(measurement);
    else buckets.set(part, [measurement]);
  }

  const summaries: DayPartSummary[] = [];
  for (const part of DAY_PARTS) {
    const rows = buckets.get(part.id);
    if (!rows || rows.length === 0) continue;

    const values = {} as MetricValues;
    const counts = {} as Record<MetricKey, number>;
    for (const metric of METRICS) {
      const numbers = rows
        .map((row) => row[metric.key])
        .filter((value): value is number => typeof value === "number");
      counts[metric.key] = numbers.length;
      values[metric.key] =
        numbers.length === 0
          ? null
          : numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
    }

    summaries.push({ ...values, part: part.id, total: rows.length, counts });
  }
  return summaries;
}
