import Link from "next/link";
import { ChartGrid, toChartPoints } from "@/components/ChartGrid";
import { ExportButtons } from "@/components/ExportButtons";
import { MeasurementList } from "@/components/MeasurementList";
import { MetricChips } from "@/components/MetricChips";
import { PeriodControls } from "@/components/PeriodControls";
import { TrendList } from "@/components/TrendList";
import type { Measurement } from "@/lib/model";
import { periodQuery, previousPeriod, resolvePeriod } from "@/lib/period";
import { reportFileName } from "@/lib/pdf";
import {
  getDaySummaries,
  getMeasurementsInRange,
  getPeriodAverages,
} from "@/lib/queries";
import { buildTrends } from "@/lib/trends";
import { dayLabel, formatDayShort } from "@/lib/tz";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MetricsPage({
  searchParams,
}: PageProps<"/metricas">) {
  const params = await searchParams;
  const period = resolvePeriod({
    dias: first(params.dias),
    desde: first(params.desde),
    hasta: first(params.hasta),
  });
  const view = first(params.vista) === "toma" ? "toma" : "dia";
  const { fromDay, toDay } = period;
  const previous = previousPeriod(period);

  const [summaries, measurements, currentAverages, previousAverages] =
    await Promise.all([
      getDaySummaries(fromDay, toDay),
      getMeasurementsInRange(fromDay, toDay),
      getPeriodAverages(fromDay, toDay),
      getPeriodAverages(previous.fromDay, previous.toDay),
    ]);

  const trends = buildTrends(currentAverages, previousAverages);

  const points =
    view === "dia"
      ? toChartPoints(
          [...summaries].reverse(),
          (summary) => formatDayShort(summary.day),
          (summary) =>
            summary.total > 1 ? `· promedio de ${summary.total} tomas` : "",
        )
      : toChartPoints(measurements, (m) => `${formatDayShort(m.day)} ${m.time}`);

  const byDay = new Map<string, Measurement[]>();
  for (const m of measurements) {
    const list = byDay.get(m.day);
    if (list) list.push(m);
    else byDay.set(m.day, [m]);
  }

  const query = new URLSearchParams({
    ...Object.fromEntries(
      Object.entries(periodQuery(period)).map(([key, value]) => [
        key,
        String(value),
      ]),
    ),
    vista: view,
  });
  const backTo = `/metricas?${query}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Métricas</h1>
        <p className="mt-1 text-sm text-muted">
          Promedio por día cuando hay varias tomas, y el detalle de cada horario
          más abajo.
        </p>
      </div>

      <PeriodControls period={period} view={view} />

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {period.custom ? "Del" : "Últimos"}{" "}
              <strong className="font-medium text-fg">
                {period.custom
                  ? `${formatDayShort(fromDay)} al ${formatDayShort(toDay)}`
                  : period.label}
              </strong>
            </p>
            <ExportButtons
              period={periodQuery(period)}
              fileName={reportFileName(fromDay, toDay)}
            />
          </div>

          <section className="card p-5">
            <h2 className="mb-1 text-lg font-semibold">
              Comparado con el período anterior
            </h2>
            <p className="mb-3 text-sm text-muted">
              Contra los {period.days}{" "}
              {period.days === 1 ? "día" : "días"} de antes (
              {formatDayShort(previous.fromDay)} al{" "}
              {formatDayShort(previous.toDay)}). La flecha indica en qué
              dirección cambió el promedio.
            </p>
            <TrendList
              trends={trends}
              previousLabel={`${formatDayShort(previous.fromDay)} al ${formatDayShort(
                previous.toDay,
              )}`}
            />
          </section>

          <ChartGrid points={points} />

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
                          {summary.total === 0
                            ? "sólo nota · ver detalle"
                            : `${summary.total} ${
                                summary.total === 1 ? "toma" : "tomas"
                              } · ver detalle`}
                        </span>
                      </div>
                      {summary.total > 0 ? (
                        <div className="mt-2">
                          <MetricChips
                            values={summary}
                            counts={summary.counts}
                          />
                        </div>
                      ) : null}
                    </summary>

                    <div className="mt-3 rounded-xl bg-surface-soft p-3">
                      {summary.total > 0 ? (
                        <MeasurementList
                          measurements={byDay.get(summary.day) ?? []}
                          backTo={backTo}
                        />
                      ) : null}
                      {summary.note ? (
                        <p
                          className={
                            summary.total > 0
                              ? "mt-3 border-t border-line pt-3 text-sm"
                              : "text-sm"
                          }
                        >
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
