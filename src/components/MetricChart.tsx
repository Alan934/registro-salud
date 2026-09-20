"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartSeries = {
  /** Clave dentro de cada punto. */
  key: string;
  label: string;
  /** Variable CSS con el color, definida en globals.css. */
  colorVar: "--series" | "--series-2";
};

export type ChartPoint = {
  label: string;
  caption?: string;
} & Record<string, string | number | null | undefined>;

export function MetricChart({
  series,
  points,
  unit,
  normal,
  decimals,
}: {
  series: ChartSeries[];
  points: ChartPoint[];
  unit: string;
  /** Rango de referencia, se pinta de fondo cuando hay una sola serie. */
  normal?: [number, number];
  decimals: number;
}) {
  const values = points.flatMap((point) =>
    series
      .map((serie) => point[serie.key])
      .filter((value): value is number => typeof value === "number"),
  );

  if (values.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        Sin datos en este período.
      </p>
    );
  }

  const min = Math.min(...values, ...(normal ? [normal[0]] : []));
  const max = Math.max(...values, ...(normal ? [normal[1]] : []));
  const pad = Math.max((max - min) * 0.12, decimals > 0 ? 0.3 : 2);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 8, right: 10, bottom: 0, left: -8 }}
        >
          <CartesianGrid stroke="var(--line)" vertical={false} />

          {normal && series.length === 1 ? (
            <ReferenceArea
              y1={normal[0]}
              y2={normal[1]}
              fill="var(--ok)"
              fillOpacity={0.08}
              stroke="none"
            />
          ) : null}

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "var(--line)" }}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            minTickGap={24}
            /* En la vista "cada toma" la etiqueta es "19/9 08:15": en el eje
               alcanza con la fecha y la hora queda para el tooltip. */
            tickFormatter={(value: string) => String(value).split(" ")[0]}
          />
          <YAxis
            domain={[
              Math.floor((min - pad) * 10) / 10,
              Math.ceil((max + pad) * 10) / 10,
            ]}
            width={44}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickFormatter={(value: number) => value.toFixed(decimals)}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }}
            content={
              <ChartTooltip
                series={series}
                unit={unit}
                decimals={decimals}
                points={points}
              />
            }
          />

          {series.map((serie) => (
            <Line
              key={serie.key}
              type="monotone"
              dataKey={serie.key}
              name={serie.label}
              stroke={`var(${serie.colorVar})`}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: `var(${serie.colorVar})` }}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: "var(--surface)",
                fill: `var(${serie.colorVar})`,
              }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type TooltipProps = {
  active?: boolean;
  label?: string | number;
  series: ChartSeries[];
  unit: string;
  decimals: number;
  points: ChartPoint[];
  payload?: Array<{ dataKey?: string | number; value?: number | string }>;
};

function ChartTooltip({
  active,
  label,
  payload,
  series,
  unit,
  decimals,
  points,
}: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = points.find((item) => item.label === label);

  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-medium">
        {label}
        {point?.caption ? (
          <span className="ml-1 font-normal text-muted">{point.caption}</span>
        ) : null}
      </p>
      {payload.map((entry) => {
        const serie = series.find((item) => item.key === entry.dataKey);
        if (!serie || typeof entry.value !== "number") return null;
        return (
          <p key={serie.key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: `var(${serie.colorVar})` }}
            />
            <span className="text-muted">{serie.label}</span>
            <strong className="tabular-nums">
              {entry.value.toFixed(decimals)}
            </strong>
            <span className="text-muted">{unit}</span>
          </p>
        );
      })}
    </div>
  );
}
