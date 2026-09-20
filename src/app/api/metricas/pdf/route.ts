import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { previousPeriod, resolvePeriod } from "@/lib/period";
import { buildReportPdf, reportFileName } from "@/lib/pdf";
import {
  getDaySummaries,
  getMeasurementsInRange,
  getMoodLogsInRange,
  getPeriodAverages,
  getTagCounts,
} from "@/lib/queries";
import { getHeightCm } from "@/lib/settings";
import { buildTrends } from "@/lib/trends";
import { formatDayShort } from "@/lib/tz";

/** El informe en PDF del período elegido, para descargar o compartir. */
export async function GET(request: NextRequest) {
  // El proxy ya corta las visitas sin sesión; esto cubre el acceso directo.
  const session = await getSession();
  if (!session) {
    return new Response("No autorizado.", { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const period = resolvePeriod({
    dias: params.get("dias") ?? undefined,
    desde: params.get("desde") ?? undefined,
    hasta: params.get("hasta") ?? undefined,
  });
  const { fromDay, toDay } = period;
  const previous = previousPeriod(period);

  const [
    summaries,
    measurements,
    currentAverages,
    previousAverages,
    tagCounts,
    heightCm,
    moodLogs,
  ] = await Promise.all([
    getDaySummaries(fromDay, toDay),
    getMeasurementsInRange(fromDay, toDay),
    getPeriodAverages(fromDay, toDay),
    getPeriodAverages(previous.fromDay, previous.toDay),
    getTagCounts(fromDay, toDay),
    getHeightCm(),
    getMoodLogsInRange(fromDay, toDay),
  ]);

  const pdf = await buildReportPdf({
    summaries,
    measurements,
    fromDay,
    toDay,
    // Con fechas a mano el label repetiría las fechas del encabezado.
    rangeLabel: period.custom ? `${period.days} días` : period.label,
    trends: buildTrends(currentAverages, previousAverages),
    previousLabel: `${formatDayShort(previous.fromDay)} al ${formatDayShort(
      previous.toDay,
    )}`,
    tagCounts,
    heightCm,
    moodLogs,
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
