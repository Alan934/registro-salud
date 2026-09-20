import Link from "next/link";
import {
  MetricChart,
  type ChartPoint,
  type ChartSeries,
} from "@/components/MetricChart";
import { MeasurementList } from "@/components/MeasurementList";
import { MetricChips } from "@/components/MetricChips";
import { METRIC_BY_KEY } from "@/lib/metrics";
import {
  getDaySummaries,
  getMeasurementsInRange,
  type Measurement,
} from "@/lib/queries";
import {
  dayLabel,
  formatDayShort,
  shiftDay,
  todayKey,
} from "@/lib/tz";

export const dynamic = "force-dynamic";

const RANGES = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
  { days: 365, label: "1 año" },
] as const;

type Group = {
  id: string;
  title: string;
  unit: string;
  decimals: number;
  className: string;
  series: ChartSeries[];
  normal?: [number, number];
};

const GROUPS: Group[] = [
  {
    id: "pressure",
    title: "Presión arterial",
    unit: "mmHg",
    decimals: 0,
    className: "series-pressure",
    series: [
      { key: "systolic", label: "Máxima", colorVar: "--series" },
      { key: "diastolic", label: "Mínima", colorVar: "--series-2" },
    ],
  },
  {
    id: "pulse",
    title: "Pulsaciones",
    unit: "lpm",
    decimals: 0,
    className: "series-pulse",
    normal: METRIC_BY_KEY.pulse.normal,
    series: [{ key: "pulse", label: "Pulso", colorVar: "--series" }],
  },
  {
    id: "spo2",
    title: "Oxígeno en sangre",
    unit: "%",
    decimals: 0,
    className: "series-spo2",
    normal: METRIC_BY_KEY.spo2.normal,
    series: [{ key: "spo2", label: "Oxígeno", colorVar: "--series" }],
  },
  {
    id: "glucose",
    title: "Glucosa",
    unit: "mg/dL",
    decimals: 0,
    className: "series-glucose",
    normal: METRIC_BY_KEY.glucose.normal,
    series: [{ key: "glucose", label: "Glucosa", colorVar: "--series" }],
  },
  {
    id: "weight",
    title: "Peso",
    unit: "kg",
    decimals: 1,
    className: "series-weight",
    series: [{ key: "weight", label: "Peso", colorVar: "--series" }],
  },
  {
    id: "temperature",
    title: "Temperatura",
    unit: "°C",
    decimals: 1,
    className: "series-temperature",
    normal: METRIC_BY_KEY.temperature.normal,
    series: [
      { key: "temperature", label: "Temperatura", colorVar: "--series" },
    ],
  },
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MetricsPage({
  searchParams,
}: PageProps<"/metricas">) {
  const params = await searchParams;
  const days = RANGES.some((r) => r.days === Number(first(params.dias)))
    ? Number(first(params.dias))
    : 30;
  const view = first(params.vista) === "toma" ? "toma" : "dia";

  const toDay = todayKey();
  const fromDay = shiftDay(toDay, -(days - 1));

  const [summaries, measurements] = await Promise.all([
    getDaySummaries(fromDay, toDay),
    getMeasurementsInRange(fromDay, toDay),
  ]);

  const ascendingDays = [...summaries].reverse();

  const points: ChartPoint[] =
    view === "dia"
      ? ascendingDays.map((summary) => ({
          label: formatDayShort(summary.day),
          caption:
            summary.total > 1 ? `· promedio de ${summary.total} tomas` : "",
          systolic: summary.systolic,
          diastolic: summary.diastolic,
          pulse: summary.pulse,
          spo2: summary.spo2,
          glucose: summary.glucose,
          weight: summary.weight,
          temperature: summary.temperature,
        }))
      : measurements.map((m) => ({
          label: `${formatDayShort(m.day)} ${m.time}`,
          systolic: m.systolic,
          diastolic: m.diastolic,
          pulse: m.pulse,
          spo2: m.spo2,
          glucose: m.glucose,
          weight: m.weight,
          temperature: m.temperature,
        }));

  const byDay = new Map<string, Measurement[]>();
  for (const m of measurements) {
    const list = byDay.get(m.day);
    if (list) list.push(m);
    else byDay.set(m.day, [m]);
  }

  const backTo = `/metricas?dias=${days}&vista=${view}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Métricas</h1>
        <p className="mt-1 text-sm text-muted">
          Promedio por día cuando hay varias tomas, y el detalle de cada horario
          más abajo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-xl bg-surface-soft p-1">
          {RANGES.map((range) => (
            <Link
              key={range.days}
              href={{
                pathname: "/metricas",
                query: { dias: range.days, vista: view },
              }}
              aria-current={range.days === days ? "true" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                range.days === days
                  ? "bg-surface font-medium text-fg shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              {range.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-1 rounded-xl bg-surface-soft p-1">
          {(
            [
              { id: "dia", label: "Por día" },
              { id: "toma", label: "Cada toma" },
            ] as const
          ).map((option) => (
            <Link
              key={option.id}
              href={{
                pathname: "/metricas",
                query: { dias: days, vista: option.id },
              }}
              aria-current={option.id === view ? "true" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                option.id === view
                  ? "bg-surface font-medium text-fg shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-muted">
            Todavía no hay tomas en este período.{" "}
            <Link href="/" className="text-accent hover:underline">
              Cargar una
            </Link>
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {GROUPS.map((group) => {
              const hasData = points.some((point) =>
                group.series.some(
                  (serie) => typeof point[serie.key] === "number",
                ),
              );
              if (!hasData) return null;

              return (
                <section
                  key={group.id}
                  className={`card p-4 ${group.className}`}
                >
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-semibold">{group.title}</h2>
                    <span className="text-xs text-muted">{group.unit}</span>
                  </div>

                  {group.series.length > 1 ? (
                    <ul className="mb-2 flex flex-wrap gap-3 text-xs text-muted">
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

                  <MetricChart
                    series={group.series}
                    points={points}
                    unit={group.unit}
                    decimals={group.decimals}
                    normal={group.normal}
                  />
                </section>
              );
            })}
          </div>

          <section className="card p-5">
            <h2 className="mb-1 text-lg font-semibold">Detalle por día</h2>
            <p className="mb-3 text-sm text-muted">
              Tocá un día para ver cada toma con su horario.
            </p>

            <ul className="divide-y divide-line">
              {summaries.map((summary) => (
                <li key={summary.day} className="py-3 first:pt-0 last:pb-0">
                  <details>
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">
                          {dayLabel(summary.day)}
                        </span>
                        <span className="text-xs text-muted">
                          {summary.total}{" "}
                          {summary.total === 1 ? "toma" : "tomas"} · ver detalle
                        </span>
                      </div>
                      <div className="mt-2">
                        <MetricChips
                          values={summary}
                          counts={summary.counts}
                        />
                      </div>
                    </summary>

                    <div className="mt-3 rounded-xl bg-surface-soft p-3">
                      <MeasurementList
                        measurements={byDay.get(summary.day) ?? []}
                        backTo={backTo}
                      />
                      {summary.note ? (
                        <p className="mt-3 border-t border-line pt-3 text-sm">
                          <span className="font-medium">Nota del día: </span>
                          <span className="text-muted">{summary.note}</span>
                        </p>
                      ) : null}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
