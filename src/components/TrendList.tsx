import { METRIC_BY_KEY, formatValue } from "@/lib/metrics";
import { trendText, type Trend } from "@/lib/trends";

/**
 * Cuánto cambió cada métrica contra el período anterior. La flecha dice la
 * dirección, no si está bien o mal: eso depende de la métrica y lo ve el médico.
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
        Todavía no hay con qué comparar: no hay tomas en el período anterior
        ({previousLabel}).
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
            className="flex items-baseline justify-between gap-3
                       rounded-xl bg-surface-soft px-3 py-2"
          >
            <span className="text-sm text-muted">{metric.label}</span>

            <span className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="text-sm">
                <strong className="tabular-nums">
                  {formatValue(trend.key, trend.current)}
                </strong>{" "}
                <span className="text-muted">{metric.unit}</span>
              </span>

              <span className="text-xs text-muted tabular-nums">
                <span aria-hidden="true">
                  {trend.direction === "flat"
                    ? "="
                    : trend.direction === "up"
                      ? "↑"
                      : "↓"}{" "}
                  {trend.direction === "flat"
                    ? ""
                    : formatValue(trend.key, Math.abs(trend.delta))}
                </span>
                <span className="sr-only">{trendText(trend)}</span>
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
