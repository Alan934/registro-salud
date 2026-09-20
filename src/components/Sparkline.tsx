/**
 * Linea minima de tendencia, sin ejes ni numeros: sirve para ver la forma
 * (subiendo, bajando, parejo) al lado del valor. El detalle esta en Metricas.
 */
export function Sparkline({
  values,
  className = "h-6 w-full",
  strokeWidth = 2,
}: {
  values: Array<number | null>;
  className?: string;
  strokeWidth?: number;
}) {
  const points = values
    .map((value, index) => ({ value, index }))
    .filter((point): point is { value: number; index: number } =>
      typeof point.value === "number",
    );

  // Con un solo punto no hay linea que dibujar.
  if (points.length < 2) return null;

  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const span = max - min || 1;
  const lastIndex = values.length - 1 || 1;

  const path = points
    .map((point, order) => {
      const x = (point.index / lastIndex) * 100;
      // El SVG crece hacia abajo: se invierte para que mas valor quede arriba.
      const y = 28 - ((point.value - min) / span) * 24 - 2;
      return `${order === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const last = points[points.length - 1];

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d={path}
        fill="none"
        stroke="var(--series, currentColor)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={(last.index / lastIndex) * 100}
        cy={28 - ((last.value - min) / span) * 24 - 2}
        r="2.4"
        fill="var(--series, currentColor)"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
