"use client";

import { useState } from "react";
import { MeasurementList } from "@/components/MeasurementList";
import { MoodList } from "@/components/MoodList";
import type { Measurement, MoodLog } from "@/lib/model";

/**
 * Un día de la lista de Métricas. El encabezado (promedios y nota) viene
 * armado del servidor; el detalle —cada toma y cómo se sintió— se pide
 * recién al desplegarlo.
 *
 * Con un año de datos son miles de tomas: mandarlas todas de entrada para que
 * la mayoría queden escondidas atrás de un `<details>` cerrado es puro peso.
 */

type Detail = { measurements: Measurement[]; moods: MoodLog[] };

type State =
  | { status: "idle" }
  | { status: "loading" }
  | ({ status: "ready" } & Detail)
  | { status: "error" };

export function DayDetail({
  day,
  total,
  moodCount = 0,
  note,
  backTo,
  children,
}: {
  day: string;
  /** Cuántas tomas tiene. */
  total: number;
  /** Cuántos registros de cómo se sintió tiene. */
  moodCount?: number;
  note: string | null;
  backTo: string;
  /** El encabezado, renderizado en el servidor. */
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>({ status: "idle" });
  // Un día que es sólo una nota no tiene nada que pedir.
  const hasDetail = total > 0 || moodCount > 0;

  async function load() {
    if (!hasDetail) return;
    if (state.status === "loading" || state.status === "ready") return;

    setState({ status: "loading" });
    try {
      const response = await fetch(`/api/dia/${day}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as Detail;
      setState({
        status: "ready",
        measurements: data.measurements ?? [],
        moods: data.moods ?? [],
      });
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

      <div className="mt-3 space-y-3 rounded-xl bg-surface-soft p-3">
        {hasDetail ? (
          <Body state={state} backTo={backTo} onRetry={load} />
        ) : null}

        {note ? (
          <p
            className={
              hasDetail ? "border-t border-line pt-3 text-sm" : "text-sm"
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
    return (
      <>
        {state.measurements.length > 0 ? (
          <MeasurementList measurements={state.measurements} backTo={backTo} />
        ) : null}

        {state.moods.length > 0 ? (
          <div
            className={
              state.measurements.length > 0 ? "border-t border-line pt-3" : ""
            }
          >
            <p className="eyebrow mb-2">Cómo se sintió</p>
            <MoodList logs={state.moods} />
          </div>
        ) : null}
      </>
    );
  }

  if (state.status === "error") {
    return (
      <p role="alert" className="text-sm text-danger">
        No se pudo cargar el detalle de este día.{" "}
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
      Cargando el detalle...
    </p>
  );
}
