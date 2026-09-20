"use client";

import { useActionState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { SubmitButton } from "@/components/SubmitButton";
import { loginAction, type FormState } from "@/lib/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-1.5">
        <label htmlFor="user" className="block text-sm font-medium">
          Usuario
        </label>
        <input
          id="user"
          name="user"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="field"
        />
      </div>

      <PasswordField />

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Entrando..." className="btn-primary w-full">
        Entrar
      </SubmitButton>

      <p className="text-center text-xs text-muted">
        La sesión queda abierta durante 30 días en este dispositivo.
      </p>
    </form>
  );
}
