"use client";

import { useRef, useState, useSyncExternalStore } from "react";

/**
 * Descargar el informe o mandarlo por WhatsApp, mail, etc.
 *
 * Compartir usa la Web Share API, que es la que abre el menú del sistema con
 * las apps instaladas. No existe en todos los navegadores (en la compu suele
 * faltar), así que el botón aparece sólo si el navegador puede compartir
 * archivos; descargar anda siempre.
 */

let shareSupport: boolean | null = null;

/** Si el navegador puede compartir un PDF. Se calcula una sola vez. */
function detectShareSupport(): boolean {
  if (shareSupport !== null) return shareSupport;
  try {
    const probe = new File([new Blob(["."])], "p.pdf", {
      type: "application/pdf",
    });
    shareSupport =
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [probe] });
  } catch {
    shareSupport = false;
  }
  return shareSupport;
}

/** No cambia durante la vida de la página: no hay a qué suscribirse. */
const subscribe = () => () => {};

export function ExportButtons({
  days,
  fileName,
}: {
  days: number;
  fileName: string;
}) {
  const url = `/api/metricas/pdf?dias=${days}`;
  // En el servidor no existe navigator: ahí vale false y se ajusta al hidratar.
  const canShare = useSyncExternalStore(subscribe, detectShareSupport, () => false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ url: string; message: string } | null>(
    null,
  );
  /** El PDF se empieza a pedir al apretar, antes del click (ver abajo). */
  const pending = useRef<{ url: string; promise: Promise<Blob> } | null>(null);

  // El PDF depende del período: un error o una precarga de otro ya no sirven.
  const message = error?.url === url ? error.message : null;

  async function fetchPdf(): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    // Si venció la sesión, el proxy redirige al login y esto llega en HTML.
    if (blob.type !== "application/pdf") throw new Error("sesión vencida");
    return blob;
  }

  /**
   * Safari sólo deja abrir el menú de compartir mientras dura el gesto del
   * usuario, y esperar al fetch lo consume. Por eso se empieza a pedir el PDF
   * al apretar el botón: para cuando llega el click suele estar listo.
   */
  function warmUp() {
    if (pending.current?.url === url) return;
    const promise = fetchPdf().catch((err) => {
      pending.current = null; // que el próximo intento vuelva a pedirlo
      throw err;
    });
    pending.current = { url, promise };
  }

  async function share() {
    setBusy(true);
    setError(null);
    try {
      warmUp();
      const blob = await pending.current!.promise;
      const file = new File([blob], fileName, { type: "application/pdf" });
      await navigator.share({
        files: [file],
        title: "Registro de Salud",
        text: `Registro de controles — últimos ${days} días.`,
      });
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      // Cancelar el menú de compartir no es un error que haya que mostrar.
      if (name !== "AbortError") {
        setError({
          url,
          message:
            name === "NotAllowedError"
              ? "El navegador no dejó abrir el menú. Probá de nuevo o descargalo."
              : "No se pudo compartir. Probá descargar el PDF.",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canShare ? (
        <button
          type="button"
          onPointerDown={warmUp}
          onClick={share}
          disabled={busy}
          className="btn-ghost text-sm"
        >
          <ShareIcon />
          {busy ? "Preparando..." : "Compartir"}
        </button>
      ) : null}

      <a href={url} download={fileName} className="btn-ghost text-sm">
        <DownloadIcon />
        Descargar PDF
      </a>

      {message ? (
        <p role="alert" className="w-full text-sm text-danger">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4m0 0L8 8m4-4 4 4" />
      <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
    </svg>
  );
}
