import "server-only";
import { DAY_PARTS, type DayPartId, type DayPartSummary } from "@/lib/dayparts";
import { sql } from "@/lib/db";
import { METRICS, type MetricKey } from "@/lib/metrics";
import type {
  DaySummary,
  LatestValue,
  Measurement,
  MetricValues,
  NewMeasurement,
} from "@/lib/model";
import { TIME_ZONE } from "@/lib/tz";

export type {
  DaySummary,
  LatestValue,
  Measurement,
  MetricValues,
  NewMeasurement,
};

type Row = Record<string, unknown>;

function num(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const SELECT_COLUMNS = `
  id,
  measured_at,
  to_char(measured_at AT TIME ZONE '${TIME_ZONE}', 'YYYY-MM-DD') AS day,
  to_char(measured_at AT TIME ZONE '${TIME_ZONE}', 'HH24:MI') AS time,
  weight, systolic, diastolic, glucose, spo2, pulse, temperature, note
`;

function toMeasurement(row: Row): Measurement {
  const values = Object.fromEntries(
    METRICS.map((metric) => [metric.key, num(row[metric.key])]),
  ) as MetricValues;
  return {
    ...values,
    id: Number(row.id),
    measuredAt: new Date(row.measured_at as string).toISOString(),
    day: String(row.day),
    time: String(row.time),
    note: (row.note as string | null) ?? null,
  };
}

function toDaySummary(row: Row): DaySummary {
  const values = Object.fromEntries(
    METRICS.map((metric) => [metric.key, num(row[`avg_${metric.key}`])]),
  ) as MetricValues;
  const counts = Object.fromEntries(
    METRICS.map((metric) => [metric.key, Number(row[`n_${metric.key}`] ?? 0)]),
  ) as Record<MetricKey, number>;
  return {
    ...values,
    counts,
    day: String(row.day),
    total: Number(row.total ?? 0),
    note: (row.note as string | null) ?? null,
  };
}

export async function createMeasurement(input: NewMeasurement): Promise<void> {
  await sql`
    INSERT INTO measurements
      (measured_at, weight, systolic, diastolic, glucose, spo2, pulse, temperature, note)
    VALUES (
      ${input.measuredAt.toISOString()},
      ${input.weight ?? null},
      ${input.systolic ?? null},
      ${input.diastolic ?? null},
      ${input.glucose ?? null},
      ${input.spo2 ?? null},
      ${input.pulse ?? null},
      ${input.temperature ?? null},
      ${input.note}
    )
  `;
}

export async function updateMeasurement(
  id: number,
  input: NewMeasurement,
): Promise<void> {
  await sql`
    UPDATE measurements SET
      measured_at = ${input.measuredAt.toISOString()},
      weight = ${input.weight ?? null},
      systolic = ${input.systolic ?? null},
      diastolic = ${input.diastolic ?? null},
      glucose = ${input.glucose ?? null},
      spo2 = ${input.spo2 ?? null},
      pulse = ${input.pulse ?? null},
      temperature = ${input.temperature ?? null},
      note = ${input.note}
    WHERE id = ${id}
  `;
}

export async function deleteMeasurement(id: number): Promise<void> {
  await sql`DELETE FROM measurements WHERE id = ${id}`;
}

export async function getMeasurement(id: number): Promise<Measurement | null> {
  const rows = (await sql.query(
    `SELECT ${SELECT_COLUMNS} FROM measurements WHERE id = $1`,
    [id],
  )) as Row[];
  return rows[0] ? toMeasurement(rows[0]) : null;
}

/**
 * Filtro por rango de dias locales, escrito sobre `measured_at` a secas para
 * que pueda usar el indice measurements_measured_at_idx.
 *
 * Comparar `(measured_at AT TIME ZONE ...)::date` contra la fecha obliga a
 * calcular la expresion fila por fila y el indice queda afuera; en cambio los
 * dos extremos del dia local se resuelven una sola vez y la busqueda es por
 * rango sobre la columna cruda. El limite de arriba es exclusivo: asi entra
 * todo el ultimo dia sin depender de la hora.
 */
function dayRangeFilter(from: string, to: string): string {
  return `measured_at >= (${from}::date::timestamp AT TIME ZONE '${TIME_ZONE}')
      AND measured_at <  ((${to}::date + 1)::timestamp AT TIME ZONE '${TIME_ZONE}')`;
}

/** Tomas de un dia puntual, de la mas temprana a la mas tarde. */
export async function getMeasurementsForDay(
  day: string,
): Promise<Measurement[]> {
  const rows = (await sql.query(
    `SELECT ${SELECT_COLUMNS}
       FROM measurements
      WHERE ${dayRangeFilter("$1", "$1")}
      ORDER BY measured_at ASC`,
    [day],
  )) as Row[];
  return rows.map(toMeasurement);
}

/**
 * Un dia existe si tiene tomas o si tiene nota: por eso el FULL OUTER JOIN.
 * Con un LEFT JOIN desde las tomas, una nota cargada en un dia sin ninguna
 * medicion quedaba guardada pero invisible en la app.
 *
 * El rango ($1 y $2) se filtra adentro de cada lado del join, no afuera: si
 * se filtra despues, Postgres agrupa la tabla entera y recien ahi descarta,
 * que es justo lo que crece con los anios de uso.
 */
const DAY_AGGREGATE = `
  SELECT s.* FROM (
    SELECT COALESCE(d.day, to_char(n.day, 'YYYY-MM-DD')) AS day,
           COALESCE(d.total, 0) AS total,
           ${METRICS.map((m) => `d.avg_${m.key}, COALESCE(d.n_${m.key}, 0) AS n_${m.key}`).join(
             ", ",
           )},
           n.note
      FROM (
        SELECT to_char(measured_at AT TIME ZONE '${TIME_ZONE}', 'YYYY-MM-DD') AS day,
               count(*)::int AS total,
               ${METRICS.map(
                 (m) =>
                   `avg(${m.key})::float8 AS avg_${m.key}, count(${m.key})::int AS n_${m.key}`,
               ).join(", ")}
          FROM measurements
         WHERE ${dayRangeFilter("$1", "$2")}
         GROUP BY 1
      ) d
      FULL OUTER JOIN (
        SELECT day, note
          FROM daily_notes
         WHERE day BETWEEN $1::date AND $2::date
      ) n ON n.day = d.day::date
  ) s
`;

/** Resumen por dia (promedios), del mas reciente al mas viejo. */
export async function getDaySummaries(
  fromDay: string,
  toDay: string,
): Promise<DaySummary[]> {
  const rows = (await sql.query(`${DAY_AGGREGATE} ORDER BY s.day DESC`, [
    fromDay,
    toDay,
  ])) as Row[];
  return rows.map(toDaySummary);
}

/** Todas las tomas de un rango, para ver el detalle por horario. */
export async function getMeasurementsInRange(
  fromDay: string,
  toDay: string,
): Promise<Measurement[]> {
  const rows = (await sql.query(
    `SELECT ${SELECT_COLUMNS}
       FROM measurements
      WHERE ${dayRangeFilter("$1", "$2")}
      ORDER BY measured_at ASC`,
    [fromDay, toDay],
  )) as Row[];
  return rows.map(toMeasurement);
}

export async function saveDailyNote(day: string, note: string): Promise<void> {
  if (note.trim() === "") {
    await sql`DELETE FROM daily_notes WHERE day = ${day}::date`;
    return;
  }
  await sql`
    INSERT INTO daily_notes (day, note, updated_at)
    VALUES (${day}::date, ${note.trim()}, now())
    ON CONFLICT (day) DO UPDATE SET note = EXCLUDED.note, updated_at = now()
  `;
}

export type MetricAverage = { avg: number; count: number };
export type PeriodAverages = Partial<Record<MetricKey, MetricAverage>>;

/**
 * Promedio de cada metrica en un rango, sobre todas las tomas (no sobre el
 * promedio diario). Se usa para comparar un periodo contra el anterior.
 */
export async function getPeriodAverages(
  fromDay: string,
  toDay: string,
): Promise<PeriodAverages> {
  const columns = METRICS.map(
    (m) =>
      `avg(${m.key})::float8 AS avg_${m.key}, count(${m.key})::int AS n_${m.key}`,
  ).join(", ");
  const rows = (await sql.query(
    `SELECT ${columns}
       FROM measurements
      WHERE ${dayRangeFilter("$1", "$2")}`,
    [fromDay, toDay],
  )) as Row[];

  const row = rows[0];
  const averages: PeriodAverages = {};
  if (!row) return averages;
  for (const metric of METRICS) {
    const avg = num(row[`avg_${metric.key}`]);
    const count = Number(row[`n_${metric.key}`] ?? 0);
    if (avg === null || count === 0) continue;
    averages[metric.key] = { avg, count };
  }
  return averages;
}

/** Ultimo valor cargado de cada metrica, para las tarjetas del inicio. */
export async function getLatestValues(): Promise<
  Partial<Record<MetricKey, LatestValue>>
> {
  const parts = METRICS.map(
    (m) => `(
      SELECT '${m.key}' AS key,
             ${m.key}::float8 AS value,
             to_char(measured_at AT TIME ZONE '${TIME_ZONE}', 'YYYY-MM-DD') AS day,
             to_char(measured_at AT TIME ZONE '${TIME_ZONE}', 'HH24:MI') AS time
        FROM measurements
       WHERE ${m.key} IS NOT NULL
       ORDER BY measured_at DESC
       LIMIT 1
    )`,
  );
  const rows = (await sql.query(parts.join("\nUNION ALL\n"))) as Row[];
  const result: Partial<Record<MetricKey, LatestValue>> = {};
  for (const row of rows) {
    const value = num(row.value);
    if (value === null) continue;
    result[row.key as MetricKey] = {
      value,
      day: String(row.day),
      time: String(row.time),
    };
  }
  return result;
}

/**
 * Promedios por momento del dia (mañana / tarde / noche) dentro de un rango.
 * Los cortes salen de DAY_PARTS, la misma definicion que usa la pagina de
 * ejemplo para calcularlos en el navegador.
 */
export async function getDayPartAverages(
  fromDay: string,
  toDay: string,
): Promise<DayPartSummary[]> {
  const hour = `extract(hour from measured_at AT TIME ZONE '${TIME_ZONE}')`;
  const cases = DAY_PARTS.slice(1)
    .map((part, index) => `WHEN ${hour} < ${part.from} THEN '${DAY_PARTS[index].id}'`)
    .join("\n           ");
  const columns = METRICS.map(
    (m) =>
      `avg(${m.key})::float8 AS avg_${m.key}, count(${m.key})::int AS n_${m.key}`,
  ).join(", ");

  const rows = (await sql.query(
    `SELECT CASE
              ${cases}
              ELSE '${DAY_PARTS[DAY_PARTS.length - 1].id}'
            END AS part,
            count(*)::int AS total,
            ${columns}
       FROM measurements
      WHERE ${dayRangeFilter("$1", "$2")}
      GROUP BY 1`,
    [fromDay, toDay],
  )) as Row[];

  const byPart = new Map<DayPartId, Row>(
    rows.map((row) => [row.part as DayPartId, row]),
  );

  // Se devuelven en el orden del dia, no en el que los agrupo Postgres.
  return DAY_PARTS.flatMap((part) => {
    const row = byPart.get(part.id);
    if (!row) return [];
    const values = Object.fromEntries(
      METRICS.map((metric) => [metric.key, num(row[`avg_${metric.key}`])]),
    ) as MetricValues;
    const counts = Object.fromEntries(
      METRICS.map((metric) => [metric.key, Number(row[`n_${metric.key}`] ?? 0)]),
    ) as Record<MetricKey, number>;
    return [{ ...values, part: part.id, total: Number(row.total ?? 0), counts }];
  });
}
