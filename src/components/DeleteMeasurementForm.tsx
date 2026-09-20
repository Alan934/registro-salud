"use client";

import { deleteMeasurementAction } from "@/lib/actions";

export function DeleteMeasurementForm({
  id,
  redirectTo,
}: {
  id: number;
  redirectTo: string;
}) {
  return (
    <form
      action={deleteMeasurementAction}
      onSubmit={(event) => {
        if (!confirm("¿Borrar esta toma? No se puede deshacer.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button
        type="submit"
        className="btn border border-line text-danger hover:bg-danger-soft"
      >
        Borrar toma
      </button>
    </form>
  );
}
