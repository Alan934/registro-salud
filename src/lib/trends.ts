import { METRICS, METRIC_BY_KEY, type MetricKey } from "@/lib/metrics";

/**
 * Comparación de un período contra el anterior del mismo largo. Se informa la
 * dirección y cuánto cambió, sin decir si eso es bueno o malo: bajar de peso y
 * bajar el oxígeno en sangre no significan lo mismo, y eso lo lee el médico.
 */

export type Averages = Partial<
  Record<MetricKey, { avg: number; count: number }>
>;

export type Trend = {
  key: MetricKey;
  current: number;
  previous: number;
  /** Diferencia ya redondeada a los decimales de la métrica. */
  delta: number;
  direction: "up" | "down" | "flat";
};

export function buildTrends(
  current: Averages,
  previous: Averages,
): Trend[] {
  const trends: Trend[] = [];
  for (const metric of METRICS) {
    const now = current[metric.key];
    const before = previous[metric.key];
    if (!now || !before) continue;

    const decimals = METRIC_BY_KEY[metric.key].decimals;
    const delta = Number((now.avg - before.avg).toFixed(decimals));
    trends.push({
      key: metric.key,
      current: now.avg,
      previous: before.avg,
      delta,
      direction: delta === 0 ? "flat" : delta > 0 ? "up" : "down",
    });
  }
  return trends;
}

/** "subió 4", "bajó 1.2", "sin cambios" — para lectores de pantalla. */
export function trendText(trend: Trend): string {
  const decimals = METRIC_BY_KEY[trend.key].decimals;
  const amount = Math.abs(trend.delta).toFixed(decimals);
  const unit = METRIC_BY_KEY[trend.key].unit;
  if (trend.direction === "flat") return "sin cambios";
  return `${trend.direction === "up" ? "subió" : "bajó"} ${amount} ${unit}`;
}
