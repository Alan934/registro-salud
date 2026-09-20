/**
 * Etiquetas de contexto de una toma. Son un catalogo cerrado a proposito: el
 * contexto escrito a mano ("antes del desayuno", "antes de desayunar") no se
 * puede contar despues, y es justo lo que el medico pregunta cuando ve una
 * presion alta suelta.
 *
 * La observacion libre sigue estando para todo lo que no entra acá.
 */

export type Tag = { id: string; label: string; short: string };

export const TAGS: Tag[] = [
  { id: "en-ayunas", label: "En ayunas", short: "En ayunas" },
  { id: "antes-comer", label: "Antes de comer", short: "Antes de comer" },
  { id: "despues-comer", label: "Después de comer", short: "Después de comer" },
  { id: "en-reposo", label: "En reposo", short: "En reposo" },
  {
    id: "despues-caminar",
    label: "Después de caminar",
    short: "Tras caminar",
  },
  {
    id: "antes-medicacion",
    label: "Antes de la medicación",
    short: "Antes de medicar",
  },
  {
    id: "despues-medicacion",
    label: "Después de la medicación",
    short: "Tras medicar",
  },
  { id: "al-levantarse", label: "Al levantarse", short: "Al levantarse" },
  { id: "al-acostarse", label: "Al acostarse", short: "Al acostarse" },
  { id: "con-malestar", label: "Con malestar", short: "Con malestar" },
];

export const TAG_BY_ID = Object.fromEntries(
  TAGS.map((tag) => [tag.id, tag]),
) as Record<string, Tag>;

/**
 * Deja solo etiquetas del catalogo, sin repetidos y en el orden en que estan
 * definidas, para que dos tomas con las mismas etiquetas se vean igual.
 */
export function normalizeTags(values: readonly string[]): string[] {
  const chosen = new Set(values.map((value) => value.trim()));
  return TAGS.filter((tag) => chosen.has(tag.id)).map((tag) => tag.id);
}

/** "En ayunas · En reposo" para el PDF y los textos de una linea. */
export function tagsText(tags: readonly string[]): string {
  return tags
    .map((id) => TAG_BY_ID[id]?.label)
    .filter((label): label is string => Boolean(label))
    .join(" · ");
}
