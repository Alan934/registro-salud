import { MetricChart, type ChartPoint } from "@/components/MetricChart";
import { CHART_GROUPS } from "@/lib/chart-groups";

/** Grilla de graficos, una tarjeta por metrica con datos. */
export function ChartGrid({ points }: { points: ChartPoint[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CHART_GROUPS.map((group) => {
        const hasData = points.some((point) =>
          group.series.some((serie) => typeof point[serie.key] === "number"),
        );
        if (!hasData) return null;

        return (
          <section key={group.id} className={`card p-4 ${group.className}`}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">{group.title}</h3>
              <span className="text-xs text-muted">{group.unit}</span>
            </div>

            {group.series.length > 1 ? (
              <ul className="mb-2 flex flex-wrap gap-3 text-xs text-muted">
                {group.series.map((serie) => (
                  <li key={serie.key} className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: `var(${serie.colorVar})` }}
                    />
                    {serie.label}
                  </li>
                ))}
              </ul>
            ) : null}

            <MetricChart
              series={group.series}
              points={points}
              unit={group.unit}
              decimals={group.decimals}
              normal={group.normal}
            />
          </section>
        );
      })}
    </div>
  );
}

/** Arma los puntos del grafico a partir de filas con valores por metrica. */
export function toChartPoints<
  T extends {
    systolic: number | null;
    diastolic: number | null;
    pulse: number | null;
    spo2: number | null;
    glucose: number | null;
    weight: number | null;
    temperature: number | null;
  },
>(rows: T[], label: (row: T) => string, caption?: (row: T) => string) {
  return rows.map((row) => ({
    label: label(row),
    caption: caption?.(row) ?? "",
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
    spo2: row.spo2,
    glucose: row.glucose,
    weight: row.weight,
    temperature: row.temperature,
  }));
}
