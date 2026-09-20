import { MoodFace } from "@/components/MoodFace";
import { SYMPTOM_BY_ID, moodLevel, type MoodSummary } from "@/lib/mood";
import { formatDayShort } from "@/lib/tz";

/** Cuantos dias se dibujan en la tira; con mas se vuelve una mancha. */
const STRIP_MAX_DAYS = 30;

/**
 * Cómo se sintió en el período: el promedio, un cuadradito por día (el color
 * dice cómo estuvo) y los síntomas que más se repitieron.
 */
export function MoodSummaryCard({ summary }: { summary: MoodSummary }) {
  if (summary.total === 0 || summary.average === null) {
    return (
      <p className="text-sm text-muted">
        Todavía no hay registros en este período. Se cargan desde{" "}
        <strong className="font-medium text-fg">Hoy</strong>.
      </p>
    );
  }

  const level = moodLevel(summary.average);
  const days = summary.byDay.slice(-STRIP_MAX_DAYS);
  const maxSymptom = summary.symptoms[0]?.total ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <MoodFace value={summary.average} className="h-14 w-14 shrink-0" />
        <div>
          <p className="text-xl font-semibold" style={{ color: level.color }}>
            {level.label}
          </p>
          <p className="text-sm text-muted tabular-nums">
            {summary.average.toFixed(1)} de 10 · {summary.total}{" "}
            {summary.total === 1 ? "registro" : "registros"} en{" "}
            {summary.byDay.length}{" "}
            {summary.byDay.length === 1 ? "día" : "días"}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <ul className="flex gap-0.5">
          {days.map((day) => {
            const dayLevel = moodLevel(day.mood);
            return (
              <li
                key={day.day}
                title={`${formatDayShort(day.day)} · ${dayLevel.label} (${day.mood.toFixed(1)})`}
                className="h-5 flex-1 rounded-sm"
                style={{ background: dayLevel.color }}
              >
                <span className="sr-only">
                  {formatDayShort(day.day)}: {dayLevel.label}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-between text-xs text-muted tabular-nums">
          <span>{days.length > 0 ? formatDayShort(days[0].day) : ""}</span>
          <span>
            {days.length > 0 ? formatDayShort(days[days.length - 1].day) : ""}
          </span>
        </div>
        <p className="text-xs text-muted">
          Un cuadradito por día con registro
          {summary.byDay.length > days.length
            ? ` (los últimos ${days.length})`
            : ""}
          .
        </p>
      </div>

      {summary.symptoms.length > 0 ? (
        <div className="space-y-2 border-t border-line pt-3">
          <p className="eyebrow">Síntomas anotados</p>
          <ul className="space-y-2">
            {summary.symptoms.map((symptom) => (
              <li key={symptom.id} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm">
                  {SYMPTOM_BY_ID[symptom.id]?.label ?? symptom.id}
                </span>
                <span
                  aria-hidden="true"
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-soft"
                >
                  <span
                    className="block h-full rounded-full bg-accent/60"
                    style={{ width: `${(symptom.total / maxSymptom) * 100}%` }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right text-sm text-muted tabular-nums">
                  {symptom.total}{" "}
                  {symptom.total === 1 ? "día" : "veces"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
