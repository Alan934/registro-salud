/*
  Service worker de la app instalada.

  Deliberadamente NO cachea páginas ni respuestas de la API: son datos de
  salud y mostrar un valor viejo sería peor que no mostrar nada. Sólo guarda
  los archivos estáticos de Next (que llevan hash en el nombre, así que nunca
  quedan desactualizados) y una página de aviso para cuando no hay señal.
*/

const VERSION = "v1";
const STATIC_CACHE = `registro-estaticos-${VERSION}`;
const OFFLINE_URL = "/sin-conexion";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // El informe en PDF y cualquier dato: siempre de la red, nunca guardados.
  if (url.pathname.startsWith("/api/")) return;

  // Archivos con hash en el nombre: no cambian, se pueden servir del caché.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Al navegar sin señal, el aviso en vez del error del navegador.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await caches.match(OFFLINE_URL);
        return fallback ?? Response.error();
      }),
    );
  }
});
