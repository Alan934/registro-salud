import Link from "next/link";
import { MetricChips } from "@/components/MetricChips";
import type { Measurement } from "@/lib/model";
import { formatDayShort } from "@/lib/tz";

/**
 * Lista de tomas individuales, cada una con su horario. Se dibuja como una
 * línea de tiempo: el día se lee de arriba abajo y se ve de un vistazo a qué
 * hora se midió y a qué hora no.
 */
export function MeasurementList({
  measurements,
  showDay = false,
  backTo = "/",
  onEdit,
  emptyText = "Todavía no hay tomas cargadas.",
}: {
  measurements: Measurement[];
  showDay?: boolean;
  backTo?: string;
  /** Si se pasa, el botón Editar avisa acá en vez de ir a /toma/[id]. */
  onEdit?: (id: number) => void;
  emptyText?: string;
}) {
  if (measurements.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }

  return (
    <ul className="ml-1.5 space-y-4 border-l border-line pl-5">
      {measurements.map((m) => (
        <li key={m.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute top-1.5 -left-[26px] h-3 w-3 rounded-full
                       border-2 border-surface bg-accent"
          />

          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold tabular-nums">{m.time}</span>
                {showDay ? (
                  <span className="text-xs text-muted tabular-nums">
                    {formatDayShort(m.day)}
                  </span>
                ) : null}
              </div>

              <MetricChips values={m} />

              {m.note ? (
                <p className="text-sm break-words text-muted">{m.note}</p>
              ) : null}
            </div>

            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(m.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted
                           transition hover:bg-surface-soft hover:text-fg"
              >
                Editar
              </button>
            ) : (
              <Link
                href={{ pathname: `/toma/${m.id}`, query: { volver: backTo } }}
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted
                           transition hover:bg-surface-soft hover:text-fg"
              >
                Editar
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
