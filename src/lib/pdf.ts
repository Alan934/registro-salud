import "server-only";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import { METRICS, METRIC_BY_KEY, formatValue, type MetricKey } from "@/lib/metrics";
import type { DaySummary, Measurement } from "@/lib/model";
import type { Trend } from "@/lib/trends";
import { formatDayLong } from "@/lib/tz";

/**
 * Arma el PDF que se lleva al medico: resumen del periodo, una fila por dia
 * y las notas al final. Se dibuja a mano porque pdf-lib no trae tablas.
 */

const PAGE = { width: 595.28, height: 841.89 }; // A4 vertical, en puntos
const MARGIN = 40;
const CONTENT = PAGE.width - MARGIN * 2;
const FOOTER_SPACE = 46;

const INK = rgb(0.11, 0.1, 0.09);
const MUTED = rgb(0.45, 0.43, 0.39);
const LINE = rgb(0.85, 0.84, 0.81);
const ACCENT = rgb(0.08, 0.47, 0.42);
const ZEBRA = rgb(0.973, 0.969, 0.961);

/**
 * Las fuentes estandar del PDF codifican WinAnsi (Latin-1 y unos pocos extra).
 * Una nota escrita en el telefono puede traer emojis y pdf-lib tira error al
 * encontrarlos, asi que se limpia todo lo que no entra antes de dibujar.
 */
const WINANSI_EXTRA = new Set(
  [
    "€", "‚", "ƒ", "„", "…", "†", "‡",
    "ˆ", "‰", "Š", "‹", "Œ", "Ž", "‘",
    "’", "“", "”", "•", "–", "—", "˜",
    "™", "š", "›", "œ", "ž", "Ÿ",
  ],
);

function toWinAnsi(text: string): string {
  let out = "";
  for (const char of text.replace(/[\r\n\t]+/g, " ")) {
    const cp = char.codePointAt(0) ?? 0;
    if ((cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa0 && cp <= 0xff)) out += char;
    else if (WINANSI_EXTRA.has(char)) out += char;
    // lo que no entra (emojis, simbolos raros) se descarta
  }
  // Al sacar un emoji queda su espacio: " ." vuelve a ser ".".
  return out
    .replace(/ {2,}/g, " ")
    .replace(/ +([,.;:!?])/g, "$1")
    .trim();
}

/** "2026-09-19" -> "19/09/2026". */
function formatDayNumeric(day: string): string {
  const [year, month, dayOfMonth] = day.split("-");
  return `${dayOfMonth}/${month}/${year}`;
}

type Align = "left" | "right";

type Column<T> = {
  header: string;
  unit: string;
  width: number;
  align: Align;
  value: (row: T) => string;
};

/** Cursor de dibujo, con salto de pagina automatico. */
function createCanvas(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const pages: PDFPage[] = [];
  let page = doc.addPage([PAGE.width, PAGE.height]);
  pages.push(page);
  let y = PAGE.height - MARGIN;

  function newPage() {
    page = doc.addPage([PAGE.width, PAGE.height]);
    pages.push(page);
    y = PAGE.height - MARGIN;
  }

  /** Salta de pagina si lo que viene no entra arriba del pie. */
  function ensure(space: number) {
    if (y - space < MARGIN + FOOTER_SPACE) newPage();
  }

  function draw(
    text: string,
    x: number,
    size: number,
    options: { font?: PDFFont; color?: RGB; align?: Align; width?: number } = {},
  ) {
    const usedFont = options.font ?? font;
    const clean = toWinAnsi(text);
    if (clean === "") return;
    const offset =
      options.align === "right" && options.width
        ? options.width - usedFont.widthOfTextAtSize(clean, size)
        : 0;
    page.drawText(clean, {
      x: x + offset,
      y,
      size,
      font: usedFont,
      color: options.color ?? INK,
    });
  }

  /** Parte el texto en lineas que entren en `width`. */
  function wrap(text: string, size: number, width: number): string[] {
    const clean = toWinAnsi(text);
    if (clean === "") return [];
    const lines: string[] = [];
    let current = "";
    for (const word of clean.split(" ")) {
      const candidate = current === "" ? word : `${current} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        current = candidate;
      } else {
        if (current !== "") lines.push(current);
        current = word;
      }
    }
    if (current !== "") lines.push(current);
    return lines;
  }

  function rule(color: RGB = LINE) {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + CONTENT, y },
      thickness: 0.5,
      color,
    });
  }

  return {
    get pages() {
      return pages;
    },
    move(delta: number) {
      y -= delta;
    },
    ensure,
    draw,
    wrap,
    rule,
    heading(text: string) {
      ensure(46);
      y -= 8;
      draw(text, MARGIN, 12, { font: bold, color: ACCENT });
      y -= 6;
      rule();
      y -= 14;
    },
    /** Encabezado de tabla: nombre arriba, unidad abajo. */
    tableHead<T>(columns: Column<T>[]) {
      ensure(40);
      let x = MARGIN;
      for (const column of columns) {
        draw(column.header, x, 8.5, {
          font: bold,
          color: MUTED,
          align: column.align,
          width: column.width,
        });
        x += column.width;
      }
      y -= 10;
      x = MARGIN;
      for (const column of columns) {
        draw(column.unit, x, 7.5, {
          color: MUTED,
          align: column.align,
          width: column.width,
        });
        x += column.width;
      }
      y -= 5;
      rule();
      y -= 12;
    },
    tableRow<T>(columns: Column<T>[], row: T, index: number) {
      ensure(18);
      if (index % 2 === 1) {
        page.drawRectangle({
          x: MARGIN,
          y: y - 4,
          width: CONTENT,
          height: 14,
          color: ZEBRA,
        });
      }
      let x = MARGIN;
      for (const column of columns) {
        draw(column.value(row), x, 9, {
          align: column.align,
          width: column.width,
        });
        x += column.width;
      }
      y -= 16;
    },
  };
}

type Stat = { count: number; avg: number; min: number; max: number };

/** Promedio, minimo y maximo por metrica, sobre cada toma (no sobre el promedio diario). */
function statsFor(
  measurements: Measurement[],
): Partial<Record<MetricKey, Stat>> {
  const stats: Partial<Record<MetricKey, Stat>> = {};
  for (const metric of METRICS) {
    const values = measurements
      .map((measurement) => measurement[metric.key])
      .filter((value): value is number => value !== null);
    if (values.length === 0) continue;
    stats[metric.key] = {
      count: values.length,
      avg: values.reduce((total, value) => total + value, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }
  return stats;
}

type StatRow = { key: MetricKey; stat: Stat; trend?: Trend };

const STAT_COLUMNS: Column<StatRow>[] = [
  {
    header: "Métrica",
    unit: "",
    width: 122,
    align: "left",
    value: ({ key }) => METRIC_BY_KEY[key].label,
  },
  {
    header: "Promedio",
    unit: "",
    width: 66,
    align: "right",
    value: ({ key, stat }) => formatValue(key, stat.avg),
  },
  {
    header: "Mínimo",
    unit: "",
    width: 62,
    align: "right",
    value: ({ key, stat }) => formatValue(key, stat.min),
  },
  {
    header: "Máximo",
    unit: "",
    width: 62,
    align: "right",
    value: ({ key, stat }) => formatValue(key, stat.max),
  },
  {
    header: "Cambio",
    // Las flechas no entran en WinAnsi: el signo dice lo mismo.
    unit: "vs. anterior",
    width: 72,
    align: "right",
    value: ({ key, trend }) => {
      if (!trend) return "-";
      if (trend.direction === "flat") return "=";
      const amount = formatValue(key, Math.abs(trend.delta));
      return `${trend.delta > 0 ? "+" : "-"}${amount}`;
    },
  },
  {
    header: "Tomas",
    unit: "",
    width: 48,
    align: "right",
    value: ({ stat }) => String(stat.count),
  },
  {
    header: "Referencia",
    unit: "",
    width: 83,
    align: "right",
    value: ({ key }) => {
      const normal = METRIC_BY_KEY[key].normal;
      if (!normal) return "-";
      return `${normal[0]} a ${normal[1]} ${METRIC_BY_KEY[key].unit}`;
    },
  },
];

const DAY_COLUMNS: Column<DaySummary>[] = [
  {
    header: "Día",
    unit: "",
    width: 84,
    align: "left",
    value: (day) => formatDayNumeric(day.day),
  },
  {
    header: "Presión",
    unit: "mmHg",
    width: 78,
    align: "right",
    value: (day) =>
      day.systolic === null && day.diastolic === null
        ? "-"
        : `${formatValue("systolic", day.systolic)}/${formatValue(
            "diastolic",
            day.diastolic,
          )}`,
  },
  {
    header: "Pulso",
    unit: "lpm",
    width: 58,
    align: "right",
    value: (day) => formatValue("pulse", day.pulse),
  },
  {
    header: "Oxígeno",
    unit: "%",
    width: 58,
    align: "right",
    value: (day) => formatValue("spo2", day.spo2),
  },
  {
    header: "Glucosa",
    unit: "mg/dL",
    width: 68,
    align: "right",
    value: (day) => formatValue("glucose", day.glucose),
  },
  {
    header: "Peso",
    unit: "kg",
    width: 60,
    align: "right",
    value: (day) => formatValue("weight", day.weight),
  },
  {
    header: "Temp.",
    unit: "°C",
    width: 58,
    align: "right",
    value: (day) => formatValue("temperature", day.temperature),
  },
  {
    header: "Tomas",
    unit: "",
    width: 51,
    align: "right",
    value: (day) => String(day.total),
  },
];

export type ReportInput = {
  summaries: DaySummary[];
  measurements: Measurement[];
  fromDay: string;
  toDay: string;
  rangeLabel: string;
  /** Cambio de cada métrica contra el período anterior. */
  trends: Trend[];
  /** El período con el que se compara, ya escrito ("21/07 al 19/08"). */
  previousLabel: string;
  generatedAt: Date;
};

export async function buildReportPdf(input: ReportInput): Promise<Uint8Array> {
  const {
    summaries,
    measurements,
    fromDay,
    toDay,
    rangeLabel,
    trends,
    previousLabel,
    generatedAt,
  } = input;
  const period = `${formatDayNumeric(fromDay)} al ${formatDayNumeric(toDay)}`;

  const doc = await PDFDocument.create();
  doc.setTitle(`Registro de Salud — ${period}`);
  doc.setSubject(`Controles del ${period}`);
  doc.setCreator("Registro de Salud");
  doc.setProducer("Registro de Salud");
  doc.setCreationDate(generatedAt);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const canvas = createCanvas(doc, font, bold);

  /* ----------------------------- encabezado ----------------------------- */

  canvas.draw("Registro de Salud", MARGIN, 20, { font: bold });
  canvas.move(18);
  canvas.draw(`Controles del ${period} · ${rangeLabel}`, MARGIN, 10, {
    color: MUTED,
  });
  canvas.move(24);

  /* ------------------------ resumen del periodo ------------------------- */

  canvas.heading("Resumen del período");

  const stats = statsFor(measurements);
  const statRows: StatRow[] = METRICS.filter(
    (metric) => stats[metric.key],
  ).map((metric) => ({
    key: metric.key,
    stat: stats[metric.key] as Stat,
    trend: trends.find((trend) => trend.key === metric.key),
  }));

  if (statRows.length === 0) {
    canvas.draw("No hay mediciones cargadas en este período.", MARGIN, 10, {
      color: MUTED,
    });
    canvas.move(16);
  } else {
    canvas.tableHead(STAT_COLUMNS);
    statRows.forEach((row, index) => canvas.tableRow(STAT_COLUMNS, row, index));
    canvas.move(4);
    canvas.draw(
      `"Cambio" es la diferencia del promedio contra el período anterior (${previousLabel}).`,
      MARGIN,
      8,
      { color: MUTED },
    );
    canvas.move(12);
  }

  /* --------------------------- detalle por dia -------------------------- */

  const daysWithMeasurements = summaries.filter((day) => day.total > 0);

  if (daysWithMeasurements.length > 0) {
    canvas.move(10);
    canvas.heading("Detalle por día");
    canvas.draw(
      "Cuando hay más de una toma en el día, el valor es el promedio.",
      MARGIN,
      8.5,
      { color: MUTED },
    );
    canvas.move(18);
    canvas.tableHead(DAY_COLUMNS);
    // Del dia mas viejo al mas nuevo: asi se lee como una evolucion.
    [...daysWithMeasurements]
      .reverse()
      .forEach((day, index) => canvas.tableRow(DAY_COLUMNS, day, index));
  }

  /* ------------------------------- notas -------------------------------- */

  const withNotes = [...summaries].reverse().filter((day) => day.note);

  if (withNotes.length > 0) {
    canvas.move(10);
    canvas.heading("Notas del día");
    for (const day of withNotes) {
      const lines = canvas.wrap(day.note ?? "", 9, CONTENT - 12);
      canvas.ensure(18 + lines.length * 12);
      canvas.draw(formatDayLong(day.day), MARGIN, 9, { font: bold });
      canvas.move(13);
      for (const line of lines) {
        canvas.draw(line, MARGIN + 12, 9, { color: MUTED });
        canvas.move(12);
      }
      canvas.move(6);
    }
  }

  /* -------------------------- pie de cada pagina ------------------------ */

  const pages = canvas.pages;
  const footer =
    "Horario de Mendoza · Los rangos de referencia son orientativos, no reemplazan al médico.";

  pages.forEach((page, index) => {
    page.drawLine({
      start: { x: MARGIN, y: MARGIN + 26 },
      end: { x: MARGIN + CONTENT, y: MARGIN + 26 },
      thickness: 0.5,
      color: LINE,
    });
    page.drawText(toWinAnsi(footer), {
      x: MARGIN,
      y: MARGIN + 14,
      size: 7.5,
      font,
      color: MUTED,
    });
    const label = `Página ${index + 1} de ${pages.length}`;
    page.drawText(toWinAnsi(label), {
      x: MARGIN + CONTENT - font.widthOfTextAtSize(label, 7.5),
      y: MARGIN + 14,
      size: 7.5,
      font,
      color: MUTED,
    });
  });

  return doc.save();
}

/** Nombre del archivo que ve la persona al descargar o compartir. */
export function reportFileName(fromDay: string, toDay: string): string {
  return `registro-salud-${fromDay}-al-${toDay}.pdf`;
}
