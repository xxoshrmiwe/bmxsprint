import { useState } from 'react';
import { IconoBombilla, IconoX, IconoCheck } from './Icono';

type Estado = 'cerrado' | 'abierto' | 'enviando' | 'enviado';

export default function IdeaFlotante() {
  const [estado, setEstado] = useState<Estado>('cerrado');
  const [mensaje, setMensaje] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [error, setError] = useState<string | null>(null);

  function abrir() {
    setEstado('abierto');
    setError(null);
  }

  function cerrar() {
    setEstado('cerrado');
    setMensaje('');
    setSitioWeb('');
    setError(null);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!mensaje.trim()) return;
    setEstado('enviando');
    setError(null);
    try {
      const respuesta = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, sitioWeb })
      });
      let datos: { error?: string } = {};
      try {
        datos = await respuesta.json();
      } catch {
        // La respuesta no era JSON (ej. el servidor no tiene /api/feedback,
        // como en `astro dev` local sin Vercel) — se usa el mensaje genérico.
      }
      if (!respuesta.ok) throw new Error(datos.error ?? 'No se pudo enviar la idea.');
      setEstado('enviado');
      setMensaje('');
      setTimeout(cerrar, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la idea.');
      setEstado('abierto');
    }
  }

  return (
    <>
      <button
        onClick={abrir}
        aria-label="Dejar una idea"
        className="idea-bombilla fixed z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-warning-foreground transition-transform duration-200 hover:scale-110 active:scale-95"
        style={{
          right: 'max(1.25rem, env(safe-area-inset-right))',
          bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
          background: 'radial-gradient(circle at 35% 30%, #fffbe6, var(--color-yellow) 70%)',
          boxShadow: '0 4px 20px rgba(255, 234, 0, 0.55), 0 2px 6px rgba(0, 31, 63, 0.25)'
        }}
      >
        <IconoBombilla className="h-7 w-7" />
      </button>

      {estado !== 'cerrado' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4"
          onClick={cerrar}
        >
          <div
            className="card w-full max-w-sm space-y-4 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-heading text-xl font-semibold text-foreground">¿Tenés una idea?</h2>
              <button onClick={cerrar} aria-label="Cerrar" className="btn-ghost -mr-2 -mt-1 px-2">
                <IconoX className="h-4 w-4" />
              </button>
            </div>

            {estado === 'enviado' ? (
              <div className="flex items-center gap-2 py-2 text-sm font-medium text-primary">
                <IconoCheck className="h-5 w-5 text-accent" />
                ¡Gracias! Ya nos llegó tu idea.
              </div>
            ) : (
              <form onSubmit={enviar} className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Contanos qué te gustaría ver en GATERIGHT BMX. Nos llega directo por correo.
                </p>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Ej. Me gustaría poder comparar tiempos entre hermanos..."
                  rows={4}
                  maxLength={2000}
                  autoFocus
                  required
                  className="input resize-none"
                />
                {/* Campo trampa para bots: invisible para una persona */}
                <input
                  type="text"
                  name="sitioWeb"
                  value={sitioWeb}
                  onChange={(e) => setSitioWeb(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden"
                />
                <button
                  type="submit"
                  disabled={estado === 'enviando' || !mensaje.trim()}
                  className="btn-primary w-full"
                >
                  {estado === 'enviando' ? 'Enviando...' : 'Enviar idea'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
