"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { HEIGHT_MAX, HEIGHT_MIN } from "@/lib/bmi";
import { saveHeightAction, type FormState } from "@/lib/actions";

export function HeightForm({ heightCm }: { heightCm: number | null }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    saveHeightAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="heightCm" className="block text-sm font-medium">
          Altura <span className="font-normal text-muted">(cm)</span>
        </label>
        <input
          id="heightCm"
          name="heightCm"
          type="number"
          inputMode="numeric"
          step="1"
          min={HEIGHT_MIN}
          max={HEIGHT_MAX}
          defaultValue={heightCm ?? ""}
          placeholder="163"
          className="field sm:w-40"
        />
        <p className="text-xs text-muted">
          Se carga una sola vez. Si la dejás vacía y guardás, el IMC deja de
          mostrarse.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton className="btn-primary">Guardar altura</SubmitButton>
        {state.error ? (
          <span role="alert" className="text-sm text-danger">
            {state.error}
          </span>
        ) : null}
        {state.ok ? (
          <span role="status" className="text-sm text-ok">
            {state.ok}
          </span>
        ) : null}
      </div>
    </form>
  );
}
