import { TAGS, TAG_BY_ID } from "@/lib/tags";

export type TagCount = { tag: string; total: number };

/**
 * Que etiquetas se usaron en el periodo y cuantas veces. La barra compara
 * contra la mas usada: se ve enseguida en que contexto se mide casi siempre
 * y cual quedo sin registrar.
 */
export function TagSummary({ counts }: { counts: TagCount[] }) {
  const used = counts.filter((item) => TAG_BY_ID[item.tag]);

  if (used.length === 0) {
    return (
      <p className="text-sm text-muted">
        Todavía no hay tomas con etiquetas en este período. Se eligen al
        cargar la toma.
      </p>
    );
  }

  const max = Math.max(...used.map((item) => item.total));

  return (
    <ul className="space-y-2">
      {used.map((item) => (
        <li key={item.tag} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm">
            {TAG_BY_ID[item.tag].label}
          </span>
          <span
            aria-hidden="true"
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-soft"
          >
            <span
              className="block h-full rounded-full bg-accent/60"
              style={{ width: `${(item.total / max) * 100}%` }}
            />
          </span>
          <span className="w-16 shrink-0 text-right text-sm text-muted tabular-nums">
            {item.total} {item.total === 1 ? "toma" : "tomas"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Las mismas cuentas pero calculadas en el navegador (pagina de ejemplo). */
export function countTags(rows: Array<{ tags: string[] }>): TagCount[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    for (const tag of row.tags) {
      totals.set(tag, (totals.get(tag) ?? 0) + 1);
    }
  }
  return TAGS.flatMap((tag) => {
    const total = totals.get(tag.id);
    return total ? [{ tag: tag.id, total }] : [];
  }).sort((a, b) => b.total - a.total);
}
