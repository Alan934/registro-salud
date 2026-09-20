import { METRIC_BY_KEY, METRICS, type MetricKey } from "@/lib/metrics";
import type { NewMeasurement } from "@/lib/model";
import { normalizeTags } from "@/lib/tags";
import { fromDateTimeLocal } from "@/lib/tz";

/**
 * Validacion del formulario de tomas. No depende del servidor, asi la usan
 * tanto las server actions como la pagina de ejemplo.
 */

export type ParsedMeasurement =
  | { data: NewMeasurement }
  | { error: string };

function parseMetric(
  key: MetricKey,
  raw: FormDataEntryValue | null,
): { value: number | null; error?: string } {
  const text = String(raw ?? "").trim().replace(",", ".");
  if (text === "") return { value: null };

  const metric = METRIC_BY_KEY[key];
  const value = Number(text);
  if (!Number.isFinite(value)) {
    return { value: null, error: `${metric.label}: escribí un número válido.` };
  }
  if (value < metric.min || value > metric.max) {
    return {
      value: null,
      error: `${metric.label}: el valor debe estar entre ${metric.min} y ${metric.max} ${metric.unit}.`,
    };
  }
  return { value: Number(value.toFixed(metric.decimals)) };
}

export function readMeasurementInput(formData: FormData): ParsedMeasurement {
  const values = {} as Record<MetricKey, number | null>;
  let filled = 0;

  for (const metric of METRICS) {
    const parsed = parseMetric(metric.key, formData.get(metric.key));
    if (parsed.error) return { error: parsed.error };
    values[metric.key] = parsed.value;
    if (parsed.value !== null) filled += 1;
  }

  const note = String(formData.get("note") ?? "").trim();
  // Una toma con etiquetas pero sin ningun numero ni observacion no dice nada.
  const tags = normalizeTags(
    formData.getAll("tags").map((value) => String(value)),
  );
  if (filled === 0 && note === "") {
    return { error: "Cargá al menos un valor o una observación." };
  }

  const rawDate = String(formData.get("measuredAt") ?? "").trim();
  let measuredAt = new Date();
  if (rawDate !== "") {
    const parsed = fromDateTimeLocal(rawDate);
    if (!parsed) return { error: "La fecha y hora no son válidas." };
    if (parsed.getTime() > Date.now() + 60_000) {
      return { error: "La fecha y hora no pueden ser futuras." };
    }
    measuredAt = parsed;
  }

  const bothOrNone =
    (values.systolic === null) === (values.diastolic === null);
  if (!bothOrNone) {
    return { error: "Para la presión cargá los dos valores: máxima y mínima." };
  }
  if (
    values.systolic !== null &&
    values.diastolic !== null &&
    values.diastolic >= values.systolic
  ) {
    return { error: "La presión mínima tiene que ser menor que la máxima." };
  }

  return {
    data: { ...values, note: note === "" ? null : note, tags, measuredAt },
  };
}
