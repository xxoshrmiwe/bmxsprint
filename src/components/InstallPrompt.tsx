import { useEffect, useRef, useState } from 'react';
import { useInstallPwa } from '../context/InstallPwaContext';

// Icono oficial de Compartir en iOS (SVG inline)
function IconoCompartirIos({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export default function InstallPrompt() {
  const { puedenInstalar, esIos, instalarNativo, descartarPrompt } = useInstallPwa();
  const [modalIosAbierto, setModalIosAbierto] = useState(false);

  const botonAbrirRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Manejo de tecla Escape y Trap de foco para accesibilidad del Modal
  useEffect(() => {
    if (!modalIosAbierto) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        cerrarModalIos();
      } else if (e.key === 'Tab' && modalRef.current) {
        const elementosEnfocables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (elementosEnfocables.length === 0) return;

        const primero = elementosEnfocables[0];
        const ultimo = elementosEnfocables[elementosEnfocables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === primero) {
            ultimo.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === ultimo) {
            primero.focus();
            e.preventDefault();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalIosAbierto]);

  function abrirModalIos() {
    setModalIosAbierto(true);
  }

  function cerrarModalIos() {
    setModalIosAbierto(false);
    // Devolver el foco al botón que abrió el modal
    setTimeout(() => {
      botonAbrirRef.current?.focus();
    }, 50);
  }

  if (!puedenInstalar) {
    return null;
  }

  return (
    <>
      {/* BANNER REUTILIZABLE DE INSTALACIÓN PWA */}
      <div className="card my-3 space-y-3 border-accent/40 bg-accent/10 p-4 shadow-md transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white shadow-sm">
              📱
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                Instalar GATERIGHT BMX
              </h3>
              <p className="text-xs text-muted-foreground">
                Para una mejor experiencia, agrega esta página a tu inicio.
              </p>
            </div>
          </div>

          <button
            onClick={descartarPrompt}
            title="Descartar por 14 días"
            className="cursor-pointer rounded-lg p-1 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2">
          {esIos ? (
            <button
              ref={botonAbrirRef}
              onClick={abrirModalIos}
              className="btn-primary w-full py-2.5 text-xs font-bold shadow-sm"
            >
              Ver cómo agregar a inicio 📲
            </button>
          ) : (
            <button
              onClick={instalarNativo}
              className="btn-primary w-full py-2.5 text-xs font-bold shadow-sm"
            >
              Agregar al inicio
            </button>
          )}

          <button
            onClick={descartarPrompt}
            className="btn-ghost px-3 text-xs font-medium text-muted-foreground"
          >
            Ahora no
          </button>
        </div>
      </div>

      {/* MODAL ACCESIBLE CON INSTRUCCIONES DE iOS / SAFARI */}
      {modalIosAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs transition-opacity"
          onClick={cerrarModalIos}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-ios-title"
            className="card w-full max-w-sm space-y-4 bg-white p-6 shadow-2xl transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 id="pwa-ios-title" className="font-heading text-lg font-bold text-foreground">
                Agregar a Inicio en iOS 📲
              </h3>
              <button
                onClick={cerrarModalIos}
                className="cursor-pointer rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-muted-foreground">
              <p>Sigue estos sencillos pasos en Safari para instalar la app en tu iPhone/iPad:</p>

              <ol className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading font-bold text-primary">
                    1
                  </span>
                  <span>
                    Toca el botón <strong>Compartir</strong>{' '}
                    <IconoCompartirIos className="inline-block h-4 w-4 align-text-bottom text-primary" /> en la
                    barra inferior de Safari.
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading font-bold text-primary">
                    2
                  </span>
                  <span>
                    Desplázate hacia abajo y selecciona <strong>"Añadir a la pantalla de inicio"</strong> 📲.
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading font-bold text-primary">
                    3
                  </span>
                  <span>
                    Toca <strong>Añadir</strong> en la esquina superior derecha. ¡Listo!
                  </span>
                </li>
              </ol>
            </div>

            <button onClick={cerrarModalIos} className="btn-primary w-full py-2.5 text-xs font-bold">
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
