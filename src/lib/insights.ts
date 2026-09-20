import { shiftDay } from "@/lib/tz";

/**
 * Constancia del registro: que dias se midio y cuantos dias seguidos se viene
 * midiendo. Sale de los resumenes diarios que la pantalla ya tiene, sin pedir
 * nada mas a la base.
 */

export type DayMarkKind = "measured" | "note" | "empty";

export type DayMark = { day: string; kind: DayMarkKind };

type DayLike = { day: string; total: number; note: string | null };

/** Una marca por dia del rango, del mas viejo al mas nuevo. */
export function buildDayMarks(
  fromDay: string,
  toDay: string,
  days: DayLike[],
): DayMark[] {
  const byDay = new Map(days.map((item) => [item.day, item]));
  const marks: DayMark[] = [];
  for (let day = fromDay; day <= toDay; day = shiftDay(day, 1)) {
    const item = byDay.get(day);
    marks.push({
      day,
      kind:
        item && item.total > 0 ? "measured" : item?.note ? "note" : "empty",
    });
  }
  return marks;
}

export function countMeasured(marks: DayMark[]): number {
  return marks.filter((mark) => mark.kind === "measured").length;
}

/**
 * Dias seguidos con al menos una toma, contando hacia atras. Si hoy todavia
 * no se cargo nada la racha sigue viva hasta ayer: recien se corta cuando se
 * pasa un dia entero sin registrar.
 */
export function currentStreak(
  days: DayLike[],
  today: string,
): { days: number; upToToday: boolean } {
  const measured = new Set(
    days.filter((item) => item.total > 0).map((item) => item.day),
  );

  const upToToday = measured.has(today);
  let cursor = upToToday ? today : shiftDay(today, -1);
  if (!measured.has(cursor)) return { days: 0, upToToday: false };

  let count = 0;
  while (measured.has(cursor)) {
    count += 1;
    cursor = shiftDay(cursor, -1);
  }
  return { days: count, upToToday };
}
