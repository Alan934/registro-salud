import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteMeasurementForm } from "@/components/DeleteMeasurementForm";
import { MeasurementForm } from "@/components/MeasurementForm";
import { getMeasurement } from "@/lib/queries";
import { dayLabel, formatNowText, toDateTimeLocal } from "@/lib/tz";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditMeasurementPage({
  params,
  searchParams,
}: PageProps<"/toma/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const measurement = await getMeasurement(numericId);
  if (!measurement) notFound();

  const raw = first(query.volver);
  const backTo = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  return (
    <div className="space-y-5">
      <Link href={backTo} className="text-sm text-accent hover:underline">
        ← Volver
      </Link>

      <div>
        <p className="text-sm text-muted">
          {dayLabel(measurement.day)} · {measurement.time}
        </p>
        <h1 className="text-2xl font-semibold">Editar toma</h1>
      </div>

      <section className="card p-5">
        <MeasurementForm
          mode="edit"
          nowValue={toDateTimeLocal(new Date())}
          nowText={formatNowText(new Date())}
          values={{
            id: measurement.id,
            weight: measurement.weight,
            systolic: measurement.systolic,
            diastolic: measurement.diastolic,
            glucose: measurement.glucose,
            spo2: measurement.spo2,
            pulse: measurement.pulse,
            temperature: measurement.temperature,
            note: measurement.note,
            measuredAt: `${measurement.day}T${measurement.time}`,
          }}
        />
      </section>

      <DeleteMeasurementForm id={measurement.id} redirectTo={backTo} />
    </div>
  );
}
