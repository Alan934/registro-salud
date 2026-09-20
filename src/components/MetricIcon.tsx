import type { MetricKey } from "@/lib/metrics";

/**
 * Un icono por metrica, para reconocer la tarjeta de un vistazo sin leer.
 * Son trazos con currentColor: el color lo pone quien lo usa.
 */

const PATHS: Record<MetricKey, React.ReactNode> = {
  systolic: (
    <path d="M12 20.5s-7.2-4.6-9-8.4A4.9 4.9 0 0 1 12 7.2a4.9 4.9 0 0 1 9 4.9c-1.8 3.8-9 8.4-9 8.4Z" />
  ),
  diastolic: (
    <path d="M12 20.5s-7.2-4.6-9-8.4A4.9 4.9 0 0 1 12 7.2a4.9 4.9 0 0 1 9 4.9c-1.8 3.8-9 8.4-9 8.4Z" />
  ),
  pulse: <path d="M3 12h3.6l2.2-6 3.4 12 2.6-8 1.6 2h4.6" />,
  spo2: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M7 13.2c1.3-1.4 2.6-1.4 3.9 0 1.3 1.4 2.6 1.4 3.9 0" />
    </>
  ),
  glucose: (
    <path d="M12 3.2s5.8 5.8 5.8 9.4a5.8 5.8 0 1 1-11.6 0C6.2 9 12 3.2 12 3.2Z" />
  ),
  weight: (
    <>
      <rect x="3.2" y="4.8" width="17.6" height="14.4" rx="3.4" />
      <path d="M8.4 14.4a3.6 3.6 0 0 1 7.2 0M12 14.4l2.2-3.6" />
    </>
  ),
  temperature: (
    <>
      <path d="M14 14.6V5.4a2 2 0 1 0-4 0v9.2a4 4 0 1 0 4 0Z" />
      <path d="M12 9.5v5.6" />
    </>
  ),
};

export function MetricIcon({
  metricKey,
  className = "h-4 w-4",
}: {
  metricKey: MetricKey;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[metricKey]}
    </svg>
  );
}
