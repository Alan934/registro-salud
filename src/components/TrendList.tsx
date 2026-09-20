import { METRIC_BY_KEY, formatValue } from "@/lib/metrics";
import { trendText, type Trend } from "@/lib/trends";

/**
 * Cuánto cambió cada métrica contra el período anterior. La flecha dice la
 * dirección, no si está bien o mal: bajar de peso y bajar el oxígeno en sangre
 * no significan lo mismo, por eso la flecha nunca se pinta de verde ni de rojo.
 */
export function TrendList({
  trends,
  previousLabel,
}: {
  trends: Trend[];
  previousLabel: string;
}) {
  if (trends.length === 0) {
    return (
      <p className="text-sm text-muted">
        Todavía no hay con qué comparar: no hay tomas en el período anterior (
        {previousLabel}).
      </p>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {trends.map((trend) => {
        const metric = METRIC_BY_KEY[trend.key];
        return (
          <li
            key={trend.key}
            className="flex items-center gap-3 rounded-xl bg-surface-soft px-3 py-2.5"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center
                         rounded-full bg-surface text-muted"
            >
              <TrendArrow direction={trend.direction} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-muted">{metric.label}</p>
              <p className="text-sm">
                <strong className="tabular-nums">
                  {formatValue(trend.key, trend.current)}
                </strong>{" "}
                <span className="text-muted">{metric.unit}</span>
              </p>
            </div>

            <span className="shrink-0 text-sm text-muted tabular-nums">
              <span aria-hidden="true">
                {trend.direction === "flat"
                  ? "="
                  : `${trend.direction === "up" ? "+" : "−"}${formatValue(
                      trend.key,
                      Math.abs(trend.delta),
                    )}`}
              </span>
              <span className="sr-only">{trendText(trend)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function TrendArrow({ direction }: { direction: Trend["direction"] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "flat" ? (
        <path d="M5 12h14" />
      ) : direction === "up" ? (
        <path d="M12 19V5m0 0-6 6m6-6 6 6" />
      ) : (
        <path d="M12 5v14m0 0 6-6m-6 6-6-6" />
      )}
    </svg>
  );
}
