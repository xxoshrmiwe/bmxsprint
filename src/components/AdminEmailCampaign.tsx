import { useState } from 'react';
import { enviarCampanaEmail, type ResultadoCampana } from '../lib/adminApi';
import { IconoAlerta, IconoCheck } from './Icono';

interface Props {
  emailAdmin: string;
  totalCorredores: number;
}

const PLANTILLAS = [
  {
    nombre: '⚡ Recordatorio de Entrenamiento',
    asunto: '¡Es hora de entrenar tu salida en GATERIGHT BMX!',
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 12px;">
  <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
    <h1 style="color: #f97316; margin: 0; font-size: 28px; text-transform: uppercase;">GATERIGHT BMX</h1>
    <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Potencia tu arranque de gate</p>
  </div>
  
  <div style="padding: 24px 0;">
    <h2 style="color: #ffffff; font-size: 20px;">¡Hola, corredor! 🏁</h2>
    <p style="color: #cbd5e1; line-height: 1.6; font-size: 16px;">
      Recuerda que la constancia es la clave para ganar centésimas en el gate drop. No dejes pasar el día sin hacer una sesión de arranques.
    </p>

    <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <p style="margin: 0; color: #059669; font-weight: bold;">💡 Consejo del día:</p>
      <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">
        Entrena 5 a 10 sprints con descansos completos para mejorar tus reflejos de reacción al sonido.
      </p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://gaterightbmx.vercel.app" style="background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">
        Iniciar Entrenamiento Ahora
      </a>
    </div>
  </div>

  <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); color: #64748b; font-size: 12px;">
    <p style="margin: 0;">GATERIGHT BMX — Entrena tu gate en cualquier lugar.</p>
  </div>
</div>`
  },
  {
    nombre: '🚀 Nueva Actualización',
    asunto: 'Nuevas funciones disponibles en GATERIGHT BMX',
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 12px;">
  <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
    <h1 style="color: #f97316; margin: 0; font-size: 28px; text-transform: uppercase;">GATERIGHT BMX</h1>
  </div>
  
  <div style="padding: 24px 0;">
    <h2 style="color: #ffffff; font-size: 20px;">¡Tenemos novedades para ti! 🎉</h2>
    <p style="color: #cbd5e1; line-height: 1.6; font-size: 16px;">
      Hemos agregado mejoras en la aplicación para ayudarte a medir con mayor precisión tus entrenamientos y llevar tus estadísticas al siguiente nivel.
    </p>

    <ul style="color: #94a3b8; line-height: 1.8; font-size: 15px; padding-left: 20px;">
      <li><strong style="color: #ffffff;">Mejores estadísticas:</strong> Seguimiento más detallado de tu promedio de tiempos.</li>
      <li><strong style="color: #ffffff;">Calentamiento optimizado:</strong> Nuevas rutinas para evitar lesiones antes de correr.</li>
    </ul>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://gaterightbmx.vercel.app" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">
        Probar la nueva versión
      </a>
    </div>
  </div>

  <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); color: #64748b; font-size: 12px;">
    <p style="margin: 0;">GATERIGHT BMX — La app para corredores de BMX.</p>
  </div>
</div>`
  }
];

export default function AdminEmailCampaign({ emailAdmin, totalCorredores }: Props) {
  const [asunto, setAsunto] = useState(PLANTILLAS[0].asunto);
  const [html, setHtml] = useState(PLANTILLAS[0].html);
  const [tabVisualizacion, setTabVisualizacion] = useState<'editor' | 'preview'>('editor');

  const [esPrueba, setEsPrueba] = useState(true);
  const [emailPrueba, setEmailPrueba] = useState(emailAdmin);

  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCampana | null>(null);
  const [errorMsj, setErrorMsj] = useState<string | null>(null);

  function cargarPlantilla(index: number) {
    const p = PLANTILLAS[index];
    if (p) {
      setAsunto(p.asunto);
      setHtml(p.html);
      setResultado(null);
      setErrorMsj(null);
    }
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    setResultado(null);
    setErrorMsj(null);

    if (!esPrueba) {
      const confirmado = window.confirm(
        `¿Estás seguro de enviar esta campaña a los ${totalCorredores} corredores registrados? Esta acción no se puede deshacer.`
      );
      if (!confirmado) return;
    }

    setEnviando(true);
    try {
      const res = await enviarCampanaEmail({
        asunto,
        html,
        esPrueba,
        emailPrueba: esPrueba ? emailPrueba : undefined
      });
      setResultado(res);
    } catch (err) {
      setErrorMsj(err instanceof Error ? err.message : 'Error al enviar la campaña.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Crear Campaña de Email</h2>
            <p className="text-xs text-muted-foreground">
              Redacta el boletín o mensaje masivo en HTML para enviar a los corredores registrados.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Plantillas rápidas:</span>
            {PLANTILLAS.map((p, idx) => (
              <button
                key={p.nombre}
                type="button"
                onClick={() => cargarPlantilla(idx)}
                className="cursor-pointer rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {p.nombre}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleEnviar} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground" htmlFor="asunto">
              Asunto del correo
            </label>
            <input
              id="asunto"
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej: ¡Nuevo reto esta semana en GATERIGHT BMX!"
              required
              className="input w-full"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Contenido del correo (HTML)</label>
              <div className="flex rounded-lg border border-border bg-surface p-0.5">
                <button
                  type="button"
                  onClick={() => setTabVisualizacion('editor')}
                  className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    tabVisualizacion === 'editor' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Código HTML
                </button>
                <button
                  type="button"
                  onClick={() => setTabVisualizacion('preview')}
                  className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    tabVisualizacion === 'preview' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Vista previa
                </button>
              </div>
            </div>

            {tabVisualizacion === 'editor' ? (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={14}
                required
                className="input w-full font-mono text-xs leading-relaxed"
                placeholder="<h1>Tu HTML aquí...</h1>"
              />
            ) : (
              <div className="min-h-[320px] rounded-xl border border-border bg-slate-900 p-4">
                <div className="mx-auto max-w-[600px] overflow-hidden rounded-lg shadow-lg">
                  <div dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Modo de Envío</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="modoEnvio"
                  checked={esPrueba}
                  onChange={() => setEsPrueba(true)}
                  className="accent-primary"
                />
                <span className="font-medium text-foreground">Envío de prueba (1 correo)</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="modoEnvio"
                  checked={!esPrueba}
                  onChange={() => setEsPrueba(false)}
                  className="accent-primary"
                />
                <span className="font-medium text-foreground">
                  Difusión masiva a todos los corredores ({totalCorredores})
                </span>
              </label>
            </div>

            {esPrueba && (
              <div className="pt-2">
                <label className="mb-1 block text-xs text-muted-foreground" htmlFor="emailPrueba">
                  Enviar prueba a:
                </label>
                <input
                  id="emailPrueba"
                  type="email"
                  value={emailPrueba}
                  onChange={(e) => setEmailPrueba(e.target.value)}
                  placeholder="tu@correo.com"
                  required={esPrueba}
                  className="input max-w-sm"
                />
              </div>
            )}
          </div>

          {errorMsj && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsj}</span>
            </div>
          )}

          {resultado && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">
              <IconoCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">{resultado.mensaje ?? 'Campaña procesada con éxito.'}</p>
                <p className="text-xs opacity-80">Enviados: {resultado.enviados} | Errores: {resultado.errores}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={enviando}
              className={esPrueba ? 'btn-secondary' : 'btn-primary'}
            >
              {enviando
                ? 'Enviando...'
                : esPrueba
                ? 'Enviar correo de prueba'
                : `Enviar campaña a ${totalCorredores} corredores`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
