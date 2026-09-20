import { TAGS } from "@/lib/tags";

/**
 * Las etiquetas de la toma, como chips que se prenden y apagan. Son
 * checkboxes de verdad (ocultos): funcionan sin JavaScript y el formulario
 * los manda como varios valores del campo "tags".
 */
export function TagPicker({
  selected = [],
  idPrefix = "toma",
}: {
  selected?: readonly string[];
  idPrefix?: string;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">
        Etiquetas <span className="font-normal text-muted">(opcional)</span>
      </legend>
      <p className="text-xs text-muted">
        En qué momento se midió. Sirve para leer los números después: una
        presión en reposo y otra después de caminar no se comparan igual.
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        {TAGS.map((tag) => (
          <label key={tag.id} className="cursor-pointer">
            <input
              type="checkbox"
              id={`${idPrefix}-tag-${tag.id}`}
              name="tags"
              value={tag.id}
              defaultChecked={selected.includes(tag.id)}
              className="peer sr-only"
            />
            <span
              className="inline-flex rounded-full border border-line bg-surface px-3 py-1.5
                         text-sm transition
                         peer-checked:border-accent peer-checked:bg-accent-soft
                         peer-checked:font-medium peer-checked:text-accent
                         peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40"
            >
              {tag.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
