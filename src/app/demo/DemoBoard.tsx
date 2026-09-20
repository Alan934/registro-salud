"use client";

import { useMemo, useRef, useState } from "react";
import { ChartGrid, toChartPoints } from "@/components/ChartGrid";
import { MeasurementFields } from "@/components/MeasurementFields";
import { MeasurementList } from "@/components/MeasurementList";
import { MetricChips } from "@/components/MetricChips";
import { RANGES } from "@/lib/chart-groups";
import { summarizeDays, type DemoData } from "@/lib/demo-data";
import { readMeasurementInput } from "@/lib/measurement-input";
import { METRICS } from "@/lib/metrics";
import type { Measurement, MetricValues, NewMeasurement } from "@/lib/model";
import {
  dayLabel,
  formatDayShort,
  shiftDay,
  toDayKey,
  toTimeKey,
} from "@/lib/tz";

const EMPTY_VALUES = Object.fromEntries(
  METRICS.map((metric) => [metric.key, null]),
) as MetricValues;

function toMeasurement(input: NewMeasurement, id: number): Measurement {
  const { measuredAt, note, ...values } = input;
  return {
    ...EMPTY_VALUES,
    ...values,
    id,
    measuredAt: measuredAt.toISOString(),
    day: toDayKey(measuredAt),
    time: toTimeKey(measuredAt),
    note,
  };
}

function byTime(a: Measurement, b: Measurement) {
  return a.measuredAt < b.measuredAt ? -1 : 1;
}

export function DemoBoard({
  today,
  todayLong,
  nowValue,
  nowText,
  initial,
}: {
  today: string;
  todayLong: string;
  nowValue: string;
  nowText: string;
  initial: DemoData;
}) {
  const [measurements, setMeasurements] = useState(initial.measurements);
  const [dayNotes, setDayNotes] = useState(initial.dayNotes);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number>(30);
  const [view, setView] = useState<"dia" | "toma">("dia");
  const topRef = useRef<HTMLDivElement>(null);

  const summaries = useMemo(
    () => summarizeDays(measurements, dayNotes),
    [measurements, dayNotes],
  );

  const todayMeasurements = measurements.filter((m) => m.day === today);
  const todaySummary = summaries.find((summary) => summary.day === today);
  const editing = measurements.find((m) => m.id === editingId) ?? null;

  const fromDay = shiftDay(today, -(days - 1));
  const rangeSummaries = summaries.filter((summary) => summary.day >= fromDay);
  const rangeMeasurements = measurements.filter((m) => m.day >= fromDay);

  const points =
    view === "dia"
      ? toChartPoints(
          [...rangeSummaries].reverse(),
          (summary) => formatDayShort(summary.day),
          (summary) =>
            summary.total > 1 ? `· promedio de ${summary.total} tomas` : "",
        )
      : toChartPoints(
          rangeMeasurements,
          (m) => `${formatDayShort(m.day)} ${m.time}`,
        );

  const byDay = new Map<string, Measurement[]>();
  for (const m of rangeMeasurements) {
    const list = byDay.get(m.day);
    if (list) list.push(m);
    else byDay.set(m.day, [m]);
  }

  function announce(message: string) {
    setError(null);
    setFlash(message);
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = readMeasurementInput(new FormData(form));
    if ("error" in parsed) {
      setFlash(null);
      setError(parsed.error);
      return;
    }
    const nextId = measurements.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    setMeasurements((prev) =>
      [...prev, toMeasurement(parsed.data, nextId)].sort(byTime),
    );
    form.reset();
    announce(
      "Así se agrega una toma. En la app real queda guardada en la base; en esta página no.",
    );
  }

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId === null) return;
    const parsed = readMeasurementInput(new FormData(event.currentTarget));
    if ("error" in parsed) {
      setFlash(null);
      setError(parsed.error);
      return;
    }
    setMeasurements((prev) =>
      prev
        .map((m) => (m.id === editingId ? toMeasurement(parsed.data, m.id) : m))
        .sort(byTime),
    );
    setEditingId(null);
    announce(
      "Así se corrige una toma ya cargada. Acá el cambio dura hasta que recargues.",
    );
  }

  function handleDelete(id: number) {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
    setEditingId(null);
    announce("Así se borra una toma. Acá vuelve al recargar la página.");
  }

  function startEditing(id: number) {
    setEditingId(id);
    setFlash(null);
    setError(null);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(
      new FormData(event.currentTarget).get("dayNote") ?? "",
    ).trim();
    setDayNotes((prev) => {
      const next = { ...prev };
      if (value === "") delete next[today];
      else next[today] = value;
      return next;
    });
    announce("Así se guarda la nota del día. Acá no queda registrada.");
  }

  return (
    <div className="space-y-6" ref={topRef}>
      <section className="rounded-2xl border border-accent/30 bg-accent-soft p-5">
        <h1 className="text-xl font-semibold">Página de ejemplo</h1>
        <p className="mt-2 text-sm">
          Así funciona la app por dentro. Los datos que ves son{" "}
          <strong>inventados</strong> y no corresponden a ninguna persona.
        </p>
        <p className="mt-2 text-sm">
          Podés cargar una toma, editarla o borrarla para ver cómo se hace: todo
          responde de verdad, pero los cambios viven solo en tu navegador y se
          borran al recargar la página. Nada de lo que hagas acá se guarda ni
          toca los datos reales.
        </p>
      </section>

      {flash ? (
        <p
          role="status"
          className="rounded-xl border border-line bg-ok-soft px-4 py-3 text-sm text-ok"
        >
          {flash}
        </p>
      ) : null}

      {editing ? (
        <section className="card border-accent/40 p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Editar toma</h2>
            <span className="text-sm text-muted">
              {dayLabel(editing.day)} · {editing.time}
            </span>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <MeasurementFields
              key={editing.id}
              mode="edit"
              idPrefix={`editar-${editing.id}`}
              values={{
                ...editing,
                measuredAt: `${editing.day}T${editing.time}`,
              }}
              nowValue={nowValue}
              nowText={nowText}
            />

            {error ? (
              <p
                role="alert"
                className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary">
                Guardar cambios
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setEditingId(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn border border-line text-danger hover:bg-danger-soft"
                onClick={() => handleDelete(editing.id)}
              >
                Borrar toma
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div>
        <p className="text-sm text-muted">{todayLong}</p>
        <h2 className="text-2xl font-semibold">Hoy</h2>
      </div>

      {!editing ? (
        <section className="card p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Cargar una toma</h3>
          <p className="mb-4 text-sm text-muted">
            Completá solo lo que hayas medido. Se guarda con la hora de este
            momento salvo que indiques otra fecha.
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <MeasurementFields
              mode="create"
              idPrefix="demo"
              nowValue={nowValue}
              nowText={nowText}
            />

            {error ? (
              <p
                role="alert"
                className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn-primary w-full sm:w-auto">
              Guardar toma
            </button>
          </form>
        </section>
      ) : null}

      {todaySummary && todaySummary.total > 0 ? (
        <section className="card p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-lg font-semibold">Promedio de hoy</h3>
            <span className="text-sm text-muted">
              {todaySummary.total}{" "}
              {todaySummary.total === 1 ? "toma" : "tomas"}
            </span>
          </div>
          <MetricChips values={todaySummary} counts={todaySummary.counts} />
        </section>
      ) : null}

      <section className="card p-5">
        <h3 className="mb-3 text-lg font-semibold">Tomas de hoy</h3>
        <MeasurementList
          measurements={todayMeasurements}
          onEdit={startEditing}
        />
      </section>

      <section className="card p-5">
        <h3 className="mb-1 text-lg font-semibold">Nota del día</h3>
        <p className="mb-3 text-sm text-muted">
          Algo para recordar de hoy: cómo se sintió, qué comió, medicación.
        </p>
        <form onSubmit={handleNote} className="space-y-3">
          <textarea
            name="dayNote"
            rows={3}
            defaultValue={dayNotes[today] ?? ""}
            placeholder="Cómo pasó el día, si comió bien, medicación, síntomas, turnos médicos..."
            className="field resize-y"
          />
          <button type="submit" className="btn-ghost">
            Guardar nota
          </button>
        </form>
      </section>

      <div className="pt-2">
        <h2 className="text-2xl font-semibold">Métricas</h2>
        <p className="mt-1 text-sm text-muted">
          Promedio por día cuando hay varias tomas, y el detalle de cada horario
          más abajo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-xl bg-surface-soft p-1">
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              onClick={() => setDays(range.days)}
              aria-pressed={range.days === days}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                range.days === days
                  ? "bg-surface font-medium text-fg shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-xl bg-surface-soft p-1">
          {(
            [
              { id: "dia", label: "Por día" },
              { id: "toma", label: "Cada toma" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setView(option.id)}
              aria-pressed={option.id === view}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                option.id === view
                  ? "bg-surface font-medium text-fg shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ChartGrid points={points} />

      <section className="card p-5">
        <h3 className="mb-1 text-lg font-semibold">Detalle por día</h3>
        <p className="mb-3 text-sm text-muted">
          Tocá un día para ver cada toma con su horario.
        </p>

        <ul className="divide-y divide-line">
          {rangeSummaries.map((summary) => (
            <li key={summary.day} className="py-3 first:pt-0 last:pb-0">
              <details>
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">{dayLabel(summary.day)}</span>
                    <span className="text-xs text-muted">
                      {summary.total} {summary.total === 1 ? "toma" : "tomas"} ·
                      ver detalle
                    </span>
                  </div>
                  <div className="mt-2">
                    <MetricChips values={summary} counts={summary.counts} />
                  </div>
                </summary>

                <div className="mt-3 rounded-xl bg-surface-soft p-3">
                  <MeasurementList
                    measurements={byDay.get(summary.day) ?? []}
                    onEdit={startEditing}
                  />
                  {summary.note ? (
                    <p className="mt-3 border-t border-line pt-3 text-sm">
                      <span className="font-medium">Nota del día: </span>
                      <span className="text-muted">{summary.note}</span>
                    </p>
                  ) : null}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
