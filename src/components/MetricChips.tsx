import {
  METRICS,
  formatValue,
  statusFor,
  type MetricKey,
} from "@/lib/metrics";

const STATUS_CLASS = {
  ok: "bg-surface-soft text-fg",
  low: "bg-warn-soft text-warn",
  high: "bg-danger-soft text-danger",
  none: "bg-surface-soft text-fg",
} as const;

type Values = Partial<Record<MetricKey, number | null>>;

/**
 * Fila compacta de valores. La presión se muestra como "120/80" porque
 * es como se lee en el tensiómetro.
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
    const parts = [
      statusFor("systolic", systolic ?? null),
      statusFor("diastolic", diastolic ?? null),
    ];
    let status: keyof typeof STATUS_CLASS = "ok";
    if (systolic == null || diastolic == null) status = "none";
    else if (parts.includes("high")) status = "high";
    else if (parts.includes("low")) status = "low";

    chips.push(
      <Chip
        key="pressure"
        label="Presión"
        value={`${formatValue("systolic", systolic ?? null)}/${formatValue(
          "diastolic",
          diastolic ?? null,
        )}`}
        unit="mmHg"
        status={status}
        count={counts?.systolic}
      />,
    );
  }

  for (const metric of METRICS) {
    if (metric.key === "systolic" || metric.key === "diastolic") continue;
    const value = values[metric.key];
    if (value == null) continue;
    chips.push(
      <Chip
        key={metric.key}
        label={metric.short}
        value={formatValue(metric.key, value)}
        unit={metric.unit}
        status={statusFor(metric.key, value) ?? "none"}
        count={counts?.[metric.key]}
      />,
    );
  }

  if (chips.length === 0) {
    return <p className="text-sm text-muted">Sin valores cargados.</p>;
  }

  return <div className="flex flex-wrap gap-2">{chips}</div>;
}

function Chip({
  label,
  value,
  unit,
  status,
  count,
}: {
  label: string;
  value: string;
  unit: string;
  status: keyof typeof STATUS_CLASS;
  count?: number;
}) {
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 rounded-lg px-2.5 py-1.5 text-sm ${STATUS_CLASS[status]}`}
    >
      <span className="text-xs text-muted">{label}</span>
      <strong className="font-semibold tabular-nums">{value}</strong>
      <span className="text-xs text-muted">{unit}</span>
      {count && count > 1 ? (
        <span className="text-xs text-muted">· prom. de {count}</span>
      ) : null}
    </span>
  );
}
