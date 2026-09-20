import { TAG_BY_ID } from "@/lib/tags";

/** Las etiquetas de una toma, para leer (la version que se elige es TagPicker). */
export function TagChips({ tags }: { tags: readonly string[] }) {
  if (tags.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1">
      {tags.map((id) => {
        const tag = TAG_BY_ID[id];
        if (!tag) return null;
        return (
          <li
            key={id}
            className="rounded-full border border-line px-2 py-0.5 text-xs text-muted"
          >
            {tag.short}
          </li>
        );
      })}
    </ul>
  );
}
