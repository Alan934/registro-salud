import { METRICS, formatValue, type MetricKey } from "@/lib/metrics";
import { TONE_PILL, worstTone, zoneFor, type ZoneTone } from "@/lib/zones";

type Values = Partial<Record<MetricKey, number | null>>;

/**
 * Fila compacta de valores. La presión se muestra como "120/80" porque
 * es como se lee en el tensiómetro.
 *
 * El color sale de la zona de referencia (normal / elevada / alta), así una
 * lectura alta se ve distinta de una apenas elevada. El nombre de la zona va
 * en el title y en el texto para lectores de pantalla: el color solo no
 * alcanza para contarlo.
 */
export function MetricChips({
  values,
  counts,
}: {
  values: Values;
  counts?: Partial<Record<MetricKey, number>>;
}) {
  const chips: React.ReactNode[] = [];

  const { systolic, diastolic } = values;
  if (systolic != null || diastolic != null) {
    const zones = [
      zoneFor("systolic", systolic ?? null),
      zoneFor("diastolic", diastolic ?? null),
    ];
    const tone = worstTone(zones.flatMap((zone) => (zone ? [zone.tone] : [])));
    const zoneLabel = tone
      ? (zones.find((zone) => zone?.tone === tone)?.label ?? null)
      : null;

    chips.push(
      <Chip
        key="pressure"
        label="Presión"
        value={`${formatValue("systolic", systolic ?? null)}/${formatValue(
          "diastolic",
          diastolic ?? null,
        )}`}
        unit="mmHg"
        tone={tone}
        zoneLabel={zoneLabel}
        count={counts?.systolic}
      />,
    );
  }

  for (const metric of METRICS) {
    if (metric.key === "systolic" || metric.key === "diastolic") continue;
    const value = values[metric.key];
    if (value == null) continue;
    const zone = zoneFor(metric.key, value);
    chips.push(
      <Chip
        key={metric.key}
        label={metric.short}
        value={formatValue(metric.key, value)}
        unit={metric.unit}
        tone={zone?.tone ?? null}
        zoneLabel={zone?.label ?? null}
        count={counts?.[metric.key]}
      />,
    );
  }

  if (chips.length === 0) {
    return <p className="text-sm text-muted">Sin valores cargados.</p>;
  }

  return <div className="flex flex-wrap gap-1.5">{chips}</div>;
}

/** Un valor "dentro de rango" no necesita color: se destaca lo que se sale. */
const TONE_CLASS: Record<ZoneTone, string> = {
  ...TONE_PILL,
  ok: "bg-surface-soft text-fg",
};

function Chip({
  label,
  value,
  unit,
  tone,
  zoneLabel,
  count,
}: {
  label: string;
  value: string;
  unit: string;
  tone: ZoneTone | null;
  zoneLabel: string | null;
  count?: number;
}) {
  const showZone = zoneLabel !== null && tone !== null && tone !== "ok";

  return (
    <span
      title={zoneLabel ? `${label}: ${zoneLabel.toLowerCase()}` : undefined}
      className={`inline-flex items-baseline gap-1.5 rounded-full px-2.5 py-1 text-sm
                  ${tone ? TONE_CLASS[tone] : "bg-surface-soft text-fg"}`}
    >
      <span className="text-xs opacity-75">{label}</span>
      <strong className="font-semibold tabular-nums">{value}</strong>
      <span className="text-xs opacity-75">{unit}</span>
      {showZone ? (
        <span className="text-xs font-medium">· {zoneLabel.toLowerCase()}</span>
      ) : null}
      {count && count > 1 ? (
        <span className="text-xs opacity-75">· prom. de {count}</span>
      ) : null}
    </span>
  );
}
