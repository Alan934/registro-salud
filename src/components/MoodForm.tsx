"use client";

import { useActionState, useEffect, useRef } from "react";
import { MoodFields } from "@/components/MoodFields";
import { SubmitButton } from "@/components/SubmitButton";
import { createMoodAction, type FormState } from "@/lib/actions";

export function MoodForm({
  nowValue,
  nowText,
}: {
  nowValue: string;
  nowText: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    createMoodAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <MoodFields nowValue={nowValue} nowText={nowText} />

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
        Guardar cómo se sintió
      </SubmitButton>
    </form>
  );
}
