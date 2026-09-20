import {
  daysBetween,
  formatDayShort,
  isDayKey,
  shiftDay,
  todayKey,
} from "@/lib/tz";

/**
 * El período que se está mirando en Métricas. Puede venir de un atajo
 * ("30 días") o de dos fechas elegidas a mano.
 */

export const RANGES = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
  { days: 365, label: "1 año" },
] as const;

const DEFAULT_RANGE = RANGES[1]; // 30 días

/** Tope del rango a mano, para no pedirle a la base algo absurdo. */
export const MAX_PERIOD_DAYS = 732; // dos años

export type Period = {
  fromDay: string;
  toDay: string;
  /** Cantidad de días que abarca, contando los dos extremos. */
  days: number;
  label: string;
  custom: boolean;
};

export type PeriodParams = {
  dias?: string;
  desde?: string;
  hasta?: string;
};

/** Los parámetros de URL que reconstruyen este período. */
export function periodQuery(period: Period): Record<string, string | number> {
  return period.custom
    ? { desde: period.fromDay, hasta: period.toDay }
    : { dias: period.days };
}

function fromRange(days: number, today: string): Period {
  const range = RANGES.find((item) => item.days === days) ?? DEFAULT_RANGE;
  return {
    fromDay: shiftDay(today, -(range.days - 1)),
    toDay: today,
    days: range.days,
    label: range.label,
    custom: false,
  };
}

/**
 * Lee el período de la URL. Primero las fechas a mano; si no son usables se
 * cae al atajo de `dias`, y si ese tampoco sirve, a 30 días.
 */
export function resolvePeriod(params: PeriodParams, today = todayKey()): Period {
  const { desde, hasta } = params;

  if (desde && hasta && isDayKey(desde) && isDayKey(hasta)) {
    // Si vienen al revés se dan vuelta: es lo que la persona quiso decir.
    let fromDay = desde <= hasta ? desde : hasta;
    let toDay = desde <= hasta ? hasta : desde;

    // No tiene sentido pedir días que todavía no pasaron.
    if (toDay > today) toDay = today;
    if (fromDay > today) fromDay = today;

    if (daysBetween(fromDay, toDay) > MAX_PERIOD_DAYS) {
      fromDay = shiftDay(toDay, -(MAX_PERIOD_DAYS - 1));
    }

    return {
      fromDay,
      toDay,
      days: daysBetween(fromDay, toDay),
      label: `${formatDayShort(fromDay)} al ${formatDayShort(toDay)}`,
      custom: true,
    };
  }

  return fromRange(Number(params.dias), today);
}

/**
 * El período de igual largo justo anterior a este, para comparar contra él.
 * Con 30 días de período, son los 30 días previos al primer día.
 */
export function previousPeriod(period: Period): {
  fromDay: string;
  toDay: string;
} {
  const toDay = shiftDay(period.fromDay, -1);
  return { fromDay: shiftDay(toDay, -(period.days - 1)), toDay };
}
