"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MetricIcon } from "@/components/MetricIcon";

/**
 * Barra de abajo, solo en telefono: las dos pantallas y el boton de cargar,
 * siempre al alcance del pulgar. En pantalla grande la navegacion vive en el
 * encabezado y esta barra no se muestra.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line
                 bg-page/95 backdrop-blur sm:hidden"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-1.5">
        <Tab href="/" label="Hoy" active={pathname === "/"}>
          <HomeIcon />
        </Tab>

        <Link
          href="/#cargar"
          className="flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium text-accent"
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full
                       bg-accent text-accent-fg shadow-sm"
          >
            <PlusIcon />
          </span>
          Cargar
        </Link>

        <Tab
          href="/metricas"
          label="Métricas"
          active={pathname.startsWith("/metricas")}
        >
          <MetricIcon metricKey="pulse" className="h-6 w-6" />
        </Tab>
      </div>
    </nav>
  );
}

function Tab({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-1.5
                  text-xs font-medium transition ${
                    active ? "text-accent" : "text-muted"
                  }`}
    >
      {children}
      {label}
    </Link>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.5Z" />
      <path d="M9.5 20.5v-6h5v6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
