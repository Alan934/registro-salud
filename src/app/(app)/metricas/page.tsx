import Link from "next/link";
import { ChartGrid, toChartPoints } from "@/components/ChartGrid";
import { MeasurementList } from "@/components/MeasurementList";
import { MetricChips } from "@/components/MetricChips";
import { RANGES } from "@/lib/chart-groups";
import type { Measurement } from "@/lib/model";
import { getDaySummaries, getMeasurementsInRange } from "@/lib/queries";
import { dayLabel, formatDayShort, shiftDay, todayKey } from "@/lib/tz";

export const dynamic = "force-dynamic";

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

  const points =
    view === "dia"
      ? toChartPoints(
          [...summaries].reverse(),
          (summary) => formatDayShort(summary.day),
          (summary) =>
            summary.total > 1 ? `· promedio de ${summary.total} tomas` : "",
        )
      : toChartPoints(
          measurements,
          (m) => `${formatDayShort(m.day)} ${m.time}`,
        );

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
              aria-current={range.days === days ? "page" : undefined}
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
              aria-current={option.id === view ? "page" : undefined}
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
