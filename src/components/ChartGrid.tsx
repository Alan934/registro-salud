import Link from "next/link";
import { MetricChart, type ChartPoint } from "@/components/MetricChart";
import { MetricIcon } from "@/components/MetricIcon";
import { MetricRangeBar, RangeBar } from "@/components/RangeBar";
import { BMI_SCALE, bmiFor } from "@/lib/bmi";
import { CHART_GROUPS, type ChartGroup } from "@/lib/chart-groups";
import { formatValue, type MetricKey } from "@/lib/metrics";
import { TONE_PILL, worstTone, zoneFor, zoneIn } from "@/lib/zones";

type SerieStats = {
  key: MetricKey;
  label: string;
  last: number | null;
  avg: number | null;
  min: number | null;
  max: number | null;
  count: number;
};

/** Grilla de graficos, una tarjeta por metrica con datos. */
export function ChartGrid({
  points,
  lastPrefix = "última lectura",
  heightCm = null,
  settingsHref = "/ajustes",
}: {
  points: ChartPoint[];
  /** Que es el valor grande: la ultima toma o el promedio del ultimo dia. */
  lastPrefix?: string;
  /** Altura cargada en Ajustes; sin ella la tarjeta de peso no muestra IMC. */
  heightCm?: number | null;
  /** Adonde se manda a cargar la altura (la demo no tiene esa pantalla). */
  settingsHref?: string | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CHART_GROUPS.map((group) => {
        const stats = group.series.map((serie) =>
          statsFor(points, serie.key, serie.label),
        );
        if (stats.every((item) => item.count === 0)) return null;

        return (
          <GroupCard
            key={group.id}
            group={group}
            stats={stats}
            points={points}
            lastLabel={lastLabelFor(points, group.series.map((s) => s.key))}
            lastPrefix={lastPrefix}
            heightCm={heightCm}
            settingsHref={settingsHref}
          />
        );
      })}
    </div>
  );
}

function GroupCard({
  group,
  stats,
  points,
  lastLabel,
  lastPrefix,
  heightCm,
  settingsHref,
}: {
  group: ChartGroup;
  stats: SerieStats[];
  points: ChartPoint[];
  lastLabel: string | null;
  lastPrefix: string;
  heightCm: number | null;
  settingsHref: string | null;
}) {
  const zones = stats.map((item) => zoneFor(item.key, item.last));
  const tone = worstTone(zones.flatMap((zone) => (zone ? [zone.tone] : [])));
  const zoneLabel = tone
    ? (zones.find((zone) => zone?.tone === tone)?.label ?? null)
    : null;

  return (
    <section
      id={`g-${group.id}`}
      className={`card scroll-mt-20 p-4 ${group.className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-semibold">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "var(--series-soft)",
                color: "var(--series)",
              }}
            >
              <MetricIcon metricKey={stats[0].key} />
            </span>
            {group.title}
          </h3>

          <p className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <strong className="text-3xl leading-none font-bold tabular-nums">
              {joinValues(
                stats.map((item) => item.last),
                stats.map((item) => item.key),
              )}
            </strong>
            <span className="text-sm text-muted">{group.unit}</span>
          </p>

          {lastLabel ? (
            <p className="mt-1 text-xs text-muted">
              {lastPrefix} · {lastLabel}
            </p>
          ) : null}
        </div>

        {zoneLabel && tone ? (
          <span className={`pill ${TONE_PILL[tone]} shrink-0`}>{zoneLabel}</span>
        ) : null}
      </div>

      <div className="mt-3 space-y-2.5">
        {stats.map((item) => (
          <MetricRangeBar
            key={item.key}
            metricKey={item.key}
            value={item.last}
            label={stats.length > 1 ? item.label : undefined}
          />
        ))}

        {group.id === "weight" ? (
          <BmiBlock
            weightKg={stats[0].last}
            heightCm={heightCm}
            settingsHref={settingsHref}
          />
        ) : null}
      </div>

      {group.series.length > 1 ? (
        <ul className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
          {group.series.map((serie) => (
            <li key={serie.key} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: `var(${serie.colorVar})` }}
              />
              {serie.label}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-2">
        <MetricChart
          series={group.series}
          points={points}
          unit={group.unit}
          decimals={group.decimals}
          normal={group.normal}
        />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
        <Stat
          label="Mínimo"
          value={joinValues(
            stats.map((item) => item.min),
            stats.map((item) => item.key),
          )}
        />
        <Stat
          label="Promedio"
          value={joinValues(
            stats.map((item) => item.avg),
            stats.map((item) => item.key),
          )}
        />
        <Stat
          label="Máximo"
          value={joinValues(
            stats.map((item) => item.max),
            stats.map((item) => item.key),
          )}
        />
      </dl>
    </section>
  );
}

/**
 * El IMC del ultimo peso. Sale de la altura guardada en Ajustes: sin ella no
 * hay cuenta posible, asi que en vez del dato se ofrece cargarla.
 */
function BmiBlock({
  weightKg,
  heightCm,
  settingsHref,
}: {
  weightKg: number | null;
  heightCm: number | null;
  settingsHref: string | null;
}) {
  if (heightCm === null) {
    if (settingsHref === null) return null;
    return (
      <p className="text-xs text-muted">
        <Link href={settingsHref} className="text-accent hover:underline">
          Cargá tu altura
        </Link>{" "}
        y acá aparece el IMC.
      </p>
    );
  }

  const bmi = bmiFor(weightKg, heightCm);
  if (bmi === null) return null;
  const zone = zoneIn(BMI_SCALE, bmi);

  return (
    <div className="space-y-1 border-t border-line pt-2.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted">IMC ({heightCm} cm)</span>
        <span className="flex items-baseline gap-2">
          <strong className="text-sm font-semibold tabular-nums">
            {bmi.toFixed(1)}
          </strong>
          {zone ? (
            <span className={`pill ${TONE_PILL[zone.tone]}`}>{zone.label}</span>
          ) : null}
        </span>
      </div>
      <RangeBar scale={BMI_SCALE} value={bmi} unit="kg/m²" decimals={1} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/** "125/83" para la presion, "97" para las metricas de un solo valor. */
function joinValues(values: Array<number | null>, keys: MetricKey[]): string {
  return values.map((value, index) => formatValue(keys[index], value)).join("/");
}

function statsFor(
  points: ChartPoint[],
  key: MetricKey,
  label: string,
): SerieStats {
  const values = points
    .map((point) => point[key])
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) {
    return { key, label, last: null, avg: null, min: null, max: null, count: 0 };
  }

  return {
    key,
    label,
    last: values[values.length - 1],
    avg: values.reduce((sum, value) => sum + value, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  };
}

/** La etiqueta del ultimo punto con datos: "19/09" o "19/09 08:15". */
function lastLabelFor(points: ChartPoint[], keys: MetricKey[]): string | null {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index];
    if (keys.some((key) => typeof point[key] === "number")) return point.label;
  }
  return null;
}

/** Arma los puntos del grafico a partir de filas con valores por metrica. */
export function toChartPoints<
  T extends {
    systolic: number | null;
    diastolic: number | null;
    pulse: number | null;
    spo2: number | null;
    glucose: number | null;
    weight: number | null;
    temperature: number | null;
  },
>(rows: T[], label: (row: T) => string, caption?: (row: T) => string) {
  return rows.map((row) => ({
    label: label(row),
    caption: caption?.(row) ?? "",
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
    spo2: row.spo2,
    glucose: row.glucose,
    weight: row.weight,
    temperature: row.temperature,
  }));
}
