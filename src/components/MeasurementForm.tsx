"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  MeasurementFields,
  type MeasurementFormValues,
} from "@/components/MeasurementFields";
import { SubmitButton } from "@/components/SubmitButton";
import {
  createMeasurementAction,
  updateMeasurementAction,
  type FormState,
} from "@/lib/actions";

export type { MeasurementFormValues };

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
  const action =
    mode === "create" ? createMeasurementAction : updateMeasurementAction;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (mode === "create" && state.ok) {
      formRef.current?.reset();
    }
  }, [mode, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <MeasurementFields
        mode={mode}
        values={values}
        nowValue={nowValue}
        nowText={nowText}
      />

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
