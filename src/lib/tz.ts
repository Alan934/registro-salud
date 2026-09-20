/**
 * Todo el proyecto trabaja con la hora de Mendoza, Argentina.
 * Argentina no aplica horario de verano desde 2009, asi que el offset
 * es fijo en UTC-3. Eso permite convertir sin dependencias externas.
 */
export const TIME_ZONE = "America/Argentina/Mendoza";
export const TZ_OFFSET = "-03:00";

/** "2026-09-19" del instante dado, en hora de Mendoza. */
export function toDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** "14:35" del instante dado, en hora de Mendoza. */
export function toTimeKey(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** Valor para un <input type="datetime-local"> con la hora de Mendoza. */
export function toDateTimeLocal(date: Date): string {
  return `${toDayKey(date)}T${toTimeKey(date)}`;
}

/** Hoy en Mendoza, como "2026-09-19". */
export function todayKey(): string {
  return toDayKey(new Date());
}

/**
 * Convierte "2026-09-19T14:35" (hora de Mendoza) al instante UTC real.
 * Devuelve null si el texto no tiene el formato esperado.
 */
export function fromDateTimeLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d, hh, mm] = match;
  const date = new Date(`${y}-${m}-${d}T${hh}:${mm}:00${TZ_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const LONG_DATE = new Intl.DateTimeFormat("es-AR", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

const SHORT_DATE = new Intl.DateTimeFormat("es-AR", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
});

/** "viernes 19 de septiembre" a partir de "2026-09-19". */
export function formatDayLong(dayKey: string): string {
  const text = LONG_DATE.format(new Date(`${dayKey}T12:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "19/09" a partir de "2026-09-19". */
export function formatDayShort(dayKey: string): string {
  return SHORT_DATE.format(new Date(`${dayKey}T12:00:00Z`));
}

/** Etiqueta relativa para la lista de dias. */
export function dayLabel(dayKey: string): string {
  const today = todayKey();
  if (dayKey === today) return "Hoy";
  const yesterday = toDayKey(new Date(Date.now() - 86_400_000));
  if (dayKey === yesterday) return "Ayer";
  return formatDayLong(dayKey);
}

/** Si el texto es una fecha "YYYY-MM-DD" que existe de verdad. */
export function isDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  // Descarta cosas como "2026-02-31", que Date acomodaria sin avisar.
  return !Number.isNaN(date.getTime()) && toDayKeyUTC(date) === value;
}

/** "2026-09-19" de un Date, leido en UTC. */
function toDayKeyUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Dias que abarca el rango, contando los dos extremos. */
export function daysBetween(fromDay: string, toDay: string): number {
  const from = new Date(`${fromDay}T12:00:00Z`).getTime();
  const to = new Date(`${toDay}T12:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000) + 1;
}

/** Resta dias a una fecha "YYYY-MM-DD" manteniendo el formato. */
export function shiftDay(dayKey: string, days: number): string {
  const base = new Date(`${dayKey}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** "19/09 23:04" del instante dado, en hora de Mendoza. */
export function formatNowText(date: Date): string {
  return `${formatDayShort(toDayKey(date))} ${toTimeKey(date)}`;
}
