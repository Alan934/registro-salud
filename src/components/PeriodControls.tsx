import Link from "next/link";
import { RANGES, periodQuery, type Period } from "@/lib/period";
import { todayKey } from "@/lib/tz";

const CHIP = "rounded-lg px-3 py-1.5 text-sm transition";
const CHIP_ON = "bg-surface font-medium text-fg shadow-sm";
const CHIP_OFF = "text-muted hover:text-fg";

/** Los atajos de período, las fechas a mano y la vista del gráfico. */
export function PeriodControls({
  period,
  view,
}: {
  period: Period;
  view: "dia" | "toma";
}) {
  const today = todayKey();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-xl bg-surface-soft p-1">
          {RANGES.map((range) => {
            const active = !period.custom && range.days === period.days;
            return (
              <Link
                key={range.days}
                href={{
                  pathname: "/metricas",
                  query: { dias: range.days, vista: view },
                }}
                aria-current={active ? "page" : undefined}
                className={`${CHIP} ${active ? CHIP_ON : CHIP_OFF}`}
              >
                {range.label}
              </Link>
            );
          })}
        </div>

        <div className="flex gap-1 rounded-xl bg-surface-soft p-1">
          {(
            [
              { id: "dia", label: "Por día" },
              { id: "toma", label: "Cada toma" },
            ] as const
          ).map((option) => (
            <Link
              key={option.id}
              href={{
                pathname: "/metricas",
                query: { ...periodQuery(period), vista: option.id },
              }}
              aria-current={option.id === view ? "page" : undefined}
              className={`${CHIP} ${option.id === view ? CHIP_ON : CHIP_OFF}`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Fechas a mano: para "lo que pasó entre un turno y el otro". */}
      <details
        open={period.custom}
        className="rounded-xl bg-surface-soft px-3 py-2"
      >
        <summary className="cursor-pointer text-sm font-medium">
          Otras fechas
          {period.custom ? (
            <span className="ml-1 font-normal text-accent">
              — {period.label}
            </span>
          ) : (
            <span className="ml-1 font-normal text-muted">
              — elegir desde y hasta
            </span>
          )}
        </summary>

        <form
          method="get"
          action="/metricas"
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="vista" value={view} />

          <div className="space-y-1.5">
            <label htmlFor="desde" className="block text-sm font-medium">
              Desde
            </label>
            <input
              id="desde"
              name="desde"
              type="date"
              required
              max={today}
              defaultValue={period.fromDay}
              className="field w-auto"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="hasta" className="block text-sm font-medium">
              Hasta
            </label>
            <input
              id="hasta"
              name="hasta"
              type="date"
              required
              max={today}
              defaultValue={period.toDay}
              className="field w-auto"
            />
          </div>

          <button type="submit" className="btn-primary">
            Ver
          </button>
        </form>
      </details>
    </div>
  );
}
