import { METRICS, type MetricKey } from "@/lib/metrics";
import type { DaySummary, Measurement, MetricValues } from "@/lib/model";
import { fromDateTimeLocal, shiftDay } from "@/lib/tz";

/**
 * Datos ficticios para la pagina de ejemplo. Se generan con una semilla fija,
 * asi la demo se ve igual en el servidor y en el navegador (sin desajustes de
 * hidratacion) y no hace falta tocar la base.
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOTES = [
  "Antes del desayuno",
  "Después de caminar una vuelta",
  "Control de la tarde",
  "Antes de la cena",
  "Se sintió un poco cansada",
];

const DAY_NOTES: Record<number, string> = {
  0: "Durmió bien. Caminó 20 minutos a la mañana y almorzó completo.",
  2: "Tomó la medicación en horario. Dolor de cabeza leve a la tarde.",
  5: "Turno con la médica: le pidió seguir midiendo la presión dos veces por día.",
  9: "Día tranquilo, sin novedades.",
};

const DEMO_DAYS = 21;

export type DemoData = {
  measurements: Measurement[];
  dayNotes: Record<string, string>;
};

export function buildDemoData(today: string): DemoData {
  const random = mulberry32(20260919);
  const measurements: Measurement[] = [];
  const dayNotes: Record<string, string> = {};
  let id = 1;

  const pick = (min: number, max: number) =>
    Math.round(min + random() * (max - min));

  for (let back = DEMO_DAYS - 1; back >= 0; back--) {
    const day = shiftDay(today, -back);

    if (DAY_NOTES[back]) dayNotes[day] = DAY_NOTES[back];

    // Algunos dias con una sola toma, otros con dos o tres.
    const takes = back % 5 === 0 ? 3 : back % 3 === 0 ? 2 : 1;

    for (let t = 0; t < takes; t++) {
      const hour = [8, 14, 20][t];
      const minute = [15, 40, 5][t];
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const measuredAt = fromDateTimeLocal(`${day}T${time}`);
      if (!measuredAt) continue;

      const values = {} as MetricValues;
      for (const metric of METRICS) values[metric.key] = null;

      values.systolic = pick(112, 142);
      values.diastolic = pick(68, 88);
      values.pulse = pick(62, 92);
      values.spo2 = pick(94, 99);

      // El peso y la temperatura se miden una vez al dia, a la mañana.
      if (t === 0) {
        values.weight = Number((67.8 + random() * 1.4).toFixed(1));
        values.temperature = Number((36.2 + random() * 0.8).toFixed(1));
        values.glucose = pick(84, 112);
      } else {
        values.glucose = pick(96, 148);
      }

      measurements.push({
        ...values,
        id: id++,
        measuredAt: measuredAt.toISOString(),
        day,
        time,
        note: random() > 0.55 ? NOTES[Math.floor(random() * NOTES.length)] : null,
      });
    }
  }

  return { measurements, dayNotes };
}

/**
 * Mismo resumen por dia que hace la app real en SQL: promedio por metrica y
 * cuantas tomas entraron en cada promedio.
 */
export function summarizeDays(
  measurements: Measurement[],
  dayNotes: Record<string, string>,
): DaySummary[] {
  const byDay = new Map<string, Measurement[]>();
  for (const m of measurements) {
    const list = byDay.get(m.day);
    if (list) list.push(m);
    else byDay.set(m.day, [m]);
  }

  const summaries: DaySummary[] = [];
  for (const [day, list] of byDay) {
    const values = {} as MetricValues;
    const counts = {} as Record<MetricKey, number>;

    for (const metric of METRICS) {
      const nums = list
        .map((m) => m[metric.key])
        .filter((value): value is number => typeof value === "number");
      counts[metric.key] = nums.length;
      values[metric.key] =
        nums.length === 0
          ? null
          : nums.reduce((total, value) => total + value, 0) / nums.length;
    }

    summaries.push({
      ...values,
      counts,
      day,
      total: list.length,
      note: dayNotes[day] ?? null,
    });
  }

  return summaries.sort((a, b) => (a.day < b.day ? 1 : -1));
}
