import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { buildDemoData } from "@/lib/demo-data";
import {
  formatDayLong,
  formatNowText,
  toDateTimeLocal,
  todayKey,
} from "@/lib/tz";
import { DemoBoard } from "./DemoBoard";

export const metadata: Metadata = {
  title: "Ejemplo · Registro de Salud",
  description:
    "Demostración con datos ficticios: se puede mirar y probar, no se guarda nada.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function DemoPage() {
  const today = todayKey();
  const now = new Date();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-page/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <span className="flex items-center gap-2 font-semibold">
            <Logo className="h-7 w-7 shrink-0" />
            <span className="hidden sm:inline">Registro de Salud</span>
            <span className="sm:hidden">Registro</span>
          </span>
          <span className="rounded-lg bg-accent-soft px-2 py-1 text-xs font-medium text-accent">
            Ejemplo
          </span>

          <Link
            href="/login"
            className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-muted
                       transition hover:bg-surface-soft hover:text-fg"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <DemoBoard
          today={today}
          todayLong={formatDayLong(today)}
          nowValue={toDateTimeLocal(now)}
          nowText={formatNowText(now)}
          initial={buildDemoData(today)}
        />
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-muted">
        Datos ficticios · Horario de Mendoza, Argentina · Los rangos de
        referencia son orientativos, no reemplazan al médico.
      </footer>
    </div>
  );
}
