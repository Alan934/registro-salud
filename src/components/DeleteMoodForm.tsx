"use client";

import { deleteMoodAction } from "@/lib/actions";

export function DeleteMoodForm({ id }: { id: number }) {
  return (
    <form
      action={deleteMoodAction}
      onSubmit={(event) => {
        if (!confirm("¿Borrar este registro? No se puede deshacer.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted
                   transition hover:bg-danger-soft hover:text-danger"
      >
        Borrar
      </button>
    </form>
  );
}
