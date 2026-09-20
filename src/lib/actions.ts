"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkCredentials, endSession, getSession, startSession } from "@/lib/auth";
import { readMeasurementInput } from "@/lib/measurement-input";
import {
  createMeasurement,
  deleteMeasurement,
  saveDailyNote,
  updateMeasurement,
} from "@/lib/queries";
import { todayKey } from "@/lib/tz";

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

function refresh() {
  revalidatePath("/");
  revalidatePath("/metricas");
}

export async function createMeasurementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  const parsed = readMeasurementInput(formData);
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

  const parsed = readMeasurementInput(formData);
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
