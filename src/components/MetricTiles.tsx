import Link from "next/link";
import { MetricIcon } from "@/components/MetricIcon";
import { Sparkline } from "@/components/Sparkline";
import { BMI_SCALE, bmiFor } from "@/lib/bmi";
import { CHART_GROUPS } from "@/lib/chart-groups";
import { METRIC_BY_KEY, formatValue, type MetricKey } from "@/lib/metrics";
import type { LatestValue } from "@/lib/model";
import { TONE_PILL, worstTone, zoneFor, zoneIn } from "@/lib/zones";
import { formatDayShort } from "@/lib/tz";

export type TileSeries = Partial<Record<MetricKey, Array<number | null>>>;

/**
 * Las categorias de un vistazo: una baldosa por metrica con el ultimo valor,
 * en que zona cayo y como viene. Cada una lleva al grafico de esa metrica.
 */
export function MetricTiles({
  latest,
  series,
  today,
  hrefBase = "/metricas",
  heightCm = null,
}: {
  latest: Partial<Record<MetricKey, LatestValue>>;
  /** Valores por dia para la linea de tendencia, del mas viejo al mas nuevo. */
  series?: TileSeries;
  today: string;
  /** Adonde llevan las baldosas. Vacio = anclas en la misma pagina. */
  hrefBase?: string;
  /** Altura cargada en Ajustes: con ella la baldosa de peso muestra el IMC. */
  heightCm?: number | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {CHART_GROUPS.map((group) => {
        const keys = group.series.map((serie) => serie.key);
        const main = keys[0];
        const reading = latest[main];

        const values = keys.map((key) => latest[key]?.value ?? null);
        const zones = keys.map((key) => zoneFor(key, latest[key]?.value ?? null));
        const tone = worstTone(
          zones.flatMap((zone) => (zone ? [zone.tone] : [])),
        );
        const zoneLabel =
          zones.length === 1 ? zones[0]?.label : tone ? labelFor(zones, tone) : null;

        // El peso no tiene zonas propias: lo que se puede leer es el IMC.
        const bmi =
          group.id === "weight"
            ? bmiFor(latest.weight?.value ?? null, heightCm)
            : null;
        const bmiZone = bmi === null ? null : zoneIn(BMI_SCALE, bmi);

        const text =
          values.every((value) => value === null)
            ? null
            : keys
                .map((key, index) => formatValue(key, values[index]))
                .join("/");

        return (
          <Link
            key={group.id}
            href={`${hrefBase}#g-${group.id}`}
            className={`card ${group.className} flex flex-col gap-2 p-3 transition
                        hover:border-accent/40 hover:shadow-sm
                        focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none`}
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: "var(--series-soft)",
                  color: "var(--series)",
                }}
              >
                <MetricIcon metricKey={main} />
              </span>
              <span className="min-w-0 text-sm leading-tight font-medium">
                {group.title}
              </span>
            </div>

            {text ? (
              <>
                <p className="flex flex-wrap items-baseline gap-1">
                  <strong className="text-2xl leading-none font-bold tabular-nums">
                    {text}
                  </strong>
                  <span className="text-xs text-muted">{group.unit}</span>
                </p>

                {bmi !== null && bmiZone ? (
                  <span className={`pill ${TONE_PILL[bmiZone.tone]} self-start`}>
                    IMC {bmi.toFixed(1)} · {bmiZone.label}
                  </span>
                ) : zoneLabel && tone ? (
                  <span className={`pill ${TONE_PILL[tone]} self-start`}>
                    {zoneLabel}
                  </span>
                ) : null}

                <Sparkline
                  values={series?.[main] ?? []}
                  className="h-6 w-full opacity-80"
                />

                <span className="mt-auto text-xs text-muted tabular-nums">
                  {reading
                    ? reading.day === today
                      ? `hoy ${reading.time}`
                      : formatDayShort(reading.day)
                    : ""}
                </span>
              </>
            ) : (
              <p className="mt-auto text-sm text-muted">Sin registros todavía</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/** Con dos series (la presion) manda la que esta peor: se nombra esa. */
function labelFor(
  zones: Array<{ label: string; tone: string } | null>,
  tone: string,
): string | null {
  return zones.find((zone) => zone?.tone === tone)?.label ?? null;
}

/** La serie diaria de cada metrica, para las lineas de tendencia. */
export function toTileSeries(
  days: Array<Partial<Record<MetricKey, number | null>>>,
): TileSeries {
  const series: TileSeries = {};
  for (const key of Object.keys(METRIC_BY_KEY) as MetricKey[]) {
    series[key] = days.map((day) => day[key] ?? null);
  }
  return series;
}
