import type { Scale } from "@/lib/zones";

/**
 * Indice de masa corporal. Necesita la altura, que se carga una sola vez en
 * Ajustes y queda guardada; sin ella la app no muestra IMC en ningun lado.
 *
 * Los cortes son los de la OMS para personas adultas. Es una referencia
 * gruesa (no distingue musculo de grasa, ni edad): orienta, no diagnostica.
 */

export const HEIGHT_MIN = 100;
export const HEIGHT_MAX = 250;

export const BMI_SCALE: Scale = {
  from: 15,
  to: 40,
  zones: [
    { label: "Bajo peso", short: "BAJO", tone: "low", to: 18.5 },
    { label: "Normal", short: "NORM", tone: "ok", to: 25 },
    { label: "Sobrepeso", short: "SOBRE", tone: "warn", to: 30 },
    { label: "Obesidad", short: "OBES", tone: "high", to: null },
  ],
};

/** IMC con un decimal, o null si falta el peso o la altura. */
export function bmiFor(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined,
): number | null {
  if (!weightKg || !heightCm) return null;
  const meters = heightCm / 100;
  const bmi = weightKg / (meters * meters);
  if (!Number.isFinite(bmi)) return null;
  return Number(bmi.toFixed(1));
}

/** La altura tal como se escribe, o null si no sirve. */
export function parseHeight(raw: string): number | null {
  const text = raw.trim().replace(",", ".");
  if (text === "") return null;
  const value = Number(text);
  if (!Number.isFinite(value)) return null;
  if (value < HEIGHT_MIN || value > HEIGHT_MAX) return null;
  return Math.round(value);
}
