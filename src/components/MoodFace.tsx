import { moodLevel } from "@/lib/mood";

/**
 * La carita del puntaje. La boca se curva con el valor: de 0 (para abajo) a
 * 10 (para arriba). Es decorativa, el texto al lado dice lo mismo.
 */
export function MoodFace({
  value,
  className = "h-8 w-8",
}: {
  value: number;
  className?: string;
}) {
  const level = moodLevel(value);
  // El punto de control va al doble de lo que se ve: la curva pasa por la mitad.
  const curve = ((value - 5) / 5) * 6.4;

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke={level.color}
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="9.2" fill={level.soft} />
      <circle cx="9" cy="10" r="1.05" fill={level.color} stroke="none" />
      <circle cx="15" cy="10" r="1.05" fill={level.color} stroke="none" />
      <path d={`M8.3 15 Q12 ${(15 + curve).toFixed(2)} 15.7 15`} />
    </svg>
  );
}
