import type { ChartSeries } from "@/components/MetricChart";
import { METRIC_BY_KEY } from "@/lib/metrics";

/** Como se agrupan las metricas en los graficos. Lo comparten /metricas y /demo. */
export type ChartGroup = {
  id: string;
  title: string;
  unit: string;
  decimals: number;
  /** Clase que define var(--series) y var(--series-2) en globals.css. */
  className: string;
  series: ChartSeries[];
  normal?: [number, number];
};

export const CHART_GROUPS: ChartGroup[] = [
  {
    id: "pressure",
    title: "Presión arterial",
    unit: "mmHg",
    decimals: 0,
    className: "series-pressure",
    series: [
      { key: "systolic", label: "Máxima", colorVar: "--series" },
      { key: "diastolic", label: "Mínima", colorVar: "--series-2" },
    ],
  },
  {
    id: "pulse",
    title: "Pulsaciones",
    unit: "lpm",
    decimals: 0,
    className: "series-pulse",
    normal: METRIC_BY_KEY.pulse.normal,
    series: [{ key: "pulse", label: "Pulso", colorVar: "--series" }],
  },
  {
    id: "spo2",
    title: "Oxígeno en sangre",
    unit: "%",
    decimals: 0,
    className: "series-spo2",
    normal: METRIC_BY_KEY.spo2.normal,
    series: [{ key: "spo2", label: "Oxígeno", colorVar: "--series" }],
  },
  {
    id: "glucose",
    title: "Glucosa",
    unit: "mg/dL",
    decimals: 0,
    className: "series-glucose",
    normal: METRIC_BY_KEY.glucose.normal,
    series: [{ key: "glucose", label: "Glucosa", colorVar: "--series" }],
  },
  {
    id: "weight",
    title: "Peso",
    unit: "kg",
    decimals: 1,
    className: "series-weight",
    series: [{ key: "weight", label: "Peso", colorVar: "--series" }],
  },
  {
    id: "temperature",
    title: "Temperatura",
    unit: "°C",
    decimals: 1,
    className: "series-temperature",
    normal: METRIC_BY_KEY.temperature.normal,
    series: [{ key: "temperature", label: "Temperatura", colorVar: "--series" }],
  },
];

