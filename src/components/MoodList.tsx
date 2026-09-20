import { DeleteMoodForm } from "@/components/DeleteMoodForm";
import { MoodFace } from "@/components/MoodFace";
import { SYMPTOM_BY_ID, moodLevel } from "@/lib/mood";
import type { MoodLog } from "@/lib/model";
import { formatDayShort } from "@/lib/tz";

/** Los registros de cómo se sintió, con su horario. */
export function MoodList({
  logs,
  showDay = false,
  onDelete,
  emptyText = "Todavía no hay registros.",
}: {
  logs: MoodLog[];
  showDay?: boolean;
  /** Si se pasa, el botón Borrar avisa acá en vez de ir a la server action. */
  onDelete?: (id: number) => void;
  emptyText?: string;
}) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }

  return (
    <ul className="space-y-3">
      {logs.map((log) => {
        const level = moodLevel(log.mood);
        return (
          <li key={log.id} className="flex items-start gap-3">
            <MoodFace value={log.mood} className="mt-0.5 h-9 w-9 shrink-0" />

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium" style={{ color: level.color }}>
                  {level.label}
                </span>
                <span className="text-xs text-muted tabular-nums">
                  {log.mood}/10 · {log.time}
                  {showDay ? ` · ${formatDayShort(log.day)}` : ""}
                </span>
              </div>

              {log.symptoms.length > 0 ? (
                <ul className="flex flex-wrap gap-1">
                  {log.symptoms.map((id) => (
                    <li
                      key={id}
                      className="rounded-full border border-line px-2 py-0.5 text-xs text-muted"
                    >
                      {SYMPTOM_BY_ID[id]?.label ?? id}
                    </li>
                  ))}
                </ul>
              ) : null}

              {log.note ? (
                <p className="text-sm break-words text-muted">{log.note}</p>
              ) : null}
            </div>

            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(log.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted
                           transition hover:bg-danger-soft hover:text-danger"
              >
                Borrar
              </button>
            ) : (
              <DeleteMoodForm id={log.id} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
