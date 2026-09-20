"use client";

import { useEffect } from "react";

/**
 * Registra el service worker que hace instalable la app.
 *
 * Sólo en producción: en desarrollo se pelea con la recarga en caliente de
 * Next y termina sirviendo archivos viejos.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // Después de `load` para no competir con la carga de la página.
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Que falle el registro no puede romper la app: se sigue sin él.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
