import type { MoodLog, NewMoodLog } from "@/lib/model";
import { fromDateTimeLocal } from "@/lib/tz";

/**
 * Cómo se sintió: un puntaje de 0 a 10 y, si hace falta, los síntomas del
 * momento. Es lo único que se registra sin aparato: un día de 130/85 con
 * mareo y otro de 130/85 sin nada no son el mismo día, y eso no lo dice
 * ningún número.
 */

export const MOOD_MIN = 0;
export const MOOD_MAX = 10;
/** Arranca en el medio: no sugiere ni bien ni mal. */
export const MOOD_DEFAULT = 5;

export type MoodLevel = {
  /** Límite superior, exclusivo. El último no tiene. */
  to: number | null;
  label: string;
  color: string;
  soft: string;
  pill: string;
};

export const MOOD_LEVELS: MoodLevel[] = [
  {
    to: 3,
    label: "Muy mal",
    color: "var(--danger)",
    soft: "var(--danger-soft)",
    pill: "pill-high",
  },
  {
    to: 5,
    label: "Mal",
    color: "var(--warn)",
    soft: "var(--warn-soft)",
    pill: "pill-warn",
  },
  {
    to: 7,
    label: "Regular",
    color: "var(--muted)",
    soft: "var(--surface-soft)",
    pill: "pill-neutral",
  },
  {
    to: 9,
    label: "Bien",
    color: "var(--ok)",
    soft: "var(--ok-soft)",
    pill: "pill-ok",
  },
  {
    to: null,
    label: "Muy bien",
    color: "var(--ok)",
    soft: "var(--ok-soft)",
    pill: "pill-ok",
  },
];

export function moodLevel(value: number): MoodLevel {
  return (
    MOOD_LEVELS.find((level) => level.to === null || value < level.to) ??
    MOOD_LEVELS[MOOD_LEVELS.length - 1]
  );
}

export type Symptom = { id: string; label: string };

export const SYMPTOMS: Symptom[] = [
  { id: "dolor-cabeza", label: "Dolor de cabeza" },
  { id: "mareo", label: "Mareo" },
  { id: "cansancio", label: "Cansancio" },
  { id: "nauseas", label: "Náuseas" },
  { id: "falta-aire", label: "Falta de aire" },
  { id: "dolor-pecho", label: "Dolor de pecho" },
  { id: "hinchazon", label: "Hinchazón" },
  { id: "durmio-mal", label: "Durmió mal" },
  { id: "dolor-articular", label: "Dolor articular" },
  { id: "sin-apetito", label: "Sin apetito" },
];

export const SYMPTOM_BY_ID = Object.fromEntries(
  SYMPTOMS.map((symptom) => [symptom.id, symptom]),
) as Record<string, Symptom>;

/** Deja solo síntomas del catálogo, sin repetidos y en el orden definido. */
export function normalizeSymptoms(values: readonly string[]): string[] {
  const chosen = new Set(values.map((value) => value.trim()));
  return SYMPTOMS.filter((symptom) => chosen.has(symptom.id)).map(
    (symptom) => symptom.id,
  );
}

export type ParsedMood = { data: NewMoodLog } | { error: string };

/**
 * Validación del formulario. No depende del servidor: la usan la server
 * action y la página de ejemplo, así las dos se comportan igual.
 */
export function readMoodInput(formData: FormData): ParsedMood {
  const raw = String(formData.get("mood") ?? "").trim();
  const mood = Number(raw);
  if (
    raw === "" ||
    !Number.isInteger(mood) ||
    mood < MOOD_MIN ||
    mood > MOOD_MAX
  ) {
    return { error: `Elegí cómo se sintió, de ${MOOD_MIN} a ${MOOD_MAX}.` };
  }

  const symptoms = normalizeSymptoms(
    formData.getAll("symptoms").map((value) => String(value)),
  );

  const note = String(formData.get("moodNote") ?? "").trim();
  if (note.length > 2000) {
    return { error: "La nota es demasiado larga." };
  }

  const rawDate = String(formData.get("loggedAt") ?? "").trim();
  let loggedAt = new Date();
  if (rawDate !== "") {
    const parsed = fromDateTimeLocal(rawDate);
    if (!parsed) return { error: "La fecha y hora no son válidas." };
    if (parsed.getTime() > Date.now() + 60_000) {
      return { error: "La fecha y hora no pueden ser futuras." };
    }
    loggedAt = parsed;
  }

  return {
    data: { mood, symptoms, note: note === "" ? null : note, loggedAt },
  };
}

export type MoodSummary = {
  /** Promedio del período, o null si no hay registros. */
  average: number | null;
  total: number;
  /** Promedio por día, del más viejo al más nuevo. */
  byDay: Array<{ day: string; mood: number; total: number }>;
  /** Síntomas anotados, del más frecuente al menos. */
  symptoms: Array<{ id: string; total: number }>;
};

/** Resumen del período a partir de los registros, sin pasar por SQL. */
export function summarizeMood(logs: MoodLog[]): MoodSummary {
  if (logs.length === 0) {
    return { average: null, total: 0, byDay: [], symptoms: [] };
  }

  const byDay = new Map<string, { sum: number; total: number }>();
  const symptomTotals = new Map<string, number>();

  for (const log of logs) {
    const day = byDay.get(log.day) ?? { sum: 0, total: 0 };
    day.sum += log.mood;
    day.total += 1;
    byDay.set(log.day, day);

    for (const symptom of log.symptoms) {
      symptomTotals.set(symptom, (symptomTotals.get(symptom) ?? 0) + 1);
    }
  }

  const sum = logs.reduce((total, log) => total + log.mood, 0);

  return {
    average: sum / logs.length,
    total: logs.length,
    byDay: [...byDay.entries()]
      .map(([day, item]) => ({
        day,
        mood: item.sum / item.total,
        total: item.total,
      }))
      .sort((a, b) => (a.day < b.day ? -1 : 1)),
    symptoms: SYMPTOMS.flatMap((symptom) => {
      const total = symptomTotals.get(symptom.id);
      return total ? [{ id: symptom.id, total }] : [];
    }).sort((a, b) => b.total - a.total),
  };
}
