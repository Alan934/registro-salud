import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { resolveRange } from "@/lib/chart-groups";
import { buildReportPdf, reportFileName } from "@/lib/pdf";
import { getDaySummaries, getMeasurementsInRange } from "@/lib/queries";
import { shiftDay, todayKey } from "@/lib/tz";

/** El informe en PDF del período elegido, para descargar o compartir. */
export async function GET(request: NextRequest) {
  // El proxy ya corta las visitas sin sesión; esto cubre el acceso directo.
  const session = await getSession();
  if (!session) {
    return new Response("No autorizado.", { status: 401 });
  }

  const range = resolveRange(
    request.nextUrl.searchParams.get("dias") ?? undefined,
  );
  const toDay = todayKey();
  const fromDay = shiftDay(toDay, -(range.days - 1));

  const [summaries, measurements] = await Promise.all([
    getDaySummaries(fromDay, toDay),
    getMeasurementsInRange(fromDay, toDay),
  ]);

  const pdf = await buildReportPdf({
    summaries,
    measurements,
    fromDay,
    toDay,
    rangeLabel: range.label,
    generatedAt: new Date(),
  });

  // Se copia a un Uint8Array propio: el de pdf-lib no tipa como BodyInit.
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${reportFileName(fromDay, toDay)}"`,
      // Son datos de salud: que no queden en ningún caché intermedio.
      "Cache-Control": "no-store, private",
    },
  });
}
