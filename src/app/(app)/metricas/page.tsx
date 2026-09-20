import Link from "next/link";
import { AdherenceStrip } from "@/components/AdherenceStrip";
import { ChartGrid, toChartPoints } from "@/components/ChartGrid";
import { DayDetail } from "@/components/DayDetail";
import { DayPartPattern } from "@/components/DayPartPattern";
import { ExportButtons } from "@/components/ExportButtons";
import { MetricChips } from "@/components/MetricChips";
import { MoodSummaryCard } from "@/components/MoodSummaryCard";
import { PeriodControls } from "@/components/PeriodControls";
import { TagSummary } from "@/components/TagSummary";
import { TrendList } from "@/components/TrendList";
import { buildDayMarks, countMeasured, currentStreak } from "@/lib/insights";
import { summarizeMood } from "@/lib/mood";
import { periodQuery, previousPeriod, resolvePeriod } from "@/lib/period";
import { reportFileName } from "@/lib/pdf";
import {
  getDayPartAverages,
  getDaySummaries,
  getMeasurementsInRange,
  getMoodLogsInRange,
  getPeriodAverages,
  getTagCounts,
} from "@/lib/queries";
import { getHeightCm } from "@/lib/settings";
import { buildTrends } from "@/lib/trends";
import { METRICS, type MetricKey } from "@/lib/metrics";
import type { DaySummary, MetricValues } from "@/lib/model";
import { dayLabel, formatDayShort, todayKey } from "@/lib/tz";

export const dynamic = "force-dynamic";

/** Cuantos cuadraditos entran en la tira de constancia sin volverse una mancha. */
const STRIP_MAX_DAYS = 60;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Un día sin tomas: el molde para los que tienen sólo cómo se sintió. */
const EMPTY_DAY: DaySummary = {
  day: "",
  total: 0,
  note: null,
  counts: Object.fromEntries(METRICS.map((metric) => [metric.key, 0])) as Record<
    MetricKey,
    number
  >,
  ...(Object.fromEntries(
    METRICS.map((metric) => [metric.key, null]),
  ) as MetricValues),
};

/** "3 tomas · ver detalle", "sólo nota · ver detalle", etc. */
function dayHint(total: number, moods: number, note: string | null): string {
  if (total > 0) {
    return `${total} ${total === 1 ? "toma" : "tomas"} · ver detalle`;
  }
  if (moods > 0) return "sólo cómo se sintió · ver detalle";
  if (note) return "sólo nota · ver detalle";
  return "ver detalle";
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
  const today = todayKey();

  // Cada toma por separado sólo hace falta para el gráfico de la vista
  // "Cada toma". El detalle de cada día lo pide el navegador al desplegarlo.
  const [
    summaries,
    measurements,
    currentAverages,
    previousAverages,
    dayParts,
    tagCounts,
    heightCm,
    moodLogs,
  ] = await Promise.all([
    getDaySummaries(fromDay, toDay),
    view === "toma"
      ? getMeasurementsInRange(fromDay, toDay)
      : Promise.resolve([]),
    getPeriodAverages(fromDay, toDay),
    getPeriodAverages(previous.fromDay, previous.toDay),
    getDayPartAverages(fromDay, toDay),
    getTagCounts(fromDay, toDay),
    getHeightCm(),
    getMoodLogsInRange(fromDay, toDay),
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

  const mood = summarizeMood(moodLogs);

  // Cuántos registros de ánimo tiene cada día, para el detalle desplegable.
  const moodsByDay = new Map<string, number>();
  for (const log of moodLogs) {
    moodsByDay.set(log.day, (moodsByDay.get(log.day) ?? 0) + 1);
  }

  /*
    Un día puede tener sólo un registro de cómo se sintió, sin ninguna toma ni
    nota: esos días no vienen en el resumen por día (que sale de las tomas y
    las notas) y hay que sumarlos para que no queden invisibles.
  */
  const days = [...summaries];
  const known = new Set(summaries.map((summary) => summary.day));
  for (const day of moodsByDay.keys()) {
    if (known.has(day)) continue;
    days.push({
      ...EMPTY_DAY,
      day,
      counts: { ...EMPTY_DAY.counts },
    });
  }
  days.sort((a, b) => (a.day < b.day ? 1 : -1));

  // Un cuadradito por día del período; si son muchos se dibujan los últimos.
  const allMarks = buildDayMarks(fromDay, toDay, summaries);
  const marks = allMarks.slice(-STRIP_MAX_DAYS);

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

      {days.length === 0 ? (
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

          <ChartGrid
            points={points}
            lastPrefix={
              view === "dia" ? "promedio del último día" : "última lectura"
            }
            heightCm={heightCm}
          />

          <section className="card p-5">
            <h2 className="mb-1 text-lg font-semibold">
              Patrón por momento del día
            </h2>
            <p className="mb-3 text-sm text-muted">
              El promedio de la mañana, de la tarde y de la noche por separado.
              Todo junto en un solo número esa diferencia se pierde.
            </p>
            <DayPartPattern parts={dayParts} />
          </section>

          <section className="card p-5">
            <h2 className="mb-1 text-lg font-semibold">Etiquetas</h2>
            <p className="mb-3 text-sm text-muted">
              En qué contexto se midió. Una presión en reposo y otra después de
              caminar no se leen igual.
            </p>
            <TagSummary counts={tagCounts} />
          </section>

          <section className="card p-5">
            <h2 className="mb-1 text-lg font-semibold">Cómo se sintió</h2>
            <p className="mb-3 text-sm text-muted">
              El promedio del período, día por día, y los síntomas que se
              repitieron.
            </p>
            <MoodSummaryCard summary={mood} />
          </section>

          <section className="card p-5">
            <h2 className="mb-1 text-lg font-semibold">Constancia</h2>
            <p className="mb-3 text-sm text-muted">
              Qué días del período quedaron registrados y cuáles no.
            </p>
            <AdherenceStrip
              marks={marks}
              measured={countMeasured(allMarks)}
              total={allMarks.length}
              streak={
                toDay === today ? currentStreak(summaries, today) : undefined
              }
              caption={
                allMarks.length > marks.length
                  ? `La tira muestra los últimos ${marks.length} días del período.`
                  : undefined
              }
            />
          </section>

          <section className="card p-5">
            <h2 className="mb-1 text-lg font-semibold">
              Comparado con el período anterior
            </h2>
            <p className="mb-3 text-sm text-muted">
              Contra los {period.days} {period.days === 1 ? "día" : "días"} de
              antes ({formatDayShort(previous.fromDay)} al{" "}
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

          <section className="card p-5">
            <h2 className="mb-1 text-lg font-semibold">Detalle por día</h2>
            <p className="mb-3 text-sm text-muted">
              Tocá un día para ver cada toma con su horario.
            </p>

            <ul className="divide-y divide-line">
              {days.map((summary) => (
                <li key={summary.day} className="py-3 first:pt-0 last:pb-0">
                  <DayDetail
                    day={summary.day}
                    total={summary.total}
                    moodCount={moodsByDay.get(summary.day) ?? 0}
                    note={summary.note}
                    backTo={backTo}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">
                        {dayLabel(summary.day)}
                      </span>
                      <span className="text-xs text-muted">
                        {dayHint(
                          summary.total,
                          moodsByDay.get(summary.day) ?? 0,
                          summary.note,
                        )}
                      </span>
                    </div>
                    {summary.total > 0 ? (
                      <div className="mt-2">
                        <MetricChips values={summary} counts={summary.counts} />
                      </div>
                    ) : null}
                  </DayDetail>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
