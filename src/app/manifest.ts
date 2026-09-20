import type { MetadataRoute } from "next";

/**
 * Lo que necesita el teléfono para instalar la app en la pantalla de inicio.
 * `display: standalone` la abre sin barra de direcciones, como una app nativa.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Registro de Salud",
    short_name: "Registro",
    description:
      "Registro diario de peso, presión, glucosa, oxígeno, pulso y temperatura.",
    lang: "es-AR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Pantalla de arranque y barra de estado: el mismo fondo que la app en
    // modo claro. El `<meta name="theme-color">` del layout se encarga del
    // modo oscuro, que acá no se puede expresar.
    background_color: "#f6f5f2",
    theme_color: "#f6f5f2",
    categories: ["health", "medical", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Android recorta el icono a su forma: este tiene el margen necesario.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Atajos al mantener apretado el icono en la pantalla de inicio.
    shortcuts: [
      {
        name: "Cargar una toma",
        short_name: "Cargar",
        url: "/",
      },
      {
        name: "Ver métricas",
        short_name: "Métricas",
        url: "/metricas",
      },
    ],
  };
}
