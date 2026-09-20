import Link from "next/link";
import { AdherenceStrip } from "@/components/AdherenceStrip";
import { DailyNoteForm } from "@/components/DailyNoteForm";
import { MeasurementForm } from "@/components/MeasurementForm";
import { MeasurementList } from "@/components/MeasurementList";
import { MetricChips } from "@/components/MetricChips";
import { MetricTiles, toTileSeries } from "@/components/MetricTiles";
import { buildDayMarks, countMeasured, currentStreak } from "@/lib/insights";
import {
  getDaySummaries,
  getLatestValues,
  getMeasurementsForDay,
} from "@/lib/queries";
import {
  formatDayLong,
  formatNowText,
  shiftDay,
  toDateTimeLocal,
  todayKey,
} from "@/lib/tz";

export const dynamic = "force-dynamic";

/** Dias que se miran para la racha; de esos, los ultimos 14 se dibujan. */
const WINDOW_DAYS = 30;
const STRIP_DAYS = 14;

export default async function TodayPage() {
  const day = todayKey();
  const windowFrom = shiftDay(day, -(WINDOW_DAYS - 1));
  const stripFrom = shiftDay(day, -(STRIP_DAYS - 1));

  const [measurements, latest, recent] = await Promise.all([
    getMeasurementsForDay(day),
    getLatestValues(),
    getDaySummaries(windowFrom, day),
  ]);

  const now = new Date();
  const summary = recent.find((item) => item.day === day) ?? null;

  // getDaySummaries devuelve del mas nuevo al mas viejo; los graficos y la
  // tira de constancia se leen al reves.
  const ascending = [...recent].reverse();
  const marks = buildDayMarks(stripFrom, day, recent);
  const streak = currentStreak(recent, day);

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="bg-gradient-to-br from-accent-soft to-surface px-5 py-5">
          <p className="text-sm text-muted">{formatDayLong(day)}</p>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">Hoy</h1>
            <a href="#cargar" className="btn-primary">
              <PlusIcon />
              Cargar una toma
            </a>
          </div>

          {summary && summary.total > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="eyebrow">
                Promedio de hoy · {summary.total}{" "}
                {summary.total === 1 ? "toma" : "tomas"}
              </p>
              <MetricChips values={summary} counts={summary.counts} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Todavía no hay tomas de hoy. Cargá la primera cuando midas.
            </p>
          )}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="eyebrow mb-3">Constancia · últimos {STRIP_DAYS} días</h2>
        <AdherenceStrip
          marks={marks}
          measured={countMeasured(marks)}
          total={marks.length}
          streak={streak}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Tus categorías</h2>
          <Link href="/metricas" className="text-sm text-accent hover:underline">
            Ver todas las métricas →
          </Link>
        </div>
        <p className="text-sm text-muted">
          El último valor de cada una y en qué zona quedó. Tocá una para ver su
          gráfico.
        </p>
        <MetricTiles
          latest={latest}
          series={toTileSeries(ascending)}
          today={day}
        />
      </section>

      <section id="cargar" className="card scroll-mt-20 p-5 shadow-sm">
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

      <p className="text-center text-sm">
        <Link href="/metricas" className="text-accent hover:underline">
          Ver métricas y días anteriores →
        </Link>
      </p>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
