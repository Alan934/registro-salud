"use client";

import { useEffect, useRef, useState } from "react";
import { MoodFace } from "@/components/MoodFace";
import {
  MOOD_DEFAULT,
  MOOD_MAX,
  MOOD_MIN,
  SYMPTOMS,
  moodLevel,
} from "@/lib/mood";

/**
 * Los campos de "cómo se sintió". Los usan el formulario real (server action)
 * y el de la página de ejemplo, para que se vean y validen igual.
 */
export function MoodFields({
  idPrefix = "animo",
  nowValue,
  nowText,
}: {
  idPrefix?: string;
  /** Ahora en Mendoza, formato del input (tope del calendario). */
  nowValue: string;
  /** Ahora en Mendoza, en texto legible. */
  nowText: string;
}) {
  const [mood, setMood] = useState(MOOD_DEFAULT);
  const level = moodLevel(mood);
  const slider = useRef<HTMLInputElement>(null);

  /*
    El puntaje es el unico campo controlado por React: un form.reset() le
    devuelve el valor al input pero no al estado, y la carita se quedaba en
    el ultimo puntaje guardado. Escuchando el reset del formulario los dos
    vuelven juntos al medio.
  */
  useEffect(() => {
    const form = slider.current?.form;
    if (!form) return;
    const onReset = () => setMood(MOOD_DEFAULT);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  return (
    <>
      <div
        className="flex items-center gap-4 rounded-2xl px-4 py-3"
        style={{ background: level.soft }}
      >
        <MoodFace value={mood} className="h-14 w-14 shrink-0" />
        <div>
          <p className="text-xl font-semibold" style={{ color: level.color }}>
            {level.label}
          </p>
          <p className="text-sm text-muted tabular-nums">
            {mood} de {MOOD_MAX}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-mood`}
          className="block text-sm font-medium"
        >
          ¿Cómo se sintió?
        </label>
        <input
          ref={slider}
          id={`${idPrefix}-mood`}
          name="mood"
          type="range"
          min={MOOD_MIN}
          max={MOOD_MAX}
          step={1}
          value={mood}
          onChange={(event) => setMood(Number(event.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-xs text-muted">
          <span>Muy mal</span>
          <span>Muy bien</span>
        </div>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">
          Síntomas <span className="font-normal text-muted">(opcional)</span>
        </legend>

        <div className="flex flex-wrap gap-2 pt-1">
          {SYMPTOMS.map((symptom) => (
            <label key={symptom.id} className="cursor-pointer">
              <input
                type="checkbox"
                id={`${idPrefix}-symptom-${symptom.id}`}
                name="symptoms"
                value={symptom.id}
                className="peer sr-only"
              />
              <span
                className="inline-flex rounded-full border border-line bg-surface px-3 py-1.5
                           text-sm transition
                           peer-checked:border-accent peer-checked:bg-accent-soft
                           peer-checked:font-medium peer-checked:text-accent
                           peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40"
              >
                {symptom.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-note`}
          className="block text-sm font-medium"
        >
          Nota <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          id={`${idPrefix}-note`}
          name="moodNote"
          rows={2}
          placeholder="Ej.: se mareó al levantarse, mejoró después de comer..."
          className="field resize-y"
        />
      </div>

      <details className="rounded-xl bg-surface-soft p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Fecha y hora
          <span className="ml-1 font-normal text-muted">
            — ahora ({nowText}). Tocá para cargar otro momento.
          </span>
        </summary>
        <div className="mt-3">
          <input
            id={`${idPrefix}-loggedAt`}
            name="loggedAt"
            type="datetime-local"
            max={nowValue}
            className="field"
          />
        </div>
      </details>
    </>
  );
}
