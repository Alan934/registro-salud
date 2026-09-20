import { MetricChips } from "@/components/MetricChips";
import { DAY_PARTS, type DayPartSummary } from "@/lib/dayparts";

/**
 * El patron del dia: promedio de las tomas de la mañana, de la tarde y de la
 * noche por separado. Mezcladas en un solo promedio esa diferencia se pierde,
 * y es justo lo que se mira cuando la presion sube siempre a la misma hora.
 */
export function DayPartPattern({ parts }: { parts: DayPartSummary[] }) {
  if (parts.length === 0) {
    return (
      <p className="text-sm text-muted">
        Todavía no hay tomas en este período.
      </p>
    );
  }

  const max = Math.max(...parts.map((part) => part.total));

  return (
    <ul className="space-y-3">
      {parts.map((part) => {
        const meta = DAY_PARTS.find((item) => item.id === part.part);
        return (
          <li key={part.part} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium">
                {meta?.label}{" "}
                <span className="font-normal text-muted">({meta?.hint})</span>
              </span>
              <span className="text-xs text-muted tabular-nums">
                {part.total} {part.total === 1 ? "toma" : "tomas"}
              </span>
            </div>

            <div
              aria-hidden="true"
              className="h-1.5 overflow-hidden rounded-full bg-surface-soft"
            >
              <div
                className="h-full rounded-full bg-accent/60"
                style={{ width: `${max === 0 ? 0 : (part.total / max) * 100}%` }}
              />
            </div>

            <MetricChips values={part} counts={part.counts} />
          </li>
        );
      })}
    </ul>
  );
}
