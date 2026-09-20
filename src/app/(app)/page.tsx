import Link from "next/link";
import { DailyNoteForm } from "@/components/DailyNoteForm";
import { MeasurementForm } from "@/components/MeasurementForm";
import { MeasurementList } from "@/components/MeasurementList";
import { MetricChips } from "@/components/MetricChips";
import { METRIC_BY_KEY, METRICS, formatValue } from "@/lib/metrics";
import {
  getDaySummary,
  getLatestValues,
  getMeasurementsForDay,
} from "@/lib/queries";
import {
  formatDayLong,
  formatNowText,
  toDateTimeLocal,
  todayKey,
} from "@/lib/tz";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const day = todayKey();
  const [measurements, summary, latest] = await Promise.all([
    getMeasurementsForDay(day),
    getDaySummary(day),
    getLatestValues(),
  ]);

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{formatDayLong(day)}</p>
        <h1 className="text-2xl font-semibold">Hoy</h1>
      </div>

      <section className="card p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Cargar una toma</h2>
        <p className="mb-4 text-sm text-muted">
          Completá solo lo que hayas medido. Se guarda con la hora de este
          momento salvo que indiques otra fecha.
        </p>
        <MeasurementForm
          mode="create"
          nowValue={toDateTimeLocal(now)}
          nowText={formatNowText(now)}
        />
      </section>

      {summary && summary.total > 0 ? (
        <section className="card p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">Promedio de hoy</h2>
            <span className="text-sm text-muted">
              {summary.total} {summary.total === 1 ? "toma" : "tomas"}
            </span>
          </div>
          <MetricChips values={summary} counts={summary.counts} />
        </section>
      ) : null}

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Tomas de hoy</h2>
        <MeasurementList measurements={measurements} />
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold">Nota del día</h2>
        <p className="mb-3 text-sm text-muted">
          Algo para recordar de hoy: cómo se sintió, qué comió, medicación.
        </p>
        <DailyNoteForm day={day} note={summary?.note ?? null} />
      </section>

      {measurements.length === 0 && Object.keys(latest).length > 0 ? (
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-semibold">Últimos valores</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {METRICS.map((metric) => {
              const item = latest[metric.key];
              if (!item) return null;
              return (
                <li
                  key={metric.key}
                  className="flex items-baseline justify-between gap-2
                             rounded-xl bg-surface-soft px-3 py-2"
                >
                  <span className="text-sm text-muted">
                    {METRIC_BY_KEY[metric.key].label}
                  </span>
                  <span className="text-sm">
                    <strong className="tabular-nums">
                      {formatValue(metric.key, item.value)}
                    </strong>{" "}
                    <span className="text-muted">{metric.unit}</span>
                    <span className="ml-2 text-xs text-muted tabular-nums">
                      {item.day === day ? item.time : item.day}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <p className="text-center text-sm">
        <Link href="/metricas" className="text-accent hover:underline">
          Ver métricas y días anteriores →
        </Link>
      </p>
    </div>
  );
}
