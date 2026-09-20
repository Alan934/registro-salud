import Link from "next/link";
import { MetricChips } from "@/components/MetricChips";
import type { Measurement } from "@/lib/queries";
import { formatDayShort } from "@/lib/tz";

/** Lista de tomas individuales, cada una con su horario. */
export function MeasurementList({
  measurements,
  showDay = false,
  backTo = "/",
}: {
  measurements: Measurement[];
  showDay?: boolean;
  backTo?: string;
}) {
  if (measurements.length === 0) {
    return (
      <p className="text-sm text-muted">Todavía no hay tomas cargadas.</p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {measurements.map((m) => (
        <li key={m.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <div className="w-14 shrink-0 pt-0.5">
            <div className="font-semibold tabular-nums">{m.time}</div>
            {showDay ? (
              <div className="text-xs text-muted tabular-nums">
                {formatDayShort(m.day)}
              </div>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <MetricChips values={m} />
            {m.note ? (
              <p className="text-sm text-muted break-words">{m.note}</p>
            ) : null}
          </div>

          <Link
            href={{ pathname: `/toma/${m.id}`, query: { volver: backTo } }}
            className="shrink-0 self-start rounded-lg px-2 py-1 text-sm text-muted
                       transition hover:bg-surface-soft hover:text-fg"
          >
            Editar
          </Link>
        </li>
      ))}
    </ul>
  );
}
