"use client";

import { useState } from "react";
import { MeasurementList } from "@/components/MeasurementList";
import type { Measurement } from "@/lib/model";

/**
 * Un día de la lista de Métricas. El encabezado (promedios y nota) viene
 * armado del servidor; las tomas una por una se piden recién al desplegarlo.
 *
 * Con un año de datos son miles de tomas: mandarlas todas de entrada para que
 * la mayoría queden escondidas atrás de un `<details>` cerrado es puro peso.
 */

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; measurements: Measurement[] }
  | { status: "error" };

export function DayDetail({
  day,
  total,
  note,
  backTo,
  children,
}: {
  day: string;
  /** Cuántas tomas tiene. En 0 el día es sólo una nota y no se pide nada. */
  total: number;
  note: string | null;
  backTo: string;
  /** El encabezado, renderizado en el servidor. */
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function load() {
    if (total === 0) return;
    if (state.status === "loading" || state.status === "ready") return;

    setState({ status: "loading" });
    try {
      const response = await fetch(`/api/dia/${day}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { measurements: Measurement[] };
      setState({ status: "ready", measurements: data.measurements });
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <details
      onToggle={(event) => {
        if (event.currentTarget.open) load();
      }}
    >
      <summary className="cursor-pointer list-none">{children}</summary>

      <div className="mt-3 rounded-xl bg-surface-soft p-3">
        {total > 0 ? <Body state={state} backTo={backTo} onRetry={load} /> : null}

        {note ? (
          <p
            className={
              total > 0 ? "mt-3 border-t border-line pt-3 text-sm" : "text-sm"
            }
          >
            <span className="font-medium">Nota del día: </span>
            <span className="text-muted">{note}</span>
          </p>
        ) : null}
      </div>
    </details>
  );
}

function Body({
  state,
  backTo,
  onRetry,
}: {
  state: State;
  backTo: string;
  onRetry: () => void;
}) {
  if (state.status === "ready") {
    return <MeasurementList measurements={state.measurements} backTo={backTo} />;
  }

  if (state.status === "error") {
    return (
      <p role="alert" className="text-sm text-danger">
        No se pudieron cargar las tomas de este día.{" "}
        <button
          type="button"
          onClick={onRetry}
          className="font-medium underline"
        >
          Reintentar
        </button>
      </p>
    );
  }

  return (
    <p className="text-sm text-muted" aria-live="polite">
      Cargando las tomas...
    </p>
  );
}
