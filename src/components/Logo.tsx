/**
 * Marca de la app: un trazo de pulso dentro de una placa redondeada.
 * Usa los tokens de color, asi funciona igual en claro y en oscuro.
 */
export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="9"
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <path
        d="M6 18h3.6l2.2-6.6 3.4 11 2.8-8 1.8 3.6H26"
        stroke="var(--accent)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
