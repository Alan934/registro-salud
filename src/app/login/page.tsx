import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar · Registro de Salud" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const raw = params.next;
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  const next =
    candidate && candidate.startsWith("/") && !candidate.startsWith("//")
      ? candidate
      : "/";

  return (
    <main className="flex flex-1 items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Logo className="mx-auto mb-3 h-12 w-12" />
          <h1 className="text-2xl font-semibold">Registro de Salud</h1>
          <p className="mt-1 text-sm text-muted">
            Seguimiento diario de los controles.
          </p>
        </div>

        <div className="card p-5 shadow-sm">
          <LoginForm next={next} />
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          <Link href="/demo" className="text-accent hover:underline">
            Ver un ejemplo sin entrar
          </Link>{" "}
          — datos ficticios, solo para mirar.
        </p>
      </div>
    </main>
  );
}
