"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { saveDailyNoteAction, type FormState } from "@/lib/actions";

export function DailyNoteForm({
  day,
  note,
}: {
  day: string;
  note: string | null;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    saveDailyNoteAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="day" value={day} />
      <textarea
        name="dayNote"
        rows={3}
        defaultValue={note ?? ""}
        placeholder="Cómo pasó el día, si comió bien, medicación, síntomas, turnos médicos..."
        className="field resize-y"
      />

      <div className="flex items-center gap-3">
        <SubmitButton className="btn-ghost">Guardar nota</SubmitButton>
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
