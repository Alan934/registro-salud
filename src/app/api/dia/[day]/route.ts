import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getMeasurementsForDay, getMoodLogsForDay } from "@/lib/queries";
import { isDayKey } from "@/lib/tz";

/**
 * Las tomas de un día puntual y cómo se sintió. La pantalla de Métricas las
 * pide recién cuando se despliega ese día, así no manda al navegador todas
 * las del período.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/dia/[day]">,
) {
  const session = await getSession();
  if (!session) {
    return new Response("No autorizado.", { status: 401 });
  }

  const { day } = await context.params;
  if (!isDayKey(day)) {
    return new Response("Fecha inválida.", { status: 400 });
  }

  const [measurements, moods] = await Promise.all([
    getMeasurementsForDay(day),
    getMoodLogsForDay(day),
  ]);

  return Response.json(
    { measurements, moods },
    // Son datos de salud: que no queden en ningún caché intermedio.
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
