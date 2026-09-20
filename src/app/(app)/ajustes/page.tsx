import Link from "next/link";
import { HeightForm } from "@/components/HeightForm";
import { RangeBar } from "@/components/RangeBar";
import { BMI_SCALE, bmiFor } from "@/lib/bmi";
import { getLatestValues } from "@/lib/queries";
import { getHeightCm } from "@/lib/settings";
import { TONE_PILL, zoneIn } from "@/lib/zones";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [heightCm, latest] = await Promise.all([
    getHeightCm(),
    getLatestValues(),
  ]);

  const weight = latest.weight ?? null;
  const bmi = bmiFor(weight?.value ?? null, heightCm);
  const zone = bmi === null ? null : zoneIn(BMI_SCALE, bmi);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ajustes</h1>
        <p className="mt-1 text-sm text-muted">
          Datos que no cambian todos los días y que la app usa para sacar
          cuentas.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold">Altura</h2>
        <p className="mb-4 text-sm text-muted">
          Con la altura y el último peso la app calcula el{" "}
          <strong className="font-medium text-fg">
            índice de masa corporal (IMC)
          </strong>
          , y lo muestra en la tarjeta de Peso y en el informe.
        </p>
        <HeightForm heightCm={heightCm} />
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold">IMC de hoy</h2>

        {heightCm === null ? (
          <p className="text-sm text-muted">
            Cargá la altura acá arriba y el IMC aparece solo.
          </p>
        ) : bmi === null ? (
          <p className="text-sm text-muted">
            Falta el peso: cargá una toma con el peso en{" "}
            <Link href="/" className="text-accent hover:underline">
              Hoy
            </Link>{" "}
            y el IMC se calcula solo.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="flex flex-wrap items-baseline gap-2">
              <strong className="text-3xl leading-none font-bold tabular-nums">
                {bmi.toFixed(1)}
              </strong>
              <span className="text-sm text-muted">kg/m²</span>
              {zone ? (
                <span className={`pill ${TONE_PILL[zone.tone]}`}>
                  {zone.label}
                </span>
              ) : null}
            </p>

            <p className="text-xs text-muted tabular-nums">
              {weight?.value} kg ({weight?.day}) · {heightCm} cm
            </p>

            <RangeBar scale={BMI_SCALE} value={bmi} unit="kg/m²" decimals={1} />

            <p className="text-xs text-muted">
              Los cortes son los de la OMS para personas adultas. Es una
              referencia gruesa: no distingue músculo de grasa ni tiene en
              cuenta la edad. Orienta, no diagnostica.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
