"use client";

import { METRIC_BY_KEY, type MetricKey } from "@/lib/metrics";

export type MeasurementFormValues = Partial<Record<MetricKey, number | null>> & {
  id?: number;
  note?: string | null;
  measuredAt?: string;
};

/** Orden de carga pensado para el uso diario. */
const ROWS: MetricKey[][] = [
  ["systolic", "diastolic"],
  ["pulse", "spo2"],
  ["glucose", "temperature"],
  ["weight"],
];

function NumberField({
  metricKey,
  defaultValue,
  idPrefix,
}: {
  metricKey: MetricKey;
  defaultValue?: number | null;
  idPrefix: string;
}) {
  const metric = METRIC_BY_KEY[metricKey];
  const id = `${idPrefix}-${metric.key}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {metric.label}{" "}
        <span className="font-normal text-muted">({metric.unit})</span>
      </label>
      <input
        id={id}
        name={metric.key}
        type="number"
        inputMode="decimal"
        step={metric.step}
        min={metric.min}
        max={metric.max}
        placeholder={metric.placeholder}
        defaultValue={defaultValue ?? ""}
        className="field"
      />
    </div>
  );
}

/**
 * Los campos de una toma. Los usan tanto el formulario real (server actions)
 * como el de la pagina de ejemplo, para que se vean y validen exactamente igual.
 */
export function MeasurementFields({
  mode,
  values,
  nowValue,
  nowText,
  idPrefix = "toma",
}: {
  mode: "create" | "edit";
  values?: MeasurementFormValues;
  /** Ahora en Mendoza, formato del input (tope del calendario). */
  nowValue: string;
  /** Ahora en Mendoza, en texto legible. */
  nowText: string;
  idPrefix?: string;
}) {
  return (
    <>
      <div className="space-y-4">
        {ROWS.map((row) => (
          <div key={row.join("-")} className="grid gap-4 sm:grid-cols-2">
            {row.map((key) => (
              <NumberField
                key={key}
                metricKey={key}
                defaultValue={values?.[key]}
                idPrefix={idPrefix}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-note`}
          className="block text-sm font-medium"
        >
          Observación de esta toma{" "}
          <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          id={`${idPrefix}-note`}
          name="note"
          rows={2}
          defaultValue={values?.note ?? ""}
          placeholder="Ej.: antes del desayuno, con mareo, después de caminar..."
          className="field resize-y"
        />
      </div>

      <details open={mode === "edit"} className="rounded-xl bg-surface-soft p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Fecha y hora
          {mode === "create" ? (
            <span className="ml-1 font-normal text-muted">
              — ahora ({nowText}). Tocá para cargar otro día.
            </span>
          ) : null}
        </summary>
        <div className="mt-3">
          <input
            id={`${idPrefix}-measuredAt`}
            name="measuredAt"
            type="datetime-local"
            defaultValue={values?.measuredAt ?? ""}
            max={nowValue}
            className="field"
          />
          <p className="mt-1.5 text-xs text-muted">
            {mode === "create"
              ? "Si lo dejás vacío se guarda con la fecha y hora de este momento."
              : "Hora de Mendoza."}
          </p>
        </div>
      </details>
    </>
  );
}
