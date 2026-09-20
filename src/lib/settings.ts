import "server-only";
import { sql } from "@/lib/db";

/**
 * Ajustes sueltos de la app, guardados como texto en una tabla clave/valor.
 * Hoy hay uno solo (la altura, para el IMC) y no justifica una tabla propia
 * con una columna por cosa.
 */

export const HEIGHT_KEY = "height_cm";

export async function getSetting(key: string): Promise<string | null> {
  const rows = (await sql.query("SELECT value FROM settings WHERE key = $1", [
    key,
  ])) as Array<{ value: string }>;
  return rows[0]?.value ?? null;
}

export async function setSetting(
  key: string,
  value: string | null,
): Promise<void> {
  if (value === null) {
    await sql`DELETE FROM settings WHERE key = ${key}`;
    return;
  }
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES (${key}, ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
}

/** La altura en centimetros, o null si todavia no se cargo. */
export async function getHeightCm(): Promise<number | null> {
  const raw = await getSetting(HEIGHT_KEY);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
