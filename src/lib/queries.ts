import "server-only";
import { sql } from "@/lib/db";
import { METRICS, type MetricKey } from "@/lib/metrics";
import type {
  DaySummary,
  Measurement,
  MetricValues,
  NewMeasurement,
} from "@/lib/model";
import { TIME_ZONE } from "@/lib/tz";

export type { DaySummary, Measurement, MetricValues, NewMeasurement };

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

/** Tomas de un dia puntual, de la mas temprana a la mas tarde. */
export async function getMeasurementsForDay(
  day: string,
): Promise<Measurement[]> {
  const rows = (await sql.query(
    `SELECT ${SELECT_COLUMNS}
       FROM measurements
      WHERE (measured_at AT TIME ZONE '${TIME_ZONE}')::date = $1::date
      ORDER BY measured_at ASC`,
    [day],
  )) as Row[];
  return rows.map(toMeasurement);
}

/** Ultimas tomas cargadas, sin importar el dia. */
export async function getRecentMeasurements(
  limit = 10,
): Promise<Measurement[]> {
  const rows = (await sql.query(
    `SELECT ${SELECT_COLUMNS}
       FROM measurements
      ORDER BY measured_at DESC
      LIMIT $1`,
    [limit],
  )) as Row[];
  return rows.map(toMeasurement);
}

const DAY_AGGREGATE = `
  SELECT d.day,
         d.total,
         ${METRICS.map((m) => `d.avg_${m.key}, d.n_${m.key}`).join(", ")},
         n.note
    FROM (
      SELECT to_char(measured_at AT TIME ZONE '${TIME_ZONE}', 'YYYY-MM-DD') AS day,
             count(*)::int AS total,
             ${METRICS.map(
               (m) =>
                 `avg(${m.key})::float8 AS avg_${m.key}, count(${m.key})::int AS n_${m.key}`,
             ).join(", ")}
        FROM measurements
       GROUP BY 1
    ) d
    LEFT JOIN daily_notes n ON n.day = d.day::date
`;

/** Resumen por dia (promedios), del mas reciente al mas viejo. */
export async function getDaySummaries(
  fromDay: string,
  toDay: string,
): Promise<DaySummary[]> {
  const rows = (await sql.query(
    `${DAY_AGGREGATE} WHERE d.day >= $1 AND d.day <= $2 ORDER BY d.day DESC`,
    [fromDay, toDay],
  )) as Row[];
  return rows.map(toDaySummary);
}

export async function getDaySummary(day: string): Promise<DaySummary | null> {
  const rows = (await sql.query(`${DAY_AGGREGATE} WHERE d.day = $1`, [
    day,
  ])) as Row[];
  return rows[0] ? toDaySummary(rows[0]) : null;
}

/** Todas las tomas de un rango, para ver el detalle por horario. */
export async function getMeasurementsInRange(
  fromDay: string,
  toDay: string,
): Promise<Measurement[]> {
  const rows = (await sql.query(
    `SELECT ${SELECT_COLUMNS}
       FROM measurements
      WHERE (measured_at AT TIME ZONE '${TIME_ZONE}')::date BETWEEN $1::date AND $2::date
      ORDER BY measured_at ASC`,
    [fromDay, toDay],
  )) as Row[];
  return rows.map(toMeasurement);
}

export async function getDailyNote(day: string): Promise<string | null> {
  const rows = (await sql.query(
    `SELECT note FROM daily_notes WHERE day = $1::date`,
    [day],
  )) as Row[];
  return (rows[0]?.note as string | undefined) ?? null;
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

export type LatestValue = {
  value: number;
  day: string;
  time: string;
};

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
