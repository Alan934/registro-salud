"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkCredentials, endSession, getSession, startSession } from "@/lib/auth";
import { METRICS, METRIC_BY_KEY, type MetricKey } from "@/lib/metrics";
import {
  createMeasurement,
  deleteMeasurement,
  saveDailyNote,
  updateMeasurement,
  type NewMeasurement,
} from "@/lib/queries";
import { fromDateTimeLocal, todayKey } from "@/lib/tz";

export type FormState = { error?: string; ok?: string };

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/* ------------------------------- sesion -------------------------------- */

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = String(formData.get("user") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!user || !password) {
    return { error: "Completa usuario y contraseña." };
  }

  let valid = false;
  try {
    valid = checkCredentials(user, password);
  } catch {
    return { error: "El servidor no tiene configuradas las credenciales." };
  }

  if (!valid) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await startSession(user.trim());
  redirect(next.startsWith("/") ? next : "/");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/login");
}

/* ------------------------------- tomas --------------------------------- */

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

function readMeasurement(
  formData: FormData,
): { data: NewMeasurement } | { error: string } {
  const values = {} as Record<MetricKey, number | null>;
  let filled = 0;

  for (const metric of METRICS) {
    const parsed = parseMetric(metric.key, formData.get(metric.key));
    if (parsed.error) return { error: parsed.error };
    values[metric.key] = parsed.value;
    if (parsed.value !== null) filled += 1;
  }

  const note = String(formData.get("note") ?? "").trim();
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

  if (
    (values.systolic === null) !== (values.diastolic === null) &&
    (values.systolic !== null || values.diastolic !== null)
  ) {
    return { error: "Para la presión cargá los dos valores: máxima y mínima." };
  }
  if (
    values.systolic !== null &&
    values.diastolic !== null &&
    values.diastolic >= values.systolic
  ) {
    return { error: "La presión mínima tiene que ser menor que la máxima." };
  }

  return { data: { ...values, note: note === "" ? null : note, measuredAt } };
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/metricas");
}

export async function createMeasurementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  const parsed = readMeasurement(formData);
  if ("error" in parsed) return { error: parsed.error };

  await createMeasurement(parsed.data);
  refresh();
  return { ok: "Toma guardada." };
}

export async function updateMeasurementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "No encontré esa toma." };

  const parsed = readMeasurement(formData);
  if ("error" in parsed) return { error: parsed.error };

  await updateMeasurement(id, parsed.data);
  refresh();
  revalidatePath(`/toma/${id}`);
  return { ok: "Cambios guardados." };
}

export async function deleteMeasurementAction(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) {
    await deleteMeasurement(id);
    refresh();
  }
  redirect(String(formData.get("redirectTo") ?? "/"));
}

/* ---------------------------- nota del dia ----------------------------- */

export async function saveDailyNoteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  const day = String(formData.get("day") ?? todayKey());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return { error: "Fecha inválida." };
  }
  const note = String(formData.get("dayNote") ?? "");
  if (note.length > 4000) {
    return { error: "La nota es demasiado larga." };
  }
  await saveDailyNote(day, note);
  refresh();
  return { ok: "Nota guardada." };
}
