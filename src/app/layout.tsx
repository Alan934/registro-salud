import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const nunito = Nunito_Sans({
  variable: "--font-sans-app",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Registro de Salud",
  description: "Registro diario de peso, presión, glucosa, oxígeno y pulso.",
  applicationName: "Registro de Salud",
  // iOS no lee el manifest: la instalación en la pantalla de inicio se
  // configura con estas etiquetas.
  appleWebApp: {
    capable: true,
    title: "Registro",
    statusBarStyle: "default",
  },
  // Es una app privada: que no la indexe nadie.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#14150f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${nunito.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
