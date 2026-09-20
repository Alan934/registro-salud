import { METRIC_BY_KEY, type MetricKey } from "@/lib/metrics";
import {
  SCALES,
  TONE_COLOR,
  markerPosition,
  zoneIn,
  zoneSegments,
  type Scale,
} from "@/lib/zones";

/**
 * La barra de rangos: los tramos de referencia y un marcador donde cayó el
 * valor. El tramo donde está el valor va en color pleno y el resto apagado,
 * así se ve enseguida dónde quedó parado.
 *
 * Es decorativa: lo que dice ya está escrito al lado (el número y la
 * pastilla "Normal" / "Alta"), por eso va oculta para lectores de pantalla.
 */
export function RangeBar({
  scale,
  value,
  unit,
  decimals,
  label,
  showLabels = true,
}: {
  scale: Scale;
  value: number | null;
  unit: string;
  decimals: number;
  /** Nombre de la serie, para las barras de presión (Máxima / Mínima). */
  label?: string;
  showLabels?: boolean;
}) {
  const segments = zoneSegments(scale);
  const zone = zoneIn(scale, value);

  return (
    <div aria-hidden="true" className="space-y-1">
      {label ? (
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="text-muted">{label}</span>
          <span className="tabular-nums">
            {value === null ? (
              <span className="text-muted">—</span>
            ) : (
              <>
                <strong className="font-semibold">
                  {value.toFixed(decimals)}
                </strong>{" "}
                <span className="text-muted">{unit}</span>
              </>
            )}
          </span>
        </div>
      ) : null}

      <div className="relative">
        <div className="flex h-2 gap-px overflow-hidden rounded-full">
          {segments.map((segment) => {
            const active = zone === segment.zone;
            const color = TONE_COLOR[segment.zone.tone];
            return (
              <span
                key={segment.zone.short}
                style={{
                  width: `${segment.width}%`,
                  background: active ? color.strong : color.soft,
                }}
              />
            );
          })}
        </div>

        {value === null ? null : (
          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2
                       rounded-full border-2 border-surface bg-fg shadow-sm"
            style={{ left: `${markerPosition(scale, value)}%` }}
          />
        )}
      </div>

      {showLabels ? (
        <div className="flex gap-px text-[9px] leading-tight font-medium tracking-wide">
          {segments.map((segment) => {
            const active = zone === segment.zone;
            return (
              <span
                key={segment.zone.short}
                className={`overflow-hidden text-center ${
                  active ? "font-bold" : "text-muted"
                }`}
                style={{
                  width: `${segment.width}%`,
                  color: active
                    ? TONE_COLOR[segment.zone.tone].strong
                    : undefined,
                }}
              >
                {segment.zone.short}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** La misma barra, tomando la escala y la unidad de la métrica. */
export function MetricRangeBar({
  metricKey,
  value,
  label,
  showLabels,
}: {
  metricKey: MetricKey;
  value: number | null;
  label?: string;
  showLabels?: boolean;
}) {
  const scale = SCALES[metricKey];
  if (!scale) return null;

  const metric = METRIC_BY_KEY[metricKey];
  return (
    <RangeBar
      scale={scale}
      value={value}
      unit={metric.unit}
      decimals={metric.decimals}
      label={label}
      showLabels={showLabels}
    />
  );
}
