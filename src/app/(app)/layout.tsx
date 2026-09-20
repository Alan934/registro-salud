import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { logoutAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-page/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-8 w-8 shrink-0" />
            <span className="hidden sm:inline">Registro de Salud</span>
            <span className="sm:hidden">Registro</span>
          </Link>

          <nav className="ml-auto flex items-center gap-1">
            {/* En telefono estas dos pantallas estan en la barra de abajo. */}
            <span className="hidden items-center gap-1 sm:flex">
              <NavLink href="/">Hoy</NavLink>
              <NavLink href="/metricas">Métricas</NavLink>
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted
                           transition hover:bg-surface-soft hover:text-fg"
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="px-4 pb-28 text-center text-xs text-muted sm:pb-6">
        Horario de Mendoza, Argentina · Los rangos de referencia son
        orientativos, no reemplazan al médico.
      </footer>

      <BottomNav />
    </div>
  );
}
