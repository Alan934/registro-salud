"use client";

import { useActionState, useEffect, useRef } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import {
  createMeasurementAction,
  updateMeasurementAction,
  type FormState,
} from "@/lib/actions";
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
}: {
  metricKey: MetricKey;
  defaultValue?: number | null;
}) {
  const metric = METRIC_BY_KEY[metricKey];
  return (
    <div className="space-y-1.5">
      <label htmlFor={metric.key} className="block text-sm font-medium">
        {metric.label}{" "}
        <span className="font-normal text-muted">({metric.unit})</span>
      </label>
      <input
        id={metric.key}
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

export function MeasurementForm({
  mode,
  values,
  nowValue,
  nowText,
}: {
  mode: "create" | "edit";
  values?: MeasurementFormValues;
  /** Ahora en Mendoza, formato del input (tope del calendario). */
  nowValue: string;
  /** Ahora en Mendoza, en texto legible. */
  nowText: string;
}) {
  const action = mode === "create" ? createMeasurementAction : updateMeasurementAction;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (mode === "create" && state.ok) {
      formRef.current?.reset();
    }
  }, [mode, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {values?.id ? (
        <input type="hidden" name="id" value={values.id} />
      ) : null}

      <div className="space-y-4">
        {ROWS.map((row) => (
          <div key={row.join("-")} className="grid gap-4 sm:grid-cols-2">
            {row.map((key) => (
              <NumberField
                key={key}
                metricKey={key}
                defaultValue={values?.[key]}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="note" className="block text-sm font-medium">
          Observación de esta toma{" "}
          <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          id="note"
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
            id="measuredAt"
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

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}

      {state.ok ? (
        <p
          role="status"
          className="rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok"
        >
          {state.ok}
        </p>
      ) : null}

      <SubmitButton className="btn-primary w-full sm:w-auto">
        {mode === "create" ? "Guardar toma" : "Guardar cambios"}
      </SubmitButton>
    </form>
  );
}
