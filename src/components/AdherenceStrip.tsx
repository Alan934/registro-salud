import type { DayMark } from "@/lib/insights";
import { formatDayShort } from "@/lib/tz";

const KIND_CLASS: Record<DayMark["kind"], string> = {
  measured: "bg-accent",
  note: "bg-accent-soft ring-1 ring-inset ring-accent/40",
  empty: "bg-surface-soft ring-1 ring-inset ring-line",
};

const KIND_TEXT: Record<DayMark["kind"], string> = {
  measured: "con tomas",
  note: "sólo nota",
  empty: "sin registro",
};

/**
 * Constancia: un cuadradito por dia del tramo, lleno los dias que se midio.
 * De un vistazo se ven los huecos, que es lo que el medico pregunta cuando
 * mira los promedios.
 */
export function AdherenceStrip({
  marks,
  measured,
  total,
  streak,
  caption,
}: {
  /** Dias del tramo dibujado, del mas viejo al mas nuevo. */
  marks: DayMark[];
  /** Dias con al menos una toma (puede contar un tramo mas largo que el dibujado). */
  measured: number;
  total: number;
  streak?: { days: number; upToToday: boolean };
  caption?: string;
}) {
  const percent = total === 0 ? 0 : Math.round((measured / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm">
          <strong className="text-lg font-bold tabular-nums">{measured}</strong>{" "}
          <span className="text-muted">
            de {total} {total === 1 ? "día" : "días"} con registro ({percent}%)
          </span>
        </p>

        {streak && streak.days > 0 ? (
          <span className="pill pill-ok">
            {streak.days} {streak.days === 1 ? "día seguido" : "días seguidos"}
            {streak.upToToday ? "" : " (hasta ayer)"}
          </span>
        ) : null}
      </div>

      <ul className="flex gap-0.5">
        {marks.map((mark) => (
          <li
            key={mark.day}
            title={`${formatDayShort(mark.day)} · ${KIND_TEXT[mark.kind]}`}
            className={`h-5 flex-1 rounded-sm ${KIND_CLASS[mark.kind]}`}
          >
            <span className="sr-only">
              {formatDayShort(mark.day)}: {KIND_TEXT[mark.kind]}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between text-xs text-muted tabular-nums">
        <span>{marks.length > 0 ? formatDayShort(marks[0].day) : ""}</span>
        <span>
          {marks.length > 0 ? formatDayShort(marks[marks.length - 1].day) : ""}
        </span>
      </div>

      {caption ? <p className="text-xs text-muted">{caption}</p> : null}
    </div>
  );
}
