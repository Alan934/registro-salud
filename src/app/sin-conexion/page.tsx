import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Sin conexión · Registro de Salud",
  robots: { index: false, follow: false },
};

/**
 * Lo que muestra el service worker cuando no hay señal. Tiene que ser una
 * página estática: se guarda en el caché del teléfono al instalar la app.
 */
export default function OfflinePage() {
  return (
    <main className="flex flex-1 items-center justify-center p-5">
      <div className="w-full max-w-sm text-center">
        <Logo className="mx-auto mb-3 h-12 w-12" />
        <h1 className="text-2xl font-semibold">Sin conexión</h1>
        <p className="mt-2 text-sm text-muted">
          No hay internet en este momento. Los controles se guardan en el
          servidor, así que hace falta señal para verlos o cargar una toma.
        </p>

        <div className="card mt-5 p-5 text-left">
          <p className="text-sm text-muted">
            Cuando vuelva la conexión, tocá el botón y seguí donde estabas.
          </p>
          <Link href="/" className="btn-primary mt-3 w-full">
            Reintentar
          </Link>
        </div>
      </div>
    </main>
  );
}
